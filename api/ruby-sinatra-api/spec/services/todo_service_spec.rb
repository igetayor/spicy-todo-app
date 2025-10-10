require_relative '../spec_helper'
require_relative '../../services/todo_service'

RSpec.describe TodoService do
  let(:service) { TodoService.new }

  describe '#initialize' do
    it 'loads sample data' do
      expect(service.get_all_todos.length).to be > 0
    end
  end

  describe '#create_todo' do
    it 'creates a new todo' do
      todo = service.create_todo(text: 'Test Todo', priority: 'high')
      
      expect(todo).to be_a(Todo)
      expect(todo.text).to eq('Test Todo')
      expect(todo.priority).to eq('high')
      expect(todo.id).not_to be_nil
    end

    it 'uses default priority if not provided' do
      todo = service.create_todo(text: 'Test Todo')
      expect(todo.priority).to eq('medium')
    end

    it 'adds todo to storage' do
      initial_count = service.get_all_todos.length
      todo = service.create_todo(text: 'New Todo')
      
      expect(service.get_all_todos.length).to eq(initial_count + 1)
      expect(service.get_todo_by_id(todo.id)).to eq(todo)
    end
  end

  describe '#get_all_todos' do
    before do
      # Clear sample data and add test todos
      service.instance_variable_set(:@todos, {})
      service.create_todo(text: 'Active High', priority: 'high', completed: false)
      service.create_todo(text: 'Completed Medium', priority: 'medium', completed: true)
      service.create_todo(text: 'Active Low', priority: 'low', completed: false)
    end

    it 'returns all todos when no filters' do
      todos = service.get_all_todos
      expect(todos.length).to eq(3)
    end

    it 'filters by active status' do
      todos = service.get_all_todos(filter: 'active')
      expect(todos.length).to eq(2)
      expect(todos.all? { |t| !t.completed }).to be true
    end

    it 'filters by completed status' do
      todos = service.get_all_todos(filter: 'completed')
      expect(todos.length).to eq(1)
      expect(todos.all?(&:completed)).to be true
    end

    it 'filters by priority' do
      todos = service.get_all_todos(priority: 'high')
      expect(todos.length).to eq(1)
      expect(todos.first.priority).to eq('high')
    end

    it 'filters by search text' do
      todos = service.get_all_todos(search: 'Active')
      expect(todos.length).to eq(2)
    end

    it 'applies multiple filters' do
      todos = service.get_all_todos(filter: 'active', priority: 'high')
      expect(todos.length).to eq(1)
    end
  end

  describe '#get_todo_by_id' do
    it 'returns todo when exists' do
      todo = service.create_todo(text: 'Test')
      found = service.get_todo_by_id(todo.id)
      
      expect(found).to eq(todo)
    end

    it 'returns nil when not found' do
      found = service.get_todo_by_id('non-existent')
      expect(found).to be_nil
    end
  end

  describe '#update_todo' do
    it 'updates todo fields' do
      todo = service.create_todo(text: 'Original', priority: 'low')
      
      updated = service.update_todo(
        todo.id,
        text: 'Updated',
        priority: 'high',
        completed: true
      )
      
      expect(updated.text).to eq('Updated')
      expect(updated.priority).to eq('high')
      expect(updated.completed).to be true
    end

    it 'only updates provided fields' do
      todo = service.create_todo(text: 'Original', priority: 'low')
      original_priority = todo.priority
      
      service.update_todo(todo.id, text: 'Updated')
      updated = service.get_todo_by_id(todo.id)
      
      expect(updated.text).to eq('Updated')
      expect(updated.priority).to eq(original_priority)
    end

    it 'returns nil for non-existent todo' do
      result = service.update_todo('non-existent', text: 'Updated')
      expect(result).to be_nil
    end

    it 'validates priority values' do
      todo = service.create_todo(text: 'Test', priority: 'low')
      service.update_todo(todo.id, priority: 'invalid')
      
      updated = service.get_todo_by_id(todo.id)
      expect(updated.priority).to eq('low') # Should not change
    end
  end

  describe '#delete_todo' do
    it 'deletes existing todo' do
      todo = service.create_todo(text: 'To Delete')
      result = service.delete_todo(todo.id)
      
      expect(result).to be true
      expect(service.get_todo_by_id(todo.id)).to be_nil
    end

    it 'returns false for non-existent todo' do
      result = service.delete_todo('non-existent')
      expect(result).to be false
    end
  end

  describe '#toggle_todo' do
    it 'toggles completed status' do
      todo = service.create_todo(text: 'Test', completed: false)
      
      toggled = service.toggle_todo(todo.id)
      expect(toggled.completed).to be true
      
      toggled_again = service.toggle_todo(todo.id)
      expect(toggled_again.completed).to be false
    end

    it 'returns nil for non-existent todo' do
      result = service.toggle_todo('non-existent')
      expect(result).to be_nil
    end
  end

  describe '#get_stats' do
    before do
      service.instance_variable_set(:@todos, {})
      service.create_todo(text: 'Todo 1', priority: 'high', completed: false)
      service.create_todo(text: 'Todo 2', priority: 'high', completed: true)
      service.create_todo(text: 'Todo 3', priority: 'medium', completed: false)
      service.create_todo(text: 'Todo 4', priority: 'low', completed: true)
    end

    it 'calculates total count' do
      stats = service.get_stats
      expect(stats[:total]).to eq(4)
    end

    it 'calculates active and completed counts' do
      stats = service.get_stats
      expect(stats[:active]).to eq(2)
      expect(stats[:completed]).to eq(2)
    end

    it 'calculates completion rate' do
      stats = service.get_stats
      expect(stats[:completionRate]).to eq(50.0)
    end

    it 'calculates priority breakdown' do
      stats = service.get_stats
      expect(stats[:priorityBreakdown]['high']).to eq(2)
      expect(stats[:priorityBreakdown]['medium']).to eq(1)
      expect(stats[:priorityBreakdown]['low']).to eq(1)
    end

    it 'handles empty todos list' do
      service.instance_variable_set(:@todos, {})
      stats = service.get_stats
      
      expect(stats[:total]).to eq(0)
      expect(stats[:completionRate]).to eq(0)
    end
  end

  describe '#clear_completed' do
    it 'removes completed todos' do
      service.instance_variable_set(:@todos, {})
      service.create_todo(text: 'Active 1', completed: false)
      service.create_todo(text: 'Completed 1', completed: true)
      service.create_todo(text: 'Active 2', completed: false)
      service.create_todo(text: 'Completed 2', completed: true)
      
      service.clear_completed
      todos = service.get_all_todos
      
      expect(todos.length).to eq(2)
      expect(todos.all? { |t| !t.completed }).to be true
    end
  end
end



