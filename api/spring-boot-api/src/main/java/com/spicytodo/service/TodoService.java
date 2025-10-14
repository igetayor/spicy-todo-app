package com.spicytodo.service;

import com.spicytodo.model.Priority;
import com.spicytodo.model.Todo;
import com.spicytodo.model.TodoStats;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TodoService {
    private final Map<String, Todo> todos = new ConcurrentHashMap<>();

    public TodoService() {
        loadSampleData();
    }

    public List<Todo> getAllTodos(String filter, String search, String priority) {
        return todos.values().stream()
                .filter(todo -> applyFilters(todo, filter, search, priority))
                .collect(Collectors.toList());
    }

    public Optional<Todo> getTodoById(String id) {
        return Optional.ofNullable(todos.get(id));
    }

    public Todo createTodo(String text, Priority priority, Boolean completed, String dueDate, String reminderTime) {
        Todo todo = new Todo(text, priority, completed, dueDate, reminderTime);
        todos.put(todo.getId(), todo);
        return todo;
    }

    public Optional<Todo> updateTodo(String id, String text, Priority priority, Boolean completed, String dueDate, String reminderTime) {
        Todo todo = todos.get(id);
        if (todo == null) {
            return Optional.empty();
        }

        if (text != null) todo.setText(text);
        if (priority != null) todo.setPriority(priority);
        if (completed != null) todo.setCompleted(completed);
        if (dueDate != null) todo.setDueDate(dueDate);
        if (reminderTime != null) todo.setReminderTime(reminderTime);
        
        todo.updateTimestamp();
        return Optional.of(todo);
    }

    public boolean deleteTodo(String id) {
        return todos.remove(id) != null;
    }

    public Optional<Todo> toggleTodo(String id) {
        Todo todo = todos.get(id);
        if (todo == null) {
            return Optional.empty();
        }

        todo.setCompleted(!todo.getCompleted());
        todo.updateTimestamp();
        return Optional.of(todo);
    }

    public TodoStats getStats() {
        int total = todos.size();
        int active = 0;
        int completed = 0;
        Map<String, Integer> priorityBreakdown = new HashMap<>();
        int overdueCount = 0;
        int dueTodayCount = 0;
        int upcomingCount = 0;

        LocalDate today = LocalDate.now();

        for (Todo todo : todos.values()) {
            if (todo.getCompleted()) {
                completed++;
            } else {
                active++;
            }

            String priorityKey = todo.getPriority().name();
            priorityBreakdown.put(priorityKey, priorityBreakdown.getOrDefault(priorityKey, 0) + 1);

            if (todo.getDueDate() != null && !todo.getCompleted()) {
                try {
                    LocalDate dueDate = LocalDate.parse(todo.getDueDate());
                    if (dueDate.isBefore(today)) {
                        overdueCount++;
                    } else if (dueDate.isEqual(today)) {
                        dueTodayCount++;
                    } else if (dueDate.isAfter(today) && dueDate.isBefore(today.plusDays(8))) {
                        upcomingCount++;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        double completionRate = total > 0 ? (double) completed / total * 100 : 0;

        return new TodoStats(total, active, completed, completionRate, priorityBreakdown, overdueCount, dueTodayCount, upcomingCount);
    }

    public void clearCompleted() {
        todos.entrySet().removeIf(entry -> entry.getValue().getCompleted());
    }

    private boolean applyFilters(Todo todo, String filter, String search, String priority) {
        if ("active".equals(filter) && todo.getCompleted()) {
            return false;
        }
        if ("completed".equals(filter) && !todo.getCompleted()) {
            return false;
        }
        if (priority != null && !priority.isEmpty() && !todo.getPriority().name().equals(priority)) {
            return false;
        }
        if (search != null && !search.isEmpty() && !todo.getText().toLowerCase().contains(search.toLowerCase())) {
            return false;
        }
        return true;
    }

    private void loadSampleData() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        LocalDate nextWeek = today.plusDays(7);
        LocalDate yesterday = today.minusDays(1);

        createSampleTodo("Learn Java Spring Boot", Priority.high, false, tomorrow.toString(), "09:00");
        createSampleTodo("Build REST API with Spring", Priority.high, true, yesterday.toString(), "14:30");
        createSampleTodo("Add JPA database integration", Priority.medium, false, nextWeek.toString(), "16:00");
        createSampleTodo("Write comprehensive tests", Priority.medium, false, null, null);
        createSampleTodo("Deploy to cloud platform", Priority.low, false, null, null);
    }

    private void createSampleTodo(String text, Priority priority, Boolean completed, String dueDate, String reminderTime) {
        Todo todo = new Todo(text, priority, completed, dueDate, reminderTime);
        todos.put(todo.getId(), todo);
    }
}

