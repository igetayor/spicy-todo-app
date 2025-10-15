namespace DotnetApi.Models
{
    public class TodoStats
    {
        public int Total { get; set; }
        public int Active { get; set; }
        public int Completed { get; set; }
        public double CompletionRate { get; set; }
        public Dictionary<string, int> PriorityBreakdown { get; set; } = new();
        public int OverdueCount { get; set; }
        public int DueTodayCount { get; set; }
        public int UpcomingCount { get; set; }
    }
}

