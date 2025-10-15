using System.ComponentModel.DataAnnotations;

namespace DotnetApi.Models
{
    public class TodoCreateRequest
    {
        [Required(ErrorMessage = "Todo text is required")]
        [StringLength(500, MinimumLength = 1, ErrorMessage = "Todo text must be between 1 and 500 characters")]
        public string Text { get; set; } = string.Empty;
        
        public Priority? Priority { get; set; }
        public bool? Completed { get; set; }
        public string? DueDate { get; set; }
        public string? ReminderTime { get; set; }
    }
}

