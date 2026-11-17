package com.evntgrid;

import org.springframework.boot.SpringApplication;

public class TestEvntgridApplication {

	public static void main(String[] args) {
		SpringApplication.from(EvntgridApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
