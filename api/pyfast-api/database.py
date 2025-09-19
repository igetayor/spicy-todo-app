from typing import List, Optional
from datetime import datetime, date, time, timedelta
import uuid
import structlog
from models import Todo, TodoCreate, TodoUpdate, Priority
from db import engine, get_db_session
from orm_models import TodoORM

# Initialize logger
logger = structlog.get_logger("database")

# In-memory storage fallback (used when DATABASE_URL is not set)
_todos_db: List[Todo] = []

def _use_persistent_storage() -> bool:
    return engine is not None

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
    
    # Calculate some sample dates
    today = date.today()
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=7)
    yesterday = today - timedelta(days=1)
    
    sample_todos = [
        {
            "text": "Learn React hooks and state management",
            "priority": Priority.HIGH,
            "completed": False,
            "due_date": tomorrow,
            "reminder_time": time(9, 0),  # 9:00 AM
            "created_at": datetime(2024, 1, 15, 10, 0, 0),
            "updated_at": datetime(2024, 1, 15, 10, 0, 0)
        },
        {
            "text": "Build a spicy todo application",
            "priority": Priority.HIGH,
            "completed": True,
            "due_date": yesterday,
            "reminder_time": time(14, 30),  # 2:30 PM
            "created_at": datetime(2024, 1, 14, 9, 30, 0),
            "updated_at": datetime(2024, 1, 15, 11, 45, 0)
        },
        {
            "text": "Add beautiful animations and transitions",
            "priority": Priority.MEDIUM,
            "completed": False,
            "due_date": next_week,
            "reminder_time": time(16, 0),  # 4:00 PM
            "created_at": datetime(2024, 1, 13, 14, 20, 0),
            "updated_at": datetime(2024, 1, 13, 14, 20, 0)
        },
        {
            "text": "Implement dark mode toggle",
            "priority": Priority.LOW,
            "completed": False,
            "due_date": today + timedelta(days=3),
            "reminder_time": time(10, 30),  # 10:30 AM
            "created_at": datetime(2024, 1, 12, 16, 45, 0),
            "updated_at": datetime(2024, 1, 12, 16, 45, 0)
        },
        {
            "text": "Write comprehensive tests",
            "priority": Priority.MEDIUM,
            "completed": False,
            "due_date": today + timedelta(days=5),
            "reminder_time": time(13, 0),  # 1:00 PM
            "created_at": datetime(2024, 1, 11, 11, 15, 0),
            "updated_at": datetime(2024, 1, 11, 11, 15, 0)
        },
        {
            "text": "Deploy to production",
            "priority": Priority.HIGH,
            "completed": True,
            "due_date": yesterday,
            "reminder_time": time(9, 0),  # 9:00 AM
            "created_at": datetime(2024, 1, 10, 8, 0, 0),
            "updated_at": datetime(2024, 1, 14, 15, 30, 0)
        },
        {
            "text": "Optimize performance and bundle size",
            "priority": Priority.MEDIUM,
            "completed": False,
            "due_date": today + timedelta(days=2),
            "reminder_time": time(15, 30),  # 3:30 PM
            "created_at": datetime(2024, 1, 9, 13, 30, 0),
            "updated_at": datetime(2024, 1, 9, 13, 30, 0)
        },
        {
            "text": "Add keyboard shortcuts for power users",
            "priority": Priority.LOW,
            "completed": False,
            "due_date": today + timedelta(days=10),
            "reminder_time": time(11, 0),  # 11:00 AM
            "created_at": datetime(2024, 1, 8, 10, 45, 0),
            "updated_at": datetime(2024, 1, 8, 10, 45, 0)
        }
    ]
    
    if _use_persistent_storage():
        # Only seed if table is empty
        from sqlalchemy import select
        with next(get_db_session()) as db:
            count = db.scalar(select(TodoORM).count()) if hasattr(select(TodoORM), 'count') else db.query(TodoORM).count()  # SQLAlchemy 2 vs 1 compat
            if count == 0:
                for todo_data in sample_todos:
                    db_todo = TodoORM(
                        id=_generate_id(),
                        text=todo_data["text"],
                        priority=todo_data["priority"].value if isinstance(todo_data["priority"], Priority) else todo_data["priority"],
                        completed=todo_data["completed"],
                        created_at=todo_data["created_at"],
                        updated_at=todo_data["updated_at"],
                    )
                    db.add(db_todo)
                db.commit()
                logger.info("Persistent database seeded with sample data")
        return
    else:
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
        
        logger.info("In-memory database initialized", sample_count=len(_todos_db))

