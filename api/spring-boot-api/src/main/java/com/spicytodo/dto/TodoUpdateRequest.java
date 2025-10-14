package com.spicytodo.dto;

import com.spicytodo.model.Priority;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TodoUpdateRequest {
    @Size(min = 1, max = 500, message = "Todo text must be between 1 and 500 characters")
    private String text;
    
    private Priority priority;
    private Boolean completed;
    private String dueDate;
    private String reminderTime;
}

