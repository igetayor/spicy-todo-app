# 🔗 Frontend Integration Guide

This guide explains how to integrate the React frontend with the FastAPI backend.

## 🚀 Quick Setup

### 1. Start the Backend API

```bash
cd api/pyfast-api
python main.py
```

The API will be available at: http://localhost:8000

### 2. Update Frontend API Configuration

In your React frontend, you'll need to update the API base URL. Create or update `src/config/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000/api';

export const apiEndpoints = {
  todos: `${API_BASE_URL}/todos`,
  todoById: (id) => `${API_BASE_URL}/todos/${id}`,
  toggleTodo: (id) => `${API_BASE_URL}/todos/${id}/toggle`,
  stats: `${API_BASE_URL}/todos/stats/summary`,
  clearCompleted: `${API_BASE_URL}/todos/completed`
};
```

### 3. Update Frontend Data Fetching

Replace the sample data usage in `src/App.js` with API calls:

```javascript
// Replace the sample data import and useEffect
import { apiEndpoints } from './config/api';

// Update the useEffect to fetch from API
useEffect(() => {
  const fetchTodos = async () => {
    try {
      const response = await fetch(apiEndpoints.todos);
      const todos = await response.json();
      setTodos(todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };
  
  fetchTodos();
}, []);
```

## 📡 API Endpoints Mapping

| Frontend Function | API Endpoint | Method | Description |
|------------------|--------------|--------|-------------|
| `addTodo` | `/api/todos` | POST | Create new todo |
| `updateTodo` | `/api/todos/{id}` | PUT | Update existing todo |
| `deleteTodo` | `/api/todos/{id}` | DELETE | Delete todo |
| `toggleTodo` | `/api/todos/{id}/toggle` | PATCH | Toggle completion |
| `getTodos` | `/api/todos` | GET | Get all todos |
| `getStats` | `/api/todos/stats/summary` | GET | Get statistics |
| `clearCompleted` | `/api/todos/completed` | DELETE | Clear completed |

## 🔄 Updated Frontend Functions

### Add Todo Function
```javascript
const addTodo = async (text, priority = 'medium') => {
  try {
    const response = await fetch(apiEndpoints.todos, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        priority,
        completed: false
      })
    });
    
    if (response.ok) {
      const newTodo = await response.json();
      setTodos([newTodo, ...todos]);
    }
  } catch (error) {
    console.error('Error adding todo:', error);
  }
};
```

### Update Todo Function
```javascript
const updateTodo = async (id, updates) => {
  try {
    const response = await fetch(apiEndpoints.todoById(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    if (response.ok) {
      const updatedTodo = await response.json();
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    }
  } catch (error) {
    console.error('Error updating todo:', error);
  }
};
```

### Delete Todo Function
```javascript
const deleteTodo = async (id) => {
  try {
    const response = await fetch(apiEndpoints.todoById(id), {
      method: 'DELETE'
    });
    
    if (response.ok) {
      setTodos(todos.filter(todo => todo.id !== id));
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
};
```

### Toggle Todo Function
```javascript
const toggleTodo = async (id) => {
  try {
    const response = await fetch(apiEndpoints.toggleTodo(id), {
      method: 'PATCH'
    });
    
    if (response.ok) {
      const updatedTodo = await response.json();
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    }
  } catch (error) {
    console.error('Error toggling todo:', error);
  }
};
```

### Fetch Todos with Filtering
```javascript
const fetchTodos = async (filter = 'all', search = '', priority = '') => {
  try {
    const params = new URLSearchParams();
    if (filter !== 'all') params.append('filter', filter);
    if (search) params.append('search', search);
    if (priority) params.append('priority', priority);
    
    const response = await fetch(`${apiEndpoints.todos}?${params}`);
    const todos = await response.json();
    setTodos(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
  }
};
```

## 🎯 Data Format Compatibility

The API returns data in the same format as the frontend expects:

```javascript
// API Response Format
{
  "id": "uuid-string",
  "text": "Todo text",
  "priority": "low|medium|high",
  "completed": false,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

## 🔧 Error Handling

Add proper error handling for API calls:

```javascript
const handleApiError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  // You can add user-friendly error messages here
  // For example, show a toast notification
};
```

## 🚀 Testing the Integration

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd api/pyfast-api
   python main.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

2. **Test the integration:**
   - Open http://localhost:3000
   - Try creating, editing, and deleting todos
   - Check the browser's Network tab to see API calls
   - Verify data persistence across page refreshes

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Make sure the API is running on port 8000
   - Check that CORS is properly configured in `main.py`

2. **Connection Refused:**
   - Verify the API server is running
   - Check the API base URL in your frontend config

3. **Data Not Persisting:**
   - The current API uses in-memory storage
   - Data will reset when the server restarts
   - For persistence, implement a real database

4. **API Errors:**
   - Check the API documentation at http://localhost:8000/docs
   - Verify request format matches the expected schema

## 📚 Next Steps

1. **Add Loading States:** Show loading indicators during API calls
2. **Add Error Messages:** Display user-friendly error messages
3. **Add Optimistic Updates:** Update UI immediately, then sync with API
4. **Add Offline Support:** Cache data for offline usage
5. **Add Authentication:** Implement user authentication and authorization

---

**Happy coding! 🌶️**
