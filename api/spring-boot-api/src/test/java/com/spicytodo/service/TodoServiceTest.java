package com.spicytodo.service;

import com.spicytodo.model.Priority;
import com.spicytodo.model.Todo;
import com.spicytodo.model.TodoStats;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class TodoServiceTest {

    private TodoService todoService;

    @BeforeEach
    void setUp() {
        todoService = new TodoService();
        // Clear sample data by creating a fresh service
        todoService.clearCompleted();
        // Clear all todos for clean test state
        List<Todo> allTodos = todoService.getAllTodos(null, null, null);
        allTodos.forEach(todo -> todoService.deleteTodo(todo.getId()));
    }

    @Test
    void testCreateTodo_ShouldCreateSuccessfully() {
        Todo todo = todoService.createTodo("Test Todo", Priority.high, false, "2024-12-31", "10:00");

        assertNotNull(todo);
        assertNotNull(todo.getId());
        assertEquals("Test Todo", todo.getText());
        assertEquals(Priority.high, todo.getPriority());
        assertFalse(todo.getCompleted());
        assertEquals("2024-12-31", todo.getDueDate());
        assertEquals("10:00", todo.getReminderTime());
        assertNotNull(todo.getCreatedAt());
        assertNotNull(todo.getUpdatedAt());
    }

    @Test
    void testCreateTodo_WithNullValues_ShouldUseDefaults() {
        Todo todo = todoService.createTodo("Test Todo", null, null, null, null);

        assertNotNull(todo);
        assertEquals(Priority.medium, todo.getPriority());
        assertFalse(todo.getCompleted());
        assertNull(todo.getDueDate());
        assertNull(todo.getReminderTime());
    }

    @Test
    void testGetAllTodos_ShouldReturnAllTodos() {
        todoService.createTodo("Todo 1", Priority.high, false, null, null);
        todoService.createTodo("Todo 2", Priority.medium, true, null, null);
        todoService.createTodo("Todo 3", Priority.low, false, null, null);

        List<Todo> todos = todoService.getAllTodos(null, null, null);

        assertEquals(3, todos.size());
    }

    @Test
    void testGetAllTodos_WithActiveFilter_ShouldReturnOnlyActive() {
        todoService.createTodo("Active 1", Priority.high, false, null, null);
        todoService.createTodo("Completed 1", Priority.medium, true, null, null);
        todoService.createTodo("Active 2", Priority.low, false, null, null);

        List<Todo> todos = todoService.getAllTodos("active", null, null);

        assertEquals(2, todos.size());
        todos.forEach(todo -> assertFalse(todo.getCompleted()));
    }

    @Test
    void testGetAllTodos_WithCompletedFilter_ShouldReturnOnlyCompleted() {
        todoService.createTodo("Active 1", Priority.high, false, null, null);
        todoService.createTodo("Completed 1", Priority.medium, true, null, null);
        todoService.createTodo("Completed 2", Priority.low, true, null, null);

        List<Todo> todos = todoService.getAllTodos("completed", null, null);

        assertEquals(2, todos.size());
        todos.forEach(todo -> assertTrue(todo.getCompleted()));
    }

    @Test
    void testGetAllTodos_WithSearchFilter_ShouldReturnMatchingTodos() {
        todoService.createTodo("Buy groceries", Priority.high, false, null, null);
        todoService.createTodo("Buy milk", Priority.medium, false, null, null);
        todoService.createTodo("Clean house", Priority.low, false, null, null);

        List<Todo> todos = todoService.getAllTodos(null, "buy", null);

        assertEquals(2, todos.size());
        assertTrue(todos.stream().allMatch(todo -> todo.getText().toLowerCase().contains("buy")));
    }

    @Test
    void testGetAllTodos_WithPriorityFilter_ShouldReturnMatchingPriority() {
        todoService.createTodo("High Priority", Priority.high, false, null, null);
        todoService.createTodo("Medium Priority", Priority.medium, false, null, null);
        todoService.createTodo("Low Priority", Priority.low, false, null, null);

        List<Todo> todos = todoService.getAllTodos(null, null, "high");

        assertEquals(1, todos.size());
        assertEquals(Priority.high, todos.get(0).getPriority());
    }

    @Test
    void testGetAllTodos_WithMultipleFilters_ShouldApplyAllFilters() {
        todoService.createTodo("High active task", Priority.high, false, null, null);
        todoService.createTodo("High completed task", Priority.high, true, null, null);
        todoService.createTodo("Low active task", Priority.low, false, null, null);

        List<Todo> todos = todoService.getAllTodos("active", "task", "high");

        assertEquals(1, todos.size());
        assertEquals("High active task", todos.get(0).getText());
    }

    @Test
    void testGetTodoById_ExistingId_ShouldReturnTodo() {
        Todo created = todoService.createTodo("Test Todo", Priority.high, false, null, null);

        Optional<Todo> found = todoService.getTodoById(created.getId());

        assertTrue(found.isPresent());
        assertEquals(created.getId(), found.get().getId());
        assertEquals("Test Todo", found.get().getText());
    }

    @Test
    void testGetTodoById_NonExistentId_ShouldReturnEmpty() {
        Optional<Todo> found = todoService.getTodoById("non-existent-id");

        assertFalse(found.isPresent());
    }

    @Test
    void testUpdateTodo_ExistingId_ShouldUpdateSuccessfully() {
        Todo created = todoService.createTodo("Original", Priority.low, false, null, null);
        LocalDateTime originalUpdatedAt = created.getUpdatedAt();

        // Wait a bit to ensure timestamp changes
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        Optional<Todo> updated = todoService.updateTodo(
                created.getId(),
                "Updated",
                Priority.high,
                true,
                "2024-12-31",
                "10:00"
        );

        assertTrue(updated.isPresent());
        assertEquals("Updated", updated.get().getText());
        assertEquals(Priority.high, updated.get().getPriority());
        assertTrue(updated.get().getCompleted());
        assertEquals("2024-12-31", updated.get().getDueDate());
        assertEquals("10:00", updated.get().getReminderTime());
        assertTrue(updated.get().getUpdatedAt().isAfter(originalUpdatedAt));
    }

    @Test
    void testUpdateTodo_PartialUpdate_ShouldUpdateOnlyProvidedFields() {
        Todo created = todoService.createTodo("Original", Priority.medium, false, "2024-01-01", "09:00");

        Optional<Todo> updated = todoService.updateTodo(
                created.getId(),
                "Updated Text",
                null,
                null,
                null,
                null
        );

        assertTrue(updated.isPresent());
        assertEquals("Updated Text", updated.get().getText());
        assertEquals(Priority.medium, updated.get().getPriority()); // Unchanged
        assertFalse(updated.get().getCompleted()); // Unchanged
        assertEquals("2024-01-01", updated.get().getDueDate()); // Unchanged
        assertEquals("09:00", updated.get().getReminderTime()); // Unchanged
    }

    @Test
    void testUpdateTodo_NonExistentId_ShouldReturnEmpty() {
        Optional<Todo> updated = todoService.updateTodo(
                "non-existent-id",
                "Updated",
                Priority.high,
                true,
                null,
                null
        );

        assertFalse(updated.isPresent());
    }

    @Test
    void testDeleteTodo_ExistingId_ShouldReturnTrue() {
        Todo created = todoService.createTodo("To Delete", Priority.high, false, null, null);

        boolean deleted = todoService.deleteTodo(created.getId());

        assertTrue(deleted);
        assertFalse(todoService.getTodoById(created.getId()).isPresent());
    }

    @Test
    void testDeleteTodo_NonExistentId_ShouldReturnFalse() {
        boolean deleted = todoService.deleteTodo("non-existent-id");

        assertFalse(deleted);
    }

    @Test
    void testToggleTodo_FromIncompleteToComplete_ShouldToggle() {
        Todo created = todoService.createTodo("Test", Priority.high, false, null, null);

        Optional<Todo> toggled = todoService.toggleTodo(created.getId());

        assertTrue(toggled.isPresent());
        assertTrue(toggled.get().getCompleted());
    }

    @Test
    void testToggleTodo_FromCompleteToIncomplete_ShouldToggle() {
        Todo created = todoService.createTodo("Test", Priority.high, true, null, null);

        Optional<Todo> toggled = todoService.toggleTodo(created.getId());

        assertTrue(toggled.isPresent());
        assertFalse(toggled.get().getCompleted());
    }

    @Test
    void testToggleTodo_NonExistentId_ShouldReturnEmpty() {
        Optional<Todo> toggled = todoService.toggleTodo("non-existent-id");

        assertFalse(toggled.isPresent());
    }

    @Test
    void testGetStats_ShouldReturnCorrectStats() {
        // Create todos with different states
        todoService.createTodo("High active", Priority.high, false, null, null);
        todoService.createTodo("Medium completed", Priority.medium, true, null, null);
        todoService.createTodo("Low active", Priority.low, false, null, null);
        todoService.createTodo("High active 2", Priority.high, false, null, null);

        TodoStats stats = todoService.getStats();

        assertEquals(4, stats.getTotal());
        assertEquals(3, stats.getActive());
        assertEquals(1, stats.getCompleted());
        assertEquals(25.0, stats.getCompletionRate(), 0.01);
        assertEquals(2, stats.getPriorityBreakdown().get("high"));
        assertEquals(1, stats.getPriorityBreakdown().get("medium"));
        assertEquals(1, stats.getPriorityBreakdown().get("low"));
    }

    @Test
    void testGetStats_WithDueDates_ShouldCalculateCorrectly() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate tomorrow = today.plusDays(1);
        LocalDate nextWeek = today.plusDays(7);

        todoService.createTodo("Overdue", Priority.high, false, yesterday.toString(), null);
        todoService.createTodo("Due today", Priority.medium, false, today.toString(), null);
        todoService.createTodo("Upcoming", Priority.low, false, tomorrow.toString(), null);
        todoService.createTodo("Future", Priority.low, false, nextWeek.toString(), null);

        TodoStats stats = todoService.getStats();

        assertEquals(1, stats.getOverdueCount());
        assertEquals(1, stats.getDueTodayCount());
        assertEquals(1, stats.getUpcomingCount());
    }

    @Test
    void testClearCompleted_ShouldRemoveAllCompletedTodos() {
        todoService.createTodo("Active 1", Priority.high, false, null, null);
        todoService.createTodo("Completed 1", Priority.medium, true, null, null);
        todoService.createTodo("Active 2", Priority.low, false, null, null);
        todoService.createTodo("Completed 2", Priority.high, true, null, null);

        todoService.clearCompleted();

        List<Todo> remaining = todoService.getAllTodos(null, null, null);
        assertEquals(2, remaining.size());
        remaining.forEach(todo -> assertFalse(todo.getCompleted()));
    }

    @Test
    void testClearCompleted_NoCompletedTodos_ShouldNotFail() {
        todoService.createTodo("Active 1", Priority.high, false, null, null);
        todoService.createTodo("Active 2", Priority.medium, false, null, null);

        assertDoesNotThrow(() -> todoService.clearCompleted());

        List<Todo> remaining = todoService.getAllTodos(null, null, null);
        assertEquals(2, remaining.size());
    }

    @Test
    void testClearCompleted_AllCompleted_ShouldClearAll() {
        todoService.createTodo("Completed 1", Priority.high, true, null, null);
        todoService.createTodo("Completed 2", Priority.medium, true, null, null);

        todoService.clearCompleted();

        List<Todo> remaining = todoService.getAllTodos(null, null, null);
        assertEquals(0, remaining.size());
    }
}

