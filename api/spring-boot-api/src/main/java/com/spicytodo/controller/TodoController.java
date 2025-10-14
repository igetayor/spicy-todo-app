package com.spicytodo.controller;

import com.spicytodo.dto.TodoCreateRequest;
import com.spicytodo.dto.TodoUpdateRequest;
import com.spicytodo.model.Todo;
import com.spicytodo.model.TodoStats;
import com.spicytodo.service.TodoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class TodoController {

    @Autowired
    private TodoService todoService;

    @GetMapping("/todos")
    public ResponseEntity<List<Todo>> getAllTodos(
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String priority) {
        List<Todo> todos = todoService.getAllTodos(filter, search, priority);
        return ResponseEntity.ok(todos);
    }

    @GetMapping("/todos/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable String id) {
        return todoService.getTodoById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/todos")
    public ResponseEntity<Todo> createTodo(@Valid @RequestBody TodoCreateRequest request) {
        Todo todo = todoService.createTodo(
                request.getText(),
                request.getPriority(),
                request.getCompleted(),
                request.getDueDate(),
                request.getReminderTime()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(todo);
    }

    @PutMapping("/todos/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable String id, @Valid @RequestBody TodoUpdateRequest request) {
        return todoService.updateTodo(
                id,
                request.getText(),
                request.getPriority(),
                request.getCompleted(),
                request.getDueDate(),
                request.getReminderTime()
        ).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/todos/{id}")
    public ResponseEntity<Map<String, String>> deleteTodo(@PathVariable String id) {
        if (todoService.deleteTodo(id)) {
            return ResponseEntity.ok(Map.of("message", "Todo deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/todos/{id}/toggle")
    public ResponseEntity<Todo> toggleTodo(@PathVariable String id) {
        return todoService.toggleTodo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/todos/stats/summary")
    public ResponseEntity<TodoStats> getStats() {
        return ResponseEntity.ok(todoService.getStats());
    }

    @DeleteMapping("/todos/completed")
    public ResponseEntity<Map<String, String>> clearCompleted() {
        todoService.clearCompleted();
        return ResponseEntity.ok(Map.of("message", "Completed todos cleared"));
    }
}

