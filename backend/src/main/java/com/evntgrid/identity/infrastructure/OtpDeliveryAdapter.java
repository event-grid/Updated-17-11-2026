package com.evntgrid.identity.infrastructure;

import com.evntgrid.identity.application.OtpDelivery;
import com.evntgrid.identity.domain.OtpChannel;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

/**
 * Email codes go out over SMTP when SMTP_HOST is set. SMS has no gateway yet (provider not decided), so
 * {@link #isConfigured} is false for PHONE and sign-in by phone relies on development mode for now.
 * Codes are never logged.
 */
@Component
class OtpDeliveryAdapter implements OtpDelivery {

    private static final Logger log = LoggerFactory.getLogger(OtpDeliveryAdapter.class);

    private final SmtpProperties smtp;
    private final JavaMailSenderImpl mailSender;

    OtpDeliveryAdapter(SmtpProperties smtp) {
        this.smtp = smtp;
        this.mailSender = smtp.isConfigured() ? mailSender(smtp) : null;
    }

    @Override
    public boolean isConfigured(OtpChannel channel) {
        return switch (channel) {
            case EMAIL -> mailSender != null;
            case PHONE -> false;
        };
    }

    @Override
    public void send(OtpChannel channel, String destination, String code) {
        if (channel != OtpChannel.EMAIL || mailSender == null) {
            throw new IllegalStateException("No sender configured for " + channel);
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(smtp.from() != null && !smtp.from().isBlank() ? smtp.from() : smtp.username());
        message.setTo(destination);
        message.setSubject("Your EVENTGRID sign-in code: " + code);
        message.setText("""
                Your EVENTGRID sign-in code is %s

                It expires in a few minutes. If you did not ask for it, you can ignore this email.
                """.formatted(code));
        try {
            mailSender.send(message);
        } catch (MailException e) {
            log.warn("Sign-in email could not be sent through {}:{}", smtp.host(), smtp.port(), e);
            throw new DeliveryFailedException("The email could not be sent.", e);
        }
    }

    private static JavaMailSenderImpl mailSender(SmtpProperties smtp) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(smtp.host());
        sender.setPort(smtp.port());
        sender.setDefaultEncoding("UTF-8");
        boolean auth = smtp.username() != null && !smtp.username().isBlank();
        if (auth) {
            sender.setUsername(smtp.username());
            sender.setPassword(smtp.password());
        }
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", String.valueOf(auth));
        props.put("mail.smtp.starttls.enable", String.valueOf(smtp.starttls()));
        // Port 465 is SMTP over TLS from the first byte (SMTPS); 587 and 25 upgrade with STARTTLS.
        props.put("mail.smtp.ssl.enable", String.valueOf(smtp.port() == 465));
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        return sender;
    }
}
