package com.spicytodo.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TodoCreateRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRequest_ShouldPassValidation() {
        TodoCreateRequest request = new TodoCreateRequest();
        request.setText("Valid todo text");
        request.setPriority(com.spicytodo.model.Priority.high);
        request.setCompleted(false);
        request.setDueDate("2024-12-31");
        request.setReminderTime("10:00");

        Set<ConstraintViolation<TodoCreateRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void testNullText_ShouldFailValidation() {
        TodoCreateRequest request = new TodoCreateRequest();
        request.setText(null);

        Set<ConstraintViolation<TodoCreateRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("required")));
    }

    @Test
    void testEmptyText_ShouldFailValidation() {
        TodoCreateRequest request = new TodoCreateRequest();
        request.setText("");

        Set<ConstraintViolation<TodoCreateRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("required")));
    }

    @Test
    void testTextTooLong_ShouldFailValidation() {
        TodoCreateRequest request = new TodoCreateRequest();
        request.setText("a".repeat(501)); // 501 characters

        Set<ConstraintViolation<TodoCreateRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("500")));
    }

    @Test
    void testGettersAndSetters() {
        TodoCreateRequest request = new TodoCreateRequest();
        
        request.setText("Test");
        request.setPriority(com.spicytodo.model.Priority.medium);
        request.setCompleted(true);
        request.setDueDate("2024-12-31");
        request.setReminderTime("10:00");

        assertEquals("Test", request.getText());
        assertEquals(com.spicytodo.model.Priority.medium, request.getPriority());
        assertTrue(request.getCompleted());
        assertEquals("2024-12-31", request.getDueDate());
        assertEquals("10:00", request.getReminderTime());
    }

    @Test
    void testAllArgsConstructor() {
        TodoCreateRequest request = new TodoCreateRequest(
                "Test Todo",
                com.spicytodo.model.Priority.high,
                false,
                "2024-12-31",
                "10:00"
        );

        assertEquals("Test Todo", request.getText());
        assertEquals(com.spicytodo.model.Priority.high, request.getPriority());
        assertFalse(request.getCompleted());
        assertEquals("2024-12-31", request.getDueDate());
        assertEquals("10:00", request.getReminderTime());
    }

    @Test
    void testNoArgsConstructor() {
        TodoCreateRequest request = new TodoCreateRequest();

        assertNotNull(request);
        assertNull(request.getText());
        assertNull(request.getPriority());
        assertNull(request.getCompleted());
        assertNull(request.getDueDate());
        assertNull(request.getReminderTime());
    }
}

