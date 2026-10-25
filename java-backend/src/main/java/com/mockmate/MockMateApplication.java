package com.mockmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MockMateApplication {
    public static void main(String[] args) {
        SpringApplication.run(MockMateApplication.class, args);
    }
}
