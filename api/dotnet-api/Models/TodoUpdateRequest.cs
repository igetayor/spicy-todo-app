using System.ComponentModel.DataAnnotations;

namespace DotnetApi.Models
{
    public class TodoUpdateRequest
    {
        [StringLength(500, MinimumLength = 1, ErrorMessage = "Todo text must be between 1 and 500 characters")]
        public string? Text { get; set; }
        
        public Priority? Priority { get; set; }
        public bool? Completed { get; set; }
        public string? DueDate { get; set; }
        public string? ReminderTime { get; set; }
    }
}

