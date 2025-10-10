require_relative '../spec_helper'

RSpec.describe 'API Routes' do
  describe 'GET /' do
    it 'returns API information' do
      get '/'
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['message']).to include('Spicy Todo API')
      expect(data['version']).not_to be_nil
    end
  end

  describe 'GET /health' do
    it 'returns health status' do
      get '/health'
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['status']).to eq('healthy')
      expect(data['service']).to eq('spicy-todo-ruby-api')
    end
  end

  describe 'GET /api/todos' do
    it 'returns all todos' do
      get '/api/todos'
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data).to be_an(Array)
    end

    it 'filters by status' do
      $todo_service.instance_variable_set(:@todos, {})
      $todo_service.create_todo(text: 'Active', completed: false)
      $todo_service.create_todo(text: 'Completed', completed: true)
      
      get '/api/todos?filter=active'
      data = JSON.parse(last_response.body)
      
      expect(data.length).to eq(1)
      expect(data.first['completed']).to be false
    end

    it 'searches by text' do
      $todo_service.instance_variable_set(:@todos, {})
      $todo_service.create_todo(text: 'Learn Ruby')
      $todo_service.create_todo(text: 'Learn Go')
      
      get '/api/todos?search=Ruby'
      data = JSON.parse(last_response.body)
      
      expect(data.length).to eq(1)
      expect(data.first['text']).to include('Ruby')
    end
  end

  describe 'POST /api/todos' do
    it 'creates a new todo' do
      post '/api/todos', { text: 'New Todo', priority: 'high' }.to_json
      
      expect(last_response.status).to eq(201)
      
      data = JSON.parse(last_response.body)
      expect(data['text']).to eq('New Todo')
      expect(data['priority']).to eq('high')
      expect(data['id']).not_to be_nil
    end

    it 'validates empty text' do
      post '/api/todos', { text: '' }.to_json
      
      expect(last_response.status).to eq(400)
      
      data = JSON.parse(last_response.body)
      expect(data['error']).to include('required')
    end

    it 'validates text length' do
      long_text = 'a' * 501
      post '/api/todos', { text: long_text }.to_json
      
      expect(last_response.status).to eq(400)
      
      data = JSON.parse(last_response.body)
      expect(data['error']).to include('500 characters')
    end

    it 'handles invalid JSON' do
      post '/api/todos', 'invalid json'
      
      expect(last_response.status).to eq(400)
      
      data = JSON.parse(last_response.body)
      expect(data['error']).to include('Invalid JSON')
    end
  end

  describe 'GET /api/todos/:id' do
    it 'returns todo by ID' do
      todo = $todo_service.create_todo(text: 'Test Todo')
      
      get "/api/todos/#{todo.id}"
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['id']).to eq(todo.id)
      expect(data['text']).to eq('Test Todo')
    end

    it 'returns 404 for non-existent ID' do
      get '/api/todos/non-existent'
      
      expect(last_response.status).to eq(404)
      
      data = JSON.parse(last_response.body)
      expect(data['error']).to include('not found')
    end
  end

  describe 'PUT /api/todos/:id' do
    it 'updates todo' do
      todo = $todo_service.create_todo(text: 'Original')
      
      put "/api/todos/#{todo.id}", {
        text: 'Updated',
        priority: 'high',
        completed: true
      }.to_json
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['text']).to eq('Updated')
      expect(data['priority']).to eq('high')
      expect(data['completed']).to be true
    end

    it 'returns 404 for non-existent ID' do
      put '/api/todos/non-existent', { text: 'Updated' }.to_json
      
      expect(last_response.status).to eq(404)
    end
  end

  describe 'DELETE /api/todos/:id' do
    it 'deletes todo' do
      todo = $todo_service.create_todo(text: 'To Delete')
      
      delete "/api/todos/#{todo.id}"
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['message']).to include('deleted successfully')
      
      # Verify it's deleted
      expect($todo_service.get_todo_by_id(todo.id)).to be_nil
    end

    it 'returns 404 for non-existent ID' do
      delete '/api/todos/non-existent'
      
      expect(last_response.status).to eq(404)
    end
  end

  describe 'PATCH /api/todos/:id/toggle' do
    it 'toggles todo completion' do
      todo = $todo_service.create_todo(text: 'Test', completed: false)
      
      patch "/api/todos/#{todo.id}/toggle"
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['completed']).to be true
    end

    it 'returns 404 for non-existent ID' do
      patch '/api/todos/non-existent/toggle'
      
      expect(last_response.status).to eq(404)
    end
  end

  describe 'GET /api/todos/stats/summary' do
    it 'returns statistics' do
      $todo_service.instance_variable_set(:@todos, {})
      $todo_service.create_todo(text: 'Todo 1', completed: false)
      $todo_service.create_todo(text: 'Todo 2', completed: true)
      
      get '/api/todos/stats/summary'
      
      expect(last_response.status).to eq(200)
      
      data = JSON.parse(last_response.body)
      expect(data['total']).to eq(2)
      expect(data['active']).to eq(1)
      expect(data['completed']).to eq(1)
      expect(data['completionRate']).to be_a(Numeric)
    end
  end

  describe 'DELETE /api/todos/completed' do
    it 'clears completed todos' do
      $todo_service.instance_variable_set(:@todos, {})
      $todo_service.create_todo(text: 'Active', completed: false)
      $todo_service.create_todo(text: 'Completed', completed: true)
      
      delete '/api/todos/completed'
      
      expect(last_response.status).to eq(200)
      
      todos = $todo_service.get_all_todos
      expect(todos.length).to eq(1)
      expect(todos.first.completed).to be false
    end
  end
end