def _to_model(todo_orm: TodoORM) -> Todo:
    return Todo(
        id=todo_orm.id,
        text=todo_orm.text,
        priority=Priority(todo_orm.priority),
        completed=todo_orm.completed,
        created_at=todo_orm.created_at,
        updated_at=todo_orm.updated_at,
    )


def get_todos() -> List[Todo]:
    """Get all todos"""
    if _use_persistent_storage():
        from sqlalchemy import select
        with next(get_db_session()) as db:
            rows = db.execute(select(TodoORM)).scalars().all()
            return [_to_model(r) for r in rows]
    else:
        if not _todos_db:
            initialize_sample_data()
        return _todos_db.copy()

def get_todo_by_id(todo_id: str) -> Optional[Todo]:
    """Get a todo by its ID"""
    if _use_persistent_storage():
        with next(get_db_session()) as db:
            row = db.get(TodoORM, todo_id)
            return _to_model(row) if row else None
    else:
        if not _todos_db:
            initialize_sample_data()
        for todo in _todos_db:
            if todo.id == todo_id:
                return todo
        return None

def create_todo(todo_data: TodoCreate) -> Todo:
    """Create a new todo"""
    logger.debug("Creating new todo", text=todo_data.text, priority=todo_data.priority, completed=todo_data.completed)
    if _use_persistent_storage():
        with next(get_db_session()) as db:
            now = _get_current_timestamp()
            new_id = _generate_id()
            row = TodoORM(
                id=new_id,
                text=todo_data.text,
                priority=todo_data.priority.value if isinstance(todo_data.priority, Priority) else todo_data.priority,
                completed=todo_data.completed,
                created_at=now,
                updated_at=now,
            )
            db.add(row)
            db.commit()
            db.refresh(row)
            created = _to_model(row)
            logger.info("Todo created (persistent)", todo_id=new_id)
            return created
    else:
        if not _todos_db:
            initialize_sample_data()
        new_todo = Todo(
            id=_generate_id(),
            text=todo_data.text,
            priority=todo_data.priority,
            completed=todo_data.completed,
            created_at=_get_current_timestamp(),
            updated_at=_get_current_timestamp()
        )
        _todos_db.append(new_todo)
        logger.info("Todo created (memory)", todo_id=new_todo.id, total_todos=len(_todos_db))
        return new_todo

def update_todo(todo_id: str, todo_data: TodoUpdate) -> Todo:
    """Update an existing todo"""
    if _use_persistent_storage():
        with next(get_db_session()) as db:
            row = db.get(TodoORM, todo_id)
            if not row:
                raise ValueError(f"Todo with id {todo_id} not found")
            update_data = todo_data.dict(exclude_unset=True)
            if "text" in update_data:
                row.text = update_data["text"]
            if "priority" in update_data and update_data["priority"] is not None:
                val = update_data["priority"]
                row.priority = val.value if isinstance(val, Priority) else val
            if "completed" in update_data and update_data["completed"] is not None:
                row.completed = update_data["completed"]
            row.updated_at = _get_current_timestamp()
            db.add(row)
            db.commit()
            db.refresh(row)
            return _to_model(row)
    else:
        if not _todos_db:
            initialize_sample_data()
        for i, todo in enumerate(_todos_db):
            if todo.id == todo_id:
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
    if _use_persistent_storage():
        with next(get_db_session()) as db:
            row = db.get(TodoORM, todo_id)
            if not row:
                return False
            db.delete(row)
            db.commit()
            return True
    else:
        if not _todos_db:
            initialize_sample_data()
        for i, todo in enumerate(_todos_db):
            if todo.id == todo_id:
                del _todos_db[i]
                return True
        return False

def clear_completed_todos() -> int:
    """Delete all completed todos and return count of deleted items"""
    if _use_persistent_storage():
        from sqlalchemy import delete
        with next(get_db_session()) as db:
            result = db.execute(delete(TodoORM).where(TodoORM.completed.is_(True)))
            db.commit()
            # result.rowcount may be None depending on DB; fallback to recount
            return result.rowcount or 0
    else:
        if not _todos_db:
            initialize_sample_data()
        initial_count = len(_todos_db)
        _todos_db[:] = [todo for todo in _todos_db if not todo.completed]
        deleted_count = initial_count - len(_todos_db)
        return deleted_count

def get_todos_count() -> int:
    """Get total number of todos"""
    if _use_persistent_storage():
        from sqlalchemy import select, func
        with next(get_db_session()) as db:
            return db.scalar(select(func.count()).select_from(TodoORM)) or 0
    else:
        if not _todos_db:
            initialize_sample_data()
        return len(_todos_db)
