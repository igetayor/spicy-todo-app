package com.spicytodo.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TodoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testTodoCreation_WithAllFields_ShouldCreateSuccessfully() {
        Todo todo = new Todo("Test Todo", Priority.high, true, "2024-12-31", "10:00");

        assertNotNull(todo.getId());
        assertEquals("Test Todo", todo.getText());
        assertEquals(Priority.high, todo.getPriority());
        assertTrue(todo.getCompleted());
        assertEquals("2024-12-31", todo.getDueDate());
        assertEquals("10:00", todo.getReminderTime());
        assertNotNull(todo.getCreatedAt());
        assertNotNull(todo.getUpdatedAt());
    }

    @Test
    void testTodoCreation_WithNullPriority_ShouldUseDefault() {
        Todo todo = new Todo("Test Todo", null, false, null, null);

        assertEquals(Priority.medium, todo.getPriority());
    }

    @Test
    void testTodoCreation_WithNullCompleted_ShouldUseDefault() {
        Todo todo = new Todo("Test Todo", Priority.high, null, null, null);

        assertFalse(todo.getCompleted());
    }

    @Test
    void testUpdateTimestamp_ShouldUpdateUpdatedAt() {
        Todo todo = new Todo("Test Todo", Priority.high, false, null, null);
        LocalDateTime originalUpdatedAt = todo.getUpdatedAt();

        // Wait a bit to ensure timestamp changes
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        todo.updateTimestamp();

        assertTrue(todo.getUpdatedAt().isAfter(originalUpdatedAt));
    }

    @Test
    void testTodoValidation_ValidTodo_ShouldPass() {
        Todo todo = new Todo("Valid Todo Text", Priority.high, false, null, null);

        Set<ConstraintViolation<Todo>> violations = validator.validate(todo);

        assertTrue(violations.isEmpty());
    }

    @Test
    void testTodoValidation_EmptyText_ShouldFail() {
        Todo todo = new Todo();
        todo.setText("");
        todo.setPriority(Priority.medium);

        Set<ConstraintViolation<Todo>> violations = validator.validate(todo);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("required")));
    }

    @Test
    void testTodoValidation_NullText_ShouldFail() {
        Todo todo = new Todo();
        todo.setText(null);
        todo.setPriority(Priority.medium);

        Set<ConstraintViolation<Todo>> violations = validator.validate(todo);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("required")));
    }

    @Test
    void testTodoValidation_TextTooLong_ShouldFail() {
        Todo todo = new Todo();
        todo.setText("a".repeat(501)); // 501 characters
        todo.setPriority(Priority.medium);

        Set<ConstraintViolation<Todo>> violations = validator.validate(todo);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("500")));
    }

    @Test
    void testTodoValidation_TextAtMaxLength_ShouldPass() {
        Todo todo = new Todo();
        todo.setText("a".repeat(500)); // Exactly 500 characters
        todo.setPriority(Priority.medium);

        Set<ConstraintViolation<Todo>> violations = validator.validate(todo);

        assertTrue(violations.isEmpty());
    }

    @Test
    void testTodoSettersAndGetters() {
        Todo todo = new Todo();

        todo.setId("test-id");
        todo.setText("Test Text");
        todo.setPriority(Priority.low);
        todo.setCompleted(true);
        todo.setDueDate("2024-12-31");
        todo.setReminderTime("15:30");
        LocalDateTime now = LocalDateTime.now();
        todo.setCreatedAt(now);
        todo.setUpdatedAt(now);

        assertEquals("test-id", todo.getId());
        assertEquals("Test Text", todo.getText());
        assertEquals(Priority.low, todo.getPriority());
        assertTrue(todo.getCompleted());
        assertEquals("2024-12-31", todo.getDueDate());
        assertEquals("15:30", todo.getReminderTime());
        assertEquals(now, todo.getCreatedAt());
        assertEquals(now, todo.getUpdatedAt());
    }

    @Test
    void testTodoEqualsAndHashCode() {
        Todo todo1 = new Todo("Test", Priority.high, false, null, null);
        String id = todo1.getId();
        
        Todo todo2 = new Todo();
        todo2.setId(id);
        todo2.setText("Different");
        
        // Two todos with same ID should be considered equal
        assertEquals(todo1.getId(), todo2.getId());
        assertEquals(todo1.hashCode(), todo2.hashCode());
    }

    @Test
    void testTodoToString() {
        Todo todo = new Todo("Test Todo", Priority.high, false, "2024-12-31", "10:00");

        String toString = todo.toString();

        assertNotNull(toString);
        assertTrue(toString.contains("Test Todo"));
        assertTrue(toString.contains("high"));
    }
}

