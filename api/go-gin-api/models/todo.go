package models

import "time"

type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

type Todo struct {
	ID           string    `json:"id"`
	Text         string    `json:"text" binding:"required,min=1,max=500"`
	Priority     Priority  `json:"priority"`
	Completed    bool      `json:"completed"`
	DueDate      *string   `json:"dueDate,omitempty"`
	ReminderTime *string   `json:"reminderTime,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type TodoCreate struct {
	Text         string   `json:"text" binding:"required,min=1,max=500"`
	Priority     Priority `json:"priority"`
	Completed    bool     `json:"completed"`
	DueDate      *string  `json:"dueDate,omitempty"`
	ReminderTime *string  `json:"reminderTime,omitempty"`
}

type TodoUpdate struct {
	Text         *string   `json:"text,omitempty" binding:"omitempty,min=1,max=500"`
	Priority     *Priority `json:"priority,omitempty"`
	Completed    *bool     `json:"completed,omitempty"`
	DueDate      *string   `json:"dueDate,omitempty"`
	ReminderTime *string   `json:"reminderTime,omitempty"`
}

type TodoStats struct {
	Total             int            `json:"total"`
	Active            int            `json:"active"`
	Completed         int            `json:"completed"`
	CompletionRate    float64        `json:"completionRate"`
	PriorityBreakdown map[string]int `json:"priorityBreakdown"`
	OverdueCount      int            `json:"overdueCount"`
	DueTodayCount     int            `json:"dueTodayCount"`
	UpcomingCount     int            `json:"upcomingCount"`
}

