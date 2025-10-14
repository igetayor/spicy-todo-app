package com.spicytodo.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Todo {
    private String id;

    @NotBlank(message = "Todo text is required")
    @Size(min = 1, max = 500, message = "Todo text must be between 1 and 500 characters")
    private String text;

    private Priority priority = Priority.medium;
    private Boolean completed = false;
    private String dueDate;
    private String reminderTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Todo(String text, Priority priority, Boolean completed, String dueDate, String reminderTime) {
        this.id = UUID.randomUUID().toString();
        this.text = text;
        this.priority = priority != null ? priority : Priority.medium;
        this.completed = completed != null ? completed : false;
        this.dueDate = dueDate;
        this.reminderTime = reminderTime;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}

