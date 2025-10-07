package models

import "time"

// SnoozeRequest for snoozing a todo
type SnoozeRequest struct {
	Until time.Time `json:"until" binding:"required"`
}

// BulkOperation for bulk operations on todos
type BulkOperation struct {
	IDs       []string               `json:"ids" binding:"required"`
	Operation string                 `json:"operation" binding:"required"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// ExportQuery for export filtering
type ExportQuery struct {
	Format string `form:"format"`
	Filter string `form:"filter"`
}

// ImportRequest for import operations
type ImportRequest struct {
	Todos []TodoCreate `json:"todos" binding:"required"`
	Mode  string       `json:"mode"` // replace, append, update
}

// ImportResult response
type ImportResult struct {
	Message    string   `json:"message"`
	Imported   int      `json:"imported"`
	Skipped    int      `json:"skipped"`
	Errors     []string `json:"errors"`
	ImportedAt string   `json:"importedAt"`
}

// ExportResult response
type ExportResult struct {
	Data       []Todo `json:"data"`
	Format     string `json:"format"`
	Count      int    `json:"count"`
	ExportedAt string `json:"exportedAt"`
	Filter     string `json:"filter"`
}

