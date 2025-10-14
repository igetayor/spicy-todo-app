package com.spicytodo.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TodoUpdateRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRequest_ShouldPassValidation() {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText("Updated text");
        request.setPriority(com.spicytodo.model.Priority.high);
        request.setCompleted(true);
        request.setDueDate("2024-12-31");
        request.setReminderTime("10:00");

        Set<ConstraintViolation<TodoUpdateRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void testNullText_ShouldPassValidation() {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText(null);

        Set<ConstraintViolation<TodoUpdateRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void testEmptyText_ShouldFailValidation() {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText("");

        Set<ConstraintViolation<TodoUpdateRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void testTextTooLong_ShouldFailValidation() {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText("a".repeat(501)); // 501 characters

        Set<ConstraintViolation<TodoUpdateRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("500")));
    }

    @Test
    void testGettersAndSetters() {
        TodoUpdateRequest request = new TodoUpdateRequest();
        
        request.setText("Updated");
        request.setPriority(com.spicytodo.model.Priority.low);
        request.setCompleted(false);
        request.setDueDate("2025-01-01");
        request.setReminderTime("15:00");

        assertEquals("Updated", request.getText());
        assertEquals(com.spicytodo.model.Priority.low, request.getPriority());
        assertFalse(request.getCompleted());
        assertEquals("2025-01-01", request.getDueDate());
        assertEquals("15:00", request.getReminderTime());
    }

    @Test
    void testAllArgsConstructor() {
        TodoUpdateRequest request = new TodoUpdateRequest(
                "Updated Todo",
                com.spicytodo.model.Priority.medium,
                true,
                "2024-12-31",
                "10:00"
        );

        assertEquals("Updated Todo", request.getText());
        assertEquals(com.spicytodo.model.Priority.medium, request.getPriority());
        assertTrue(request.getCompleted());
        assertEquals("2024-12-31", request.getDueDate());
        assertEquals("10:00", request.getReminderTime());
    }

    @Test
    void testNoArgsConstructor() {
        TodoUpdateRequest request = new TodoUpdateRequest();

        assertNotNull(request);
        assertNull(request.getText());
        assertNull(request.getPriority());
        assertNull(request.getCompleted());
        assertNull(request.getDueDate());
        assertNull(request.getReminderTime());
    }

    @Test
    void testPartialUpdate_ShouldAllowNullValues() {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText("Only update text");

        Set<ConstraintViolation<TodoUpdateRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
        assertEquals("Only update text", request.getText());
        assertNull(request.getPriority());
        assertNull(request.getCompleted());
    }
}

