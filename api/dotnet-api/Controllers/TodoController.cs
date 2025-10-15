using Microsoft.AspNetCore.Mvc;
using DotnetApi.Models;
using DotnetApi.Services;

namespace DotnetApi.Controllers
{
    [ApiController]
    [Route("api/todos")]
    public class TodoController : ControllerBase
    {
        private readonly TodoService _todoService;

        public TodoController(TodoService todoService)
        {
            _todoService = todoService;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Todo>> GetAllTodos([FromQuery] string? filter, [FromQuery] string? search, [FromQuery] string? priority)
        {
            var todos = _todoService.GetAllTodos(filter, search, priority);
            return Ok(todos);
        }

        [HttpGet("{id}")]
        public ActionResult<Todo> GetTodoById(string id)
        {
            var todo = _todoService.GetTodoById(id);
            if (todo == null)
                return NotFound(new { error = "Todo not found" });

            return Ok(todo);
        }

        [HttpPost]
        public ActionResult<Todo> CreateTodo([FromBody] TodoCreateRequest request)
        {
            var todo = _todoService.CreateTodo(
                request.Text,
                request.Priority,
                request.Completed,
                request.DueDate,
                request.ReminderTime
            );

            return CreatedAtAction(nameof(GetTodoById), new { id = todo.Id }, todo);
        }

        [HttpPut("{id}")]
        public ActionResult<Todo> UpdateTodo(string id, [FromBody] TodoUpdateRequest request)
        {
            var todo = _todoService.UpdateTodo(
                id,
                request.Text,
                request.Priority,
                request.Completed,
                request.DueDate,
                request.ReminderTime
            );

            if (todo == null)
                return NotFound(new { error = "Todo not found" });

            return Ok(todo);
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteTodo(string id)
        {
            if (!_todoService.DeleteTodo(id))
                return NotFound(new { error = "Todo not found" });

            return Ok(new { message = "Todo deleted successfully" });
        }

        [HttpPatch("{id}/toggle")]
        public ActionResult<Todo> ToggleTodo(string id)
        {
            var todo = _todoService.ToggleTodo(id);
            if (todo == null)
                return NotFound(new { error = "Todo not found" });

            return Ok(todo);
        }

        [HttpGet("stats/summary")]
        public ActionResult<TodoStats> GetStats()
        {
            var stats = _todoService.GetStats();
            return Ok(stats);
        }

        [HttpDelete("completed")]
        public ActionResult ClearCompleted()
        {
            _todoService.ClearCompleted();
            return Ok(new { message = "Completed todos cleared" });
        }
    }
}

