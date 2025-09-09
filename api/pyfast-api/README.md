# 🌶️ Spicy Todo API

A FastAPI backend service for the Spicy Todo application, providing RESTful endpoints for full CRUD operations.

## ✨ Features

- **RESTful API**: Complete CRUD operations for todos
- **Filtering & Search**: Advanced filtering by status, priority, and text search
- **CORS Support**: Configured for frontend integration
- **Data Validation**: Pydantic models with comprehensive validation
- **Error Handling**: Proper HTTP status codes and error messages
- **Sample Data**: Pre-loaded with sample todos for testing
- **Statistics**: Endpoint for todo statistics and analytics
- **Auto Documentation**: Interactive API docs with Swagger UI

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Navigate to the API directory:
   ```bash
   cd api/pyfast-api
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   python main.py
   ```

   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Access the API:
   - **API Base URL**: http://localhost:8000
   - **Interactive Docs**: http://localhost:8000/docs
   - **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints

### Core Todo Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | Get all todos with optional filtering |
| `GET` | `/api/todos/{id}` | Get a specific todo by ID |
| `POST` | `/api/todos` | Create a new todo |
| `PUT` | `/api/todos/{id}` | Update an existing todo |
| `DELETE` | `/api/todos/{id}` | Delete a todo |
| `PATCH` | `/api/todos/{id}/toggle` | Toggle todo completion status |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API welcome message |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/todos/stats/summary` | Get todo statistics |
| `DELETE` | `/api/todos/completed` | Clear all completed todos |

### Query Parameters

#### GET /api/todos
- `filter` (optional): Filter by status (`all`, `active`, `completed`)
- `search` (optional): Search in todo text
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)

## 📝 Data Models

### Todo Model
```json
{
  "id": "string",
  "text": "string",
  "priority": "low|medium|high",
  "completed": boolean,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Todo Creation
```json
{
  "text": "string (required, 1-500 chars)",
  "priority": "low|medium|high (optional, default: medium)",
  "completed": boolean (optional, default: false)
}
```

### Todo Update
```json
{
  "text": "string (optional, 1-500 chars)",
  "priority": "low|medium|high (optional)",
  "completed": boolean (optional)
}
```

## 🔧 Configuration

### Environment Variables
Copy `env.example` to `.env` and modify as needed:
```bash
cp env.example .env
```

### CORS Configuration
The API is configured to allow requests from:
- http://localhost:3000
- http://127.0.0.1:3000

To add more origins, modify the `allow_origins` list in `main.py`.

## 🧪 Testing the API

### Using curl

1. **Get all todos**:
   ```bash
   curl http://localhost:8000/api/todos
   ```

2. **Create a new todo**:
   ```bash
   curl -X POST http://localhost:8000/api/todos \
     -H "Content-Type: application/json" \
     -d '{"text": "Test todo", "priority": "high"}'
   ```

3. **Update a todo**:
   ```bash
   curl -X PUT http://localhost:8000/api/todos/{id} \
     -H "Content-Type: application/json" \
     -d '{"completed": true}'
   ```

4. **Search todos**:
   ```bash
   curl "http://localhost:8000/api/todos?search=react&filter=active"
   ```

### Using the Interactive Docs

Visit http://localhost:8000/docs to use the Swagger UI interface for testing all endpoints.

## 🏗️ Project Structure

```
api/pyfast-api/
├── main.py              # FastAPI application and routes
├── models.py            # Pydantic data models
├── database.py          # Data storage and operations
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
└── README.md           # This file
```

## 🔄 Frontend Integration

The API is designed to work seamlessly with the React frontend:

1. **CORS**: Configured to allow requests from the React dev server
2. **Data Format**: JSON responses match the frontend's expected format
3. **Error Handling**: Proper HTTP status codes for frontend error handling
4. **Filtering**: Query parameters match the frontend's filtering needs

## 🚀 Production Deployment

For production deployment, consider:

1. **Database**: Replace in-memory storage with a real database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Add JWT-based authentication
3. **Rate Limiting**: Implement rate limiting for API protection
4. **Logging**: Add comprehensive logging
5. **Monitoring**: Add health checks and monitoring
6. **Environment**: Use environment-specific configurations

## 📊 Sample Data

The API comes pre-loaded with 8 sample todos covering:
- Different priority levels (high, medium, low)
- Various completion states
- Realistic timestamps
- Diverse content for testing search functionality

## 🐛 Error Handling

The API provides comprehensive error handling:
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Todo not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server errors

All errors return JSON responses with descriptive messages.

---

**Ready to spice up your todos! 🌶️**
