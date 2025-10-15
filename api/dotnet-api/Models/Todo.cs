using System.ComponentModel.DataAnnotations;

namespace DotnetApi.Models
{
    public class Todo
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "Todo text is required")]
        [StringLength(500, MinimumLength = 1, ErrorMessage = "Todo text must be between 1 and 500 characters")]
        public string Text { get; set; } = string.Empty;

        public Priority Priority { get; set; } = Priority.medium;
        public bool Completed { get; set; } = false;
        public string? DueDate { get; set; }
        public string? ReminderTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public void UpdateTimestamp()
        {
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

