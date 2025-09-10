from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TodoBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Todo text content")
    priority: Priority = Field(default=Priority.MEDIUM, description="Todo priority level")
    completed: bool = Field(default=False, description="Completion status")

class TodoCreate(TodoBase):
    """Schema for creating a new todo"""
    pass

class TodoUpdate(BaseModel):
    """Schema for updating a todo"""
    text: Optional[str] = Field(None, min_length=1, max_length=500, description="Updated todo text")
    priority: Optional[Priority] = Field(None, description="Updated priority level")
    completed: Optional[bool] = Field(None, description="Updated completion status")

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

class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
