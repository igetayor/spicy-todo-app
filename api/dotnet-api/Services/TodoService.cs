using System.Collections.Concurrent;
using DotnetApi.Models;

namespace DotnetApi.Services
{
    public class TodoService
    {
        private readonly ConcurrentDictionary<string, Todo> _todos = new();

        public TodoService()
        {
            LoadSampleData();
        }

        public IEnumerable<Todo> GetAllTodos(string? filter = null, string? search = null, string? priority = null)
        {
            return _todos.Values.Where(todo => ApplyFilters(todo, filter, search, priority));
        }

        public Todo? GetTodoById(string id)
        {
            _todos.TryGetValue(id, out var todo);
            return todo;
        }

        public Todo CreateTodo(string text, Priority? priority = null, bool? completed = null, string? dueDate = null, string? reminderTime = null)
        {
            var todo = new Todo
            {
                Text = text,
                Priority = priority ?? Priority.medium,
                Completed = completed ?? false,
                DueDate = dueDate,
                ReminderTime = reminderTime
            };

            _todos[todo.Id] = todo;
            return todo;
        }

        public Todo? UpdateTodo(string id, string? text = null, Priority? priority = null, bool? completed = null, string? dueDate = null, string? reminderTime = null)
        {
            if (!_todos.TryGetValue(id, out var todo))
                return null;

            if (text != null) todo.Text = text;
            if (priority.HasValue) todo.Priority = priority.Value;
            if (completed.HasValue) todo.Completed = completed.Value;
            if (dueDate != null) todo.DueDate = dueDate;
            if (reminderTime != null) todo.ReminderTime = reminderTime;

            todo.UpdateTimestamp();
            return todo;
        }

        public bool DeleteTodo(string id)
        {
            return _todos.TryRemove(id, out _);
        }

        public Todo? ToggleTodo(string id)
        {
            if (!_todos.TryGetValue(id, out var todo))
                return null;

            todo.Completed = !todo.Completed;
            todo.UpdateTimestamp();
            return todo;
        }

        public TodoStats GetStats()
        {
            var todos = _todos.Values.ToList();
            var total = todos.Count;
            var completed = todos.Count(t => t.Completed);
            var active = total - completed;

            var priorityBreakdown = new Dictionary<string, int>
            {
                { "low", todos.Count(t => t.Priority == Priority.low) },
                { "medium", todos.Count(t => t.Priority == Priority.medium) },
                { "high", todos.Count(t => t.Priority == Priority.high) }
            };

            var today = DateTime.Today;
            var overdueCount = 0;
            var dueTodayCount = 0;
            var upcomingCount = 0;

            foreach (var todo in todos.Where(t => !t.Completed && !string.IsNullOrEmpty(t.DueDate)))
            {
                if (DateTime.TryParse(todo.DueDate, out var dueDate))
                {
                    if (dueDate.Date < today)
                        overdueCount++;
                    else if (dueDate.Date == today)
                        dueTodayCount++;
                    else if (dueDate.Date <= today.AddDays(7))
                        upcomingCount++;
                }
            }

            return new TodoStats
            {
                Total = total,
                Active = active,
                Completed = completed,
                CompletionRate = total > 0 ? (double)completed / total * 100 : 0,
                PriorityBreakdown = priorityBreakdown,
                OverdueCount = overdueCount,
                DueTodayCount = dueTodayCount,
                UpcomingCount = upcomingCount
            };
        }

        public void ClearCompleted()
        {
            var completedIds = _todos.Where(kvp => kvp.Value.Completed).Select(kvp => kvp.Key).ToList();
            foreach (var id in completedIds)
            {
                _todos.TryRemove(id, out _);
            }
        }

        private bool ApplyFilters(Todo todo, string? filter, string? search, string? priority)
        {
            if (filter == "active" && todo.Completed) return false;
            if (filter == "completed" && !todo.Completed) return false;
            if (!string.IsNullOrEmpty(priority) && todo.Priority.ToString() != priority) return false;
            if (!string.IsNullOrEmpty(search) && !todo.Text.Contains(search, StringComparison.OrdinalIgnoreCase)) return false;
            return true;
        }

        private void LoadSampleData()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1).ToString("yyyy-MM-dd");
            var nextWeek = today.AddDays(7).ToString("yyyy-MM-dd");
            var yesterday = today.AddDays(-1).ToString("yyyy-MM-dd");

            CreateSampleTodo("Learn .NET Core and C#", Priority.high, false, tomorrow, "09:00");
            CreateSampleTodo("Build REST API with ASP.NET", Priority.high, true, yesterday, "14:30");
            CreateSampleTodo("Add Entity Framework integration", Priority.medium, false, nextWeek, "16:00");
            CreateSampleTodo("Write unit tests with xUnit", Priority.medium, false, null, null);
            CreateSampleTodo("Deploy to Azure", Priority.low, false, null, null);
        }

        private void CreateSampleTodo(string text, Priority priority, bool completed, string? dueDate, string? reminderTime)
        {
            var todo = new Todo
            {
                Text = text,
                Priority = priority,
                Completed = completed,
                DueDate = dueDate,
                ReminderTime = reminderTime
            };
            _todos[todo.Id] = todo;
        }
    }
}

