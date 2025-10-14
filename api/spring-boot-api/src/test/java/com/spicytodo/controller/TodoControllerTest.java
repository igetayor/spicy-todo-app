package com.spicytodo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spicytodo.dto.TodoCreateRequest;
import com.spicytodo.dto.TodoUpdateRequest;
import com.spicytodo.model.Priority;
import com.spicytodo.model.Todo;
import com.spicytodo.service.TodoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
class TodoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TodoService todoService;

    private Todo testTodo;

    @BeforeEach
    void setUp() {
        testTodo = new Todo();
        testTodo.setId("test-id-123");
        testTodo.setText("Test Todo");
        testTodo.setPriority(Priority.high);
        testTodo.setCompleted(false);
        testTodo.setDueDate("2024-12-31");
        testTodo.setReminderTime("10:00");
        testTodo.setCreatedAt(LocalDateTime.now());
        testTodo.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void testGetAllTodos_ShouldReturn200() throws Exception {
        List<Todo> todos = Arrays.asList(testTodo);
        when(todoService.getAllTodos(null, null, null)).thenReturn(todos);

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("test-id-123"))
                .andExpect(jsonPath("$[0].text").value("Test Todo"))
                .andExpect(jsonPath("$[0].priority").value("high"));

        verify(todoService, times(1)).getAllTodos(null, null, null);
    }

    @Test
    void testGetAllTodos_WithFilters_ShouldReturn200() throws Exception {
        List<Todo> todos = Arrays.asList(testTodo);
        when(todoService.getAllTodos("active", "test", "high")).thenReturn(todos);

        mockMvc.perform(get("/api/todos")
                .param("filter", "active")
                .param("search", "test")
                .param("priority", "high"))
                .andExpect(status().isOk());

        verify(todoService, times(1)).getAllTodos("active", "test", "high");
    }

    @Test
    void testGetTodoById_ShouldReturn200() throws Exception {
        when(todoService.getTodoById("test-id-123")).thenReturn(Optional.of(testTodo));

        mockMvc.perform(get("/api/todos/test-id-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("test-id-123"))
                .andExpect(jsonPath("$.text").value("Test Todo"));

        verify(todoService, times(1)).getTodoById("test-id-123");
    }

    @Test
    void testGetTodoById_NotFound_ShouldReturn404() throws Exception {
        when(todoService.getTodoById("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/todos/non-existent"))
                .andExpect(status().isNotFound());

        verify(todoService, times(1)).getTodoById("non-existent");
    }

    @Test
    void testCreateTodo_ShouldReturn201() throws Exception {
        TodoCreateRequest request = new TodoCreateRequest();
        request.setText("New Todo");
        request.setPriority(Priority.medium);
        request.setCompleted(false);
        request.setDueDate("2024-12-31");
        request.setReminderTime("10:00");

        Todo createdTodo = new Todo();
        createdTodo.setId("new-id");
        createdTodo.setText("New Todo");

        when(todoService.createTodo(anyString(), any(), any(), anyString(), anyString()))
                .thenReturn(createdTodo);

        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("New Todo"));

        verify(todoService, times(1)).createTodo(eq("New Todo"), eq(Priority.medium), 
                eq(false), eq("2024-12-31"), eq("10:00"));
    }

    @Test
    void testCreateTodo_InvalidData_ShouldReturn400() throws Exception {
        TodoCreateRequest request = new TodoCreateRequest();
        request.setText(""); // Invalid: empty text

        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(todoService, never()).createTodo(anyString(), any(), any(), anyString(), anyString());
    }

    @Test
    void testUpdateTodo_ShouldReturn200() throws Exception {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText("Updated Todo");
        request.setPriority(Priority.high);
        request.setCompleted(true);

        Todo updatedTodo = new Todo();
        updatedTodo.setId("test-id-123");
        updatedTodo.setText("Updated Todo");
        updatedTodo.setCompleted(true);

        when(todoService.updateTodo(anyString(), anyString(), any(), any(), anyString(), anyString()))
                .thenReturn(Optional.of(updatedTodo));

        mockMvc.perform(put("/api/todos/test-id-123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Updated Todo"))
                .andExpect(jsonPath("$.completed").value(true));

        verify(todoService, times(1)).updateTodo(eq("test-id-123"), eq("Updated Todo"), 
                eq(Priority.high), eq(true), isNull(), isNull());
    }

    @Test
    void testUpdateTodo_NotFound_ShouldReturn404() throws Exception {
        TodoUpdateRequest request = new TodoUpdateRequest();
        request.setText("Updated Todo");

        when(todoService.updateTodo(anyString(), anyString(), any(), any(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        mockMvc.perform(put("/api/todos/non-existent")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

        verify(todoService, times(1)).updateTodo(eq("non-existent"), eq("Updated Todo"), 
                isNull(), isNull(), isNull(), isNull());
    }

    @Test
    void testDeleteTodo_ShouldReturn200() throws Exception {
        when(todoService.deleteTodo("test-id-123")).thenReturn(true);

        mockMvc.perform(delete("/api/todos/test-id-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Todo deleted successfully"));

        verify(todoService, times(1)).deleteTodo("test-id-123");
    }

    @Test
    void testDeleteTodo_NotFound_ShouldReturn404() throws Exception {
        when(todoService.deleteTodo("non-existent")).thenReturn(false);

        mockMvc.perform(delete("/api/todos/non-existent"))
                .andExpect(status().isNotFound());

        verify(todoService, times(1)).deleteTodo("non-existent");
    }

    @Test
    void testToggleTodo_ShouldReturn200() throws Exception {
        Todo toggledTodo = new Todo();
        toggledTodo.setId("test-id-123");
        toggledTodo.setCompleted(true);

        when(todoService.toggleTodo("test-id-123")).thenReturn(Optional.of(toggledTodo));

        mockMvc.perform(patch("/api/todos/test-id-123/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));

        verify(todoService, times(1)).toggleTodo("test-id-123");
    }

    @Test
    void testToggleTodo_NotFound_ShouldReturn404() throws Exception {
        when(todoService.toggleTodo("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/todos/non-existent/toggle"))
                .andExpect(status().isNotFound());

        verify(todoService, times(1)).toggleTodo("non-existent");
    }

    @Test
    void testGetStats_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/todos/stats/summary"))
                .andExpect(status().isOk());

        verify(todoService, times(1)).getStats();
    }

    @Test
    void testClearCompleted_ShouldReturn200() throws Exception {
        doNothing().when(todoService).clearCompleted();

        mockMvc.perform(delete("/api/todos/completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Completed todos cleared"));

        verify(todoService, times(1)).clearCompleted();
    }
}

