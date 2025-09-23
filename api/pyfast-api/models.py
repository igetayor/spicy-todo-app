from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date, time
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TodoBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Todo text content")
    priority: Priority = Field(default=Priority.MEDIUM, description="Todo priority level")
    completed: bool = Field(default=False, description="Completion status")
    due_date: Optional[date] = Field(None, description="Due date for the todo")
    reminder_time: Optional[time] = Field(None, description="Reminder time for the todo")

    @validator('due_date')
    def validate_due_date(cls, v):
        if v is not None and v < date.today():
            raise ValueError('Due date cannot be in the past')
        return v

    @validator('reminder_time')
    def validate_reminder_time(cls, v, values):
        if v is not None and 'due_date' in values and values['due_date'] is None:
            raise ValueError('Reminder time requires a due date to be set')
        return v

class TodoCreate(TodoBase):
    """Schema for creating a new todo"""
    pass

class TodoUpdate(BaseModel):
    """Schema for updating a todo"""
    text: Optional[str] = Field(None, min_length=1, max_length=500, description="Updated todo text")
    priority: Optional[Priority] = Field(None, description="Updated priority level")
    completed: Optional[bool] = Field(None, description="Updated completion status")
    due_date: Optional[date] = Field(None, description="Updated due date for the todo")
    reminder_time: Optional[time] = Field(None, description="Updated reminder time for the todo")

    @validator('due_date')
    def validate_due_date(cls, v):
        if v is not None and v < date.today():
            raise ValueError('Due date cannot be in the past')
        return v

    @validator('reminder_time')
    def validate_reminder_time(cls, v, values):
        if v is not None and 'due_date' in values and values['due_date'] is None:
            raise ValueError('Reminder time requires a due date to be set')
        return v

class Todo(TodoBase):
    """Complete todo model with all fields"""
    id: str = Field(..., description="Unique todo identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

class TodoResponse(Todo):
    """Response model for API endpoints"""
    pass

class TodoStats(BaseModel):
    """Statistics model for todo summary"""
    total: int = Field(..., description="Total number of todos")
    active: int = Field(..., description="Number of active todos")
    completed: int = Field(..., description="Number of completed todos")
    completion_rate: float = Field(..., description="Completion rate percentage")
    priority_breakdown: dict = Field(..., description="Breakdown by priority levels")
    overdue_count: int = Field(default=0, description="Number of overdue todos")
    due_today_count: int = Field(default=0, description="Number of todos due today")
    upcoming_count: int = Field(default=0, description="Number of todos due in the next 7 days")

class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
