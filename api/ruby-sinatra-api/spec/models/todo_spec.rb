require_relative '../spec_helper'
require_relative '../../models/todo'

RSpec.describe Todo do
  describe 'initialization' do
    it 'creates a todo with required fields' do
      todo = Todo.new(text: 'Test Todo')
      
      expect(todo.text).to eq('Test Todo')
      expect(todo.id).not_to be_nil
      expect(todo.priority).to eq('medium')
      expect(todo.completed).to be false
      expect(todo.created_at).not_to be_nil
      expect(todo.updated_at).not_to be_nil
    end

    it 'accepts all optional fields' do
      todo = Todo.new(
        text: 'Test Todo',
        priority: 'high',
        completed: true,
        due_date: '2024-12-31',
        reminder_time: '10:00'
      )
      
      expect(todo.priority).to eq('high')
      expect(todo.completed).to be true
      expect(todo.due_date).to eq('2024-12-31')
      expect(todo.reminder_time).to eq('10:00')
    end

    it 'uses medium priority by default for invalid priority' do
      todo = Todo.new(text: 'Test', priority: 'invalid')
      expect(todo.priority).to eq('medium')
    end

    it 'validates priority values' do
      expect(Todo::VALID_PRIORITIES).to contain_exactly('low', 'medium', 'high')
    end
  end

  describe '#update_timestamp' do
    it 'updates the updated_at timestamp' do
      todo = Todo.new(text: 'Test')
      original_time = todo.updated_at
      
      sleep 0.01
      todo.update_timestamp
      
      expect(todo.updated_at).not_to eq(original_time)
    end
  end

  describe '#to_h' do
    it 'converts todo to hash with camelCase keys' do
      todo = Todo.new(
        text: 'Test',
        priority: 'high',
        due_date: '2024-12-31',
        reminder_time: '10:00'
      )
      
      hash = todo.to_h
      
      expect(hash[:id]).not_to be_nil
      expect(hash[:text]).to eq('Test')
      expect(hash[:priority]).to eq('high')
      expect(hash[:completed]).to be false
      expect(hash[:dueDate]).to eq('2024-12-31')
      expect(hash[:reminderTime]).to eq('10:00')
      expect(hash[:createdAt]).not_to be_nil
      expect(hash[:updatedAt]).not_to be_nil
    end
  end

  describe '#overdue?' do
    it 'returns true for past due dates' do
      yesterday = (Date.today - 1).to_s
      todo = Todo.new(text: 'Test', due_date: yesterday, completed: false)
      
      expect(todo.overdue?).to be true
    end

    it 'returns false for future due dates' do
      tomorrow = (Date.today + 1).to_s
      todo = Todo.new(text: 'Test', due_date: tomorrow, completed: false)
      
      expect(todo.overdue?).to be false
    end

    it 'returns false for completed todos' do
      yesterday = (Date.today - 1).to_s
      todo = Todo.new(text: 'Test', due_date: yesterday, completed: true)
      
      expect(todo.overdue?).to be false
    end

    it 'returns false when no due date' do
      todo = Todo.new(text: 'Test')
      expect(todo.overdue?).to be false
    end
  end

  describe '#due_today?' do
    it 'returns true for today\'s due date' do
      today = Date.today.to_s
      todo = Todo.new(text: 'Test', due_date: today, completed: false)
      
      expect(todo.due_today?).to be true
    end

    it 'returns false for other dates' do
      tomorrow = (Date.today + 1).to_s
      todo = Todo.new(text: 'Test', due_date: tomorrow, completed: false)
      
      expect(todo.due_today?).to be false
    end
  end

  describe '#due_soon?' do
    it 'returns true for dates within 7 days' do
      next_week = (Date.today + 5).to_s
      todo = Todo.new(text: 'Test', due_date: next_week, completed: false)
      
      expect(todo.due_soon?).to be true
    end

    it 'returns false for dates beyond 7 days' do
      far_future = (Date.today + 10).to_s
      todo = Todo.new(text: 'Test', due_date: far_future, completed: false)
      
      expect(todo.due_soon?).to be false
    end

    it 'returns false for past dates' do
      yesterday = (Date.today - 1).to_s
      todo = Todo.new(text: 'Test', due_date: yesterday, completed: false)
      
      expect(todo.due_soon?).to be false
    end
  end

  describe '.create_sample_todos' do
    it 'creates sample todos' do
      todos = Todo.create_sample_todos
      
      expect(todos).to be_an(Array)
      expect(todos.length).to be > 0
      expect(todos.first).to be_a(Todo)
    end

    it 'creates todos with various priorities' do
      todos = Todo.create_sample_todos
      priorities = todos.map(&:priority).uniq
      
      expect(priorities).to include('high', 'medium', 'low')
    end
  end
end



