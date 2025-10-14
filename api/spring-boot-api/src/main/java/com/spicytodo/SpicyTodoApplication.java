package com.spicytodo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpicyTodoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpicyTodoApplication.class, args);
        System.out.println("🌶️  Spicy Todo API (Spring Boot) running on http://localhost:8000");
    }
}

