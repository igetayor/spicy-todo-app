module Routes
  def self.configure_routes(app)
    # Root endpoint
    app.get '/' do
      {
        message: '🌶️ Spicy Todo API - Ruby/Sinatra Implementation',
        version: '1.0.0',
        docs: '/api/todos'
      }.to_json
    end

    # Health check
    app.get '/health' do
      {
        status: 'healthy',
        service: 'spicy-todo-ruby-api',
        uptime: Time.now.to_s
      }.to_json
    end

    # Get all todos
    app.get '/api/todos' do
      filter = params['filter']
      search = params['search']
      priority = params['priority']
      
      todos = $todo_service.get_all_todos(filter: filter, search: search, priority: priority)
      todos.map(&:to_h).to_json
    end

    # Get todo by ID
    app.get '/api/todos/:id' do
      todo = $todo_service.get_todo_by_id(params[:id])
      
      if todo
        todo.to_h.to_json
      else
        status 404
        { error: 'Todo not found' }.to_json
      end
    end

    # Create new todo
    app.post '/api/todos' do
      begin
        data = JSON.parse(request.body.read)
        
        # Validate required fields
        if data['text'].nil? || data['text'].strip.empty?
          status 400
          return { error: 'Todo text is required' }.to_json
        end
        
        if data['text'].length > 500
          status 400
          return { error: 'Todo text must be less than 500 characters' }.to_json
        end
        
        todo = $todo_service.create_todo(
          text: data['text'],
          priority: data['priority'],
          completed: data['completed'],
          due_date: data['dueDate'],
          reminder_time: data['reminderTime']
        )
        
        status 201
        todo.to_h.to_json
      rescue JSON::ParserError
        status 400
        { error: 'Invalid JSON' }.to_json
      end
    end

    # Update todo
    app.put '/api/todos/:id' do
      begin
        data = JSON.parse(request.body.read)
        todo = $todo_service.update_todo(
          params[:id],
          text: data['text'],
          priority: data['priority'],
          completed: data['completed'],
          due_date: data['dueDate'],
          reminder_time: data['reminderTime']
        )
        
        if todo
          todo.to_h.to_json
        else
          status 404
          { error: 'Todo not found' }.to_json
        end
      rescue JSON::ParserError
        status 400
        { error: 'Invalid JSON' }.to_json
      end
    end

    # Delete todo
    app.delete '/api/todos/:id' do
      if $todo_service.delete_todo(params[:id])
        { message: 'Todo deleted successfully' }.to_json
      else
        status 404
        { error: 'Todo not found' }.to_json
      end
    end

    # Toggle todo completion
    app.patch '/api/todos/:id/toggle' do
      todo = $todo_service.toggle_todo(params[:id])
      
      if todo
        todo.to_h.to_json
      else
        status 404
        { error: 'Todo not found' }.to_json
      end
    end

    # Get statistics
    app.get '/api/todos/stats/summary' do
      stats = $todo_service.get_stats
      stats.to_json
    end

    # Clear completed todos
    app.delete '/api/todos/completed' do
      $todo_service.clear_completed
      { message: 'Completed todos cleared' }.to_json
    end
  end
end



