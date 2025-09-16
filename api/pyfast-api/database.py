from typing import List, Optional
from datetime import datetime
import uuid
import structlog
from models import Todo, TodoCreate, TodoUpdate, Priority

# Initialize logger
logger = structlog.get_logger("database")

# In-memory storage for demo purposes
# In production, this would be replaced with a real database
_todos_db: List[Todo] = []

def _generate_id() -> str:
    """Generate a unique ID for todos"""
    return str(uuid.uuid4())

def _get_current_timestamp() -> datetime:
    """Get current timestamp"""
    return datetime.now()

def initialize_sample_data():
    """Initialize the database with sample data"""
    global _todos_db
    
    logger.info("Initializing database with sample data")
    
    sample_todos = [
        {
            "text": "Learn React hooks and state management",
            "priority": Priority.HIGH,
            "completed": False,
            "created_at": datetime(2024, 1, 15, 10, 0, 0),
            "updated_at": datetime(2024, 1, 15, 10, 0, 0)
        },
        {
            "text": "Build a spicy todo application",
            "priority": Priority.HIGH,
            "completed": True,
            "created_at": datetime(2024, 1, 14, 9, 30, 0),
            "updated_at": datetime(2024, 1, 15, 11, 45, 0)
        },
        {
            "text": "Add beautiful animations and transitions",
            "priority": Priority.MEDIUM,
            "completed": False,
            "created_at": datetime(2024, 1, 13, 14, 20, 0),
            "updated_at": datetime(2024, 1, 13, 14, 20, 0)
        },
        {
            "text": "Implement dark mode toggle",
            "priority": Priority.LOW,
            "completed": False,
            "created_at": datetime(2024, 1, 12, 16, 45, 0),
            "updated_at": datetime(2024, 1, 12, 16, 45, 0)
        },
        {
            "text": "Write comprehensive tests",
            "priority": Priority.MEDIUM,
            "completed": False,
            "created_at": datetime(2024, 1, 11, 11, 15, 0),
            "updated_at": datetime(2024, 1, 11, 11, 15, 0)
        },
        {
            "text": "Deploy to production",
            "priority": Priority.HIGH,
            "completed": True,
            "created_at": datetime(2024, 1, 10, 8, 0, 0),
            "updated_at": datetime(2024, 1, 14, 15, 30, 0)
        },
        {
            "text": "Optimize performance and bundle size",
            "priority": Priority.MEDIUM,
            "completed": False,
            "created_at": datetime(2024, 1, 9, 13, 30, 0),
            "updated_at": datetime(2024, 1, 9, 13, 30, 0)
        },
        {
            "text": "Add keyboard shortcuts for power users",
            "priority": Priority.LOW,
            "completed": False,
            "created_at": datetime(2024, 1, 8, 10, 45, 0),
            "updated_at": datetime(2024, 1, 8, 10, 45, 0)
        }
    ]
    
    _todos_db = []
    for todo_data in sample_todos:
        todo = Todo(
            id=_generate_id(),
            text=todo_data["text"],
            priority=todo_data["priority"],
            completed=todo_data["completed"],
            created_at=todo_data["created_at"],
            updated_at=todo_data["updated_at"]
        )
        _todos_db.append(todo)
    
    logger.info("Database initialized successfully", sample_count=len(_todos_db))

def get_todos() -> List[Todo]:
    """Get all todos"""
    if not _todos_db:
        initialize_sample_data()
    return _todos_db.copy()

def get_todo_by_id(todo_id: str) -> Optional[Todo]:
    """Get a todo by its ID"""
    if not _todos_db:
        initialize_sample_data()
    
    for todo in _todos_db:
        if todo.id == todo_id:
            return todo
    return None

def create_todo(todo_data: TodoCreate) -> Todo:
    """Create a new todo"""
    if not _todos_db:
        initialize_sample_data()
    
    logger.debug(
        "Creating new todo",
        text=todo_data.text,
        priority=todo_data.priority,
        completed=todo_data.completed
    )
    
    new_todo = Todo(
        id=_generate_id(),
        text=todo_data.text,
        priority=todo_data.priority,
        completed=todo_data.completed,
        created_at=_get_current_timestamp(),
        updated_at=_get_current_timestamp()
    )
    
    _todos_db.append(new_todo)
    
    logger.info(
        "Todo created successfully",
        todo_id=new_todo.id,
        text=new_todo.text,
        priority=new_todo.priority,
        total_todos=len(_todos_db)
    )
    
    return new_todo

def update_todo(todo_id: str, todo_data: TodoUpdate) -> Todo:
    """Update an existing todo"""
    if not _todos_db:
        initialize_sample_data()
    
    for i, todo in enumerate(_todos_db):
        if todo.id == todo_id:
            # Update only provided fields
            update_data = todo_data.dict(exclude_unset=True)
            
            updated_todo = Todo(
                id=todo.id,
                text=update_data.get("text", todo.text),
                priority=update_data.get("priority", todo.priority),
                completed=update_data.get("completed", todo.completed),
                created_at=todo.created_at,
                updated_at=_get_current_timestamp()
            )
            
            _todos_db[i] = updated_todo
            return updated_todo
    
    raise ValueError(f"Todo with id {todo_id} not found")

def delete_todo(todo_id: str) -> bool:
    """Delete a todo by its ID"""
    if not _todos_db:
        initialize_sample_data()
    
    for i, todo in enumerate(_todos_db):
        if todo.id == todo_id:
            del _todos_db[i]
            return True
    
    return False

def clear_completed_todos() -> int:
    """Delete all completed todos and return count of deleted items"""
    if not _todos_db:
        initialize_sample_data()
    
    initial_count = len(_todos_db)
    _todos_db[:] = [todo for todo in _todos_db if not todo.completed]
    deleted_count = initial_count - len(_todos_db)
    
    return deleted_count

def get_todos_count() -> int:
    """Get total number of todos"""
    if not _todos_db:
        initialize_sample_data()
    return len(_todos_db)
