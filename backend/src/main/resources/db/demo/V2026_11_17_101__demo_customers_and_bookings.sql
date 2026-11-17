-- DEMO DATA for local development and demos only: sample customers and bookings, so the admin portal's Customers,
-- Bookings and Commission pages, and a customer's My bookings page, have something to show on a fresh database.
-- Every customer is fictional (+91 90000 0000x numbers, names start with "Demo"). In development mode any of these
-- numbers can sign in: the sign-in code is shown on screen. The bookings use the demo vendors from the marketplace
-- seed and record the 5% commission in force, exactly as a real checkout does. Amounts are in paise.
-- Switch off with DEMO_DATA_MIGRATIONS= (empty), like the rest of db/demo.

INSERT INTO identity.user_account (phone_e164, display_name, last_sign_in_at) VALUES
    ('+919000000001', 'Demo Customer Anita', now() - interval '3 days'),
    ('+919000000002', 'Demo Customer Ravi',  now() - interval '2 days'),
    ('+919000000003', 'Demo Customer Meera', now() - interval '1 day');

INSERT INTO identity.user_role (user_id, role_code)
SELECT id, 'CUSTOMER' FROM identity.user_account WHERE phone_e164 IN ('+919000000001', '+919000000002', '+919000000003');

-- Bookings: the advance is 20% of the total, paid online; the balance is paid to the vendors later.
INSERT INTO booking.booking (reference, user_id, status, total_minor, advance_percent, advance_minor, balance_minor,
                             advance_paid_at, created_at, updated_at)
SELECT b.ref, u.id, b.status, b.total, 20, b.advance, b.total - b.advance,
       CASE WHEN b.status = 'ADVANCE_PAID' THEN now() - b.age + interval '4 minutes' END,
       now() - b.age, now() - b.age
FROM (VALUES
    ('EG-DEMO-0001', '+919000000001', 'ADVANCE_PAID',    6000000::bigint, 1200000::bigint, interval '12 days'),
    ('EG-DEMO-0002', '+919000000002', 'ADVANCE_PAID',    6500000::bigint, 1300000::bigint, interval '8 days'),
    ('EG-DEMO-0003', '+919000000001', 'ADVANCE_PAID',   17000000::bigint, 3400000::bigint, interval '4 days'),
    ('EG-DEMO-0004', '+919000000003', 'PENDING_PAYMENT', 1800000::bigint,  360000::bigint, interval '1 day'),
    ('EG-DEMO-0005', '+919000000003', 'PAYMENT_FAILED',  1200000::bigint,  240000::bigint, interval '2 days'),
    ('EG-DEMO-0006', '+919000000002', 'ADVANCE_PAID',    1500000::bigint,  300000::bigint, interval '2 days')
) AS b(ref, phone, status, total, advance, age)
JOIN identity.user_account u ON u.phone_e164 = b.phone;

-- Items: package details are copied at checkout, and so is the commission (500 basis points = 5%, rounded half up).
INSERT INTO booking.booking_item (booking_id, package_id, provider_id, provider_name, listing_title, package_title,
                                  category_name, price_unit, unit_price_minor, quantity, line_total_minor, event_date,
                                  notes, commission_bps, commission_minor)
SELECT bk.id, uuidv7(), p.id, p.display_name, i.listing, i.package, i.category, i.unit, i.price, i.qty, i.price * i.qty,
       current_date + i.days, i.notes, 500, (i.price * i.qty * 500 + 5000) / 10000
FROM (VALUES
    ('EG-DEMO-0001', 'demo-lotus-banquets',        'Banquet hall',        'Full-day hall booking',  'Venues',      'FIXED',     6000000::bigint, 1,   45, 'Wedding reception, about 300 guests'),
    ('EG-DEMO-0002', 'demo-frames-photography',    'Wedding photography', 'Signature photography',  'Photography', 'FIXED',     2500000::bigint, 1,   60, 'Candid photos and a short film'),
    ('EG-DEMO-0002', 'demo-bloom-decorators',      'Stage decoration',    'Stage and entrance',     'Decoration',  'FIXED',     4000000::bigint, 1,   60, NULL),
    ('EG-DEMO-0003', 'demo-spice-caterers',        'Catering',            'Veg lunch buffet',       'Food',        'PER_GUEST',   85000::bigint, 200, 75, 'Lunch for 200 guests'),
    ('EG-DEMO-0004', 'demo-beats-dj',              'DJ and sound',        'Evening DJ set',         'Music',       'FIXED',     1800000::bigint, 1,   30, 'Birthday party, 4 hours'),
    ('EG-DEMO-0005', 'demo-glow-makeup-studio',    'Bridal makeup',       'Bridal makeup package',  'Makeup',      'FIXED',     1200000::bigint, 1,   40, NULL),
    ('EG-DEMO-0006', 'demo-wedding-wear-rentals',  'Wedding wear rental', 'Groom outfit rental',    'Wearables',   'FIXED',     1500000::bigint, 1,   50, NULL)
) AS i(ref, provider_slug, listing, package, category, unit, price, qty, days, notes)
JOIN booking.booking bk ON bk.reference = i.ref
JOIN provider.provider p ON p.slug = i.provider_slug;
