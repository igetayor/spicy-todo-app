from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import uuid
import structlog
from models import Todo, TodoCreate, TodoUpdate, TodoResponse
from db import engine, Base
from database import get_todos, create_todo, update_todo, delete_todo, get_todo_by_id
from logging_config import get_logger, log_database_operation, log_business_logic
from middleware import LoggingMiddleware, ErrorHandlingMiddleware

# Initialize logger
logger = get_logger(__name__)

app = FastAPI(
    title="Spicy Todo API",
    description="A spicy FastAPI backend for the todo application",
    version="1.0.0"
)

# Add middleware (order matters - first added is outermost)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://spicy-todo-frontend:3000",  # Docker container name
        "http://spicy-todo-frontend-dev:3000"  # Development container name
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-create tables if persistence is enabled
if engine is not None:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured", engine_url=str(engine.url))

# Log application startup
logger.info("SpicyTodo API starting up", version="1.0.0")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "🌶️ Welcome to Spicy Todo API!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint accessed")
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/todos", response_model=List[TodoResponse])
async def get_todos_endpoint(
    filter: Optional[str] = Query(None, description="Filter by: all, active, completed"),
    search: Optional[str] = Query(None, description="Search term for todo text"),
    priority: Optional[str] = Query(None, description="Filter by priority: low, medium, high")
):
    """
    Get all todos with optional filtering and search
    """
    try:
        logger.info(
            "Getting todos",
            filter=filter,
            search=search,
            priority=priority
        )
        
        todos = get_todos()
        log_database_operation(logger, "READ", "todos", success=True, count=len(todos))
        
        # Apply filters
        if filter == "active":
            todos = [todo for todo in todos if not todo.completed]
        elif filter == "completed":
            todos = [todo for todo in todos if todo.completed]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            todos = [todo for todo in todos if search_lower in todo.text.lower()]
        
        # Apply priority filter
        if priority:
            todos = [todo for todo in todos if todo.priority == priority]
        
        logger.info(
            "Todos retrieved successfully",
            total_count=len(todos),
            filter_applied=filter,
            search_applied=bool(search),
            priority_applied=priority
        )
        
        return todos
    except Exception as e:
        logger.error(
            "Error fetching todos",
            error=str(e),
            error_type=type(e).__name__,
            filter=filter,
            search=search,
            priority=priority
        )
        raise HTTPException(status_code=500, detail=f"Error fetching todos: {str(e)}")

@app.get("/api/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: str):
    """
    Get a specific todo by ID
    """
    try:
        todo = get_todo_by_id(todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        return todo
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching todo: {str(e)}")

@app.post("/api/todos", response_model=TodoResponse)
async def create_todo_endpoint(todo_data: TodoCreate):
    """
    Create a new todo
    """
    try:
        logger.info(
            "Creating new todo",
            text=todo_data.text,
            priority=todo_data.priority,
            completed=todo_data.completed
        )
        
        new_todo = create_todo(todo_data)
        log_database_operation(logger, "CREATE", "todos", record_id=new_todo.id, success=True)
        
        log_business_logic(
            logger,
            "Todo created",
            user_action="create_todo",
            data_changed=True,
            todo_id=new_todo.id,
            priority=new_todo.priority
        )
        
        logger.info(
            "Todo created successfully",
            todo_id=new_todo.id,
            text=new_todo.text,
            priority=new_todo.priority
        )
        
        return new_todo
    except Exception as e:
        logger.error(
            "Error creating todo",
            error=str(e),
            error_type=type(e).__name__,
            todo_data=todo_data.dict()
        )
        raise HTTPException(status_code=500, detail=f"Error creating todo: {str(e)}")

@app.put("/api/todos/{todo_id}", response_model=TodoResponse)
async def update_todo_endpoint(todo_id: str, todo_data: TodoUpdate):
    """
    Update an existing todo
    """
    try:
        # Check if todo exists
        existing_todo = get_todo_by_id(todo_id)
        if not existing_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        updated_todo = update_todo(todo_id, todo_data)
        return updated_todo
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating todo: {str(e)}")

@app.delete("/api/todos/{todo_id}")
async def delete_todo_endpoint(todo_id: str):
    """
    Delete a todo
    """
    try:
        # Check if todo exists
        existing_todo = get_todo_by_id(todo_id)
        if not existing_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        success = delete_todo(todo_id)
        if success:
            return {"message": "Todo deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Error deleting todo")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting todo: {str(e)}")

@app.patch("/api/todos/{todo_id}/toggle")
async def toggle_todo_endpoint(todo_id: str):
    """
    Toggle todo completion status
    """
    try:
        existing_todo = get_todo_by_id(todo_id)
        if not existing_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        # Toggle completion status
        updated_todo = update_todo(todo_id, TodoUpdate(completed=not existing_todo.completed))
        return updated_todo
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling todo: {str(e)}")

@app.get("/api/todos/stats/summary")
async def get_todos_stats():
    """
    Get todo statistics summary
    """
    try:
        from datetime import date, timedelta
        
        todos = get_todos()
        
        total = len(todos)
        completed = len([todo for todo in todos if todo.completed])
        active = total - completed
        completion_rate = round((completed / total * 100), 2) if total > 0 else 0
        
        # Priority breakdown
        priority_counts = {
            "high": len([todo for todo in todos if todo.priority == "high"]),
            "medium": len([todo for todo in todos if todo.priority == "medium"]),
            "low": len([todo for todo in todos if todo.priority == "low"])
        }
        
        # Due date statistics
        today = date.today()
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)
        
        overdue_count = len([
            todo for todo in todos 
            if not todo.completed and todo.due_date and todo.due_date < today
        ])
        
        due_today_count = len([
            todo for todo in todos 
            if not todo.completed and todo.due_date and todo.due_date == today
        ])
        
        upcoming_count = len([
            todo for todo in todos 
            if not todo.completed and todo.due_date and today < todo.due_date <= next_week
        ])
        
        return {
            "total": total,
            "active": active,
            "completed": completed,
            "completion_rate": completion_rate,
            "priority_breakdown": priority_counts,
            "overdue_count": overdue_count,
            "due_today_count": due_today_count,
            "upcoming_count": upcoming_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@app.get("/api/todos/reminders")
async def get_upcoming_reminders():
    """
    Get todos with upcoming reminders
    """
    try:
        from datetime import datetime, timedelta
        
        todos = get_todos()
        now = datetime.now()
        
        # Get todos with reminders in the next hour
        upcoming_reminders = []
        for todo in todos:
            if (todo.due_date and todo.reminder_time and not todo.completed):
                # Combine due date and reminder time
                reminder_datetime = datetime.combine(todo.due_date, todo.reminder_time)
                
                # Check if reminder is within the next hour
                if now <= reminder_datetime <= now + timedelta(hours=1):
                    upcoming_reminders.append({
                        "id": todo.id,
                        "text": todo.text,
                        "priority": todo.priority,
                        "due_date": todo.due_date.isoformat(),
                        "reminder_time": todo.reminder_time.isoformat(),
                        "reminder_datetime": reminder_datetime.isoformat()
                    })
        
        return {
            "upcoming_reminders": upcoming_reminders,
            "count": len(upcoming_reminders)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reminders: {str(e)}")

@app.delete("/api/todos/completed")
async def clear_completed_todos():
    """
    Delete all completed todos
    """
    try:
        todos = get_todos()
        completed_todos = [todo for todo in todos if todo.completed]
        
        for todo in completed_todos:
            delete_todo(todo.id)
        
        return {
            "message": f"Cleared {len(completed_todos)} completed todos",
            "deleted_count": len(completed_todos)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing completed todos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
