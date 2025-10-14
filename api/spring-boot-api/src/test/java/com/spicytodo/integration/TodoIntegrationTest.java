package com.spicytodo.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spicytodo.dto.TodoCreateRequest;
import com.spicytodo.dto.TodoUpdateRequest;
import com.spicytodo.model.Priority;
import com.spicytodo.model.Todo;
import com.spicytodo.model.TodoStats;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TodoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testFullTodoLifecycle() throws Exception {
        // 1. Create a todo
        TodoCreateRequest createRequest = new TodoCreateRequest();
        createRequest.setText("Integration Test Todo");
        createRequest.setPriority(Priority.high);
        createRequest.setCompleted(false);
        createRequest.setDueDate("2024-12-31");
        createRequest.setReminderTime("10:00");

        String createResponse = mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("Integration Test Todo"))
                .andExpect(jsonPath("$.priority").value("high"))
                .andExpect(jsonPath("$.completed").value(false))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Todo createdTodo = objectMapper.readValue(createResponse, Todo.class);
        String todoId = createdTodo.getId();
        assertNotNull(todoId);

        // 2. Get the todo by ID
        mockMvc.perform(get("/api/todos/" + todoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(todoId))
                .andExpect(jsonPath("$.text").value("Integration Test Todo"));

        // 3. Update the todo
        TodoUpdateRequest updateRequest = new TodoUpdateRequest();
        updateRequest.setText("Updated Integration Test Todo");
        updateRequest.setPriority(Priority.medium);
        updateRequest.setCompleted(true);

        mockMvc.perform(put("/api/todos/" + todoId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Updated Integration Test Todo"))
                .andExpect(jsonPath("$.priority").value("medium"))
                .andExpect(jsonPath("$.completed").value(true));

        // 4. Toggle the todo
        mockMvc.perform(patch("/api/todos/" + todoId + "/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false));

        // 5. Get all todos
        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 6. Get stats
        mockMvc.perform(get("/api/todos/stats/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").exists())
                .andExpect(jsonPath("$.active").exists())
                .andExpect(jsonPath("$.completed").exists());

        // 7. Delete the todo
        mockMvc.perform(delete("/api/todos/" + todoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Todo deleted successfully"));

        // 8. Verify deletion
        mockMvc.perform(get("/api/todos/" + todoId))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateAndFilterTodos() throws Exception {
        // Create multiple todos
        for (int i = 0; i < 3; i++) {
            TodoCreateRequest request = new TodoCreateRequest();
            request.setText("Test Todo " + i);
            request.setPriority(i % 2 == 0 ? Priority.high : Priority.low);
            request.setCompleted(i % 2 == 0);

            mockMvc.perform(post("/api/todos")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        // Test filtering by active
        mockMvc.perform(get("/api/todos")
                .param("filter", "active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Test filtering by completed
        mockMvc.perform(get("/api/todos")
                .param("filter", "completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Test filtering by priority
        mockMvc.perform(get("/api/todos")
                .param("priority", "high"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Test search
        mockMvc.perform(get("/api/todos")
                .param("search", "Test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testClearCompleted() throws Exception {
        // Create completed todos
        for (int i = 0; i < 2; i++) {
            TodoCreateRequest request = new TodoCreateRequest();
            request.setText("Completed Todo " + i);
            request.setCompleted(true);

            mockMvc.perform(post("/api/todos")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        // Clear completed
        mockMvc.perform(delete("/api/todos/completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Completed todos cleared"));

        // Verify active todos still exist
        mockMvc.perform(get("/api/todos")
                .param("filter", "active"))
                .andExpect(status().isOk());
    }

    @Test
    void testValidationErrors() throws Exception {
        // Test empty text
        TodoCreateRequest invalidRequest = new TodoCreateRequest();
        invalidRequest.setText("");

        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        // Test text too long
        invalidRequest.setText("a".repeat(501));

        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testNotFoundScenarios() throws Exception {
        // Get non-existent todo
        mockMvc.perform(get("/api/todos/non-existent-id"))
                .andExpect(status().isNotFound());

        // Update non-existent todo
        TodoUpdateRequest updateRequest = new TodoUpdateRequest();
        updateRequest.setText("Updated");

        mockMvc.perform(put("/api/todos/non-existent-id")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());

        // Delete non-existent todo
        mockMvc.perform(delete("/api/todos/non-existent-id"))
                .andExpect(status().isNotFound());

        // Toggle non-existent todo
        mockMvc.perform(patch("/api/todos/non-existent-id/toggle"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testHealthEndpoints() throws Exception {
        // Test root endpoint
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.version").exists());

        // Test health endpoint
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"));
    }
}

