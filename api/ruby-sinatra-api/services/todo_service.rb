require_relative '../models/todo'

class TodoService
  def initialize
    @todos = {}
    load_sample_data
  end

  def get_all_todos(filter: nil, search: nil, priority: nil)
    todos = @todos.values

    # Apply filters
    todos = todos.select(&:completed) if filter == 'completed'
    todos = todos.reject(&:completed) if filter == 'active'
    todos = todos.select { |t| t.priority == priority } if priority
    todos = todos.select { |t| t.text.downcase.include?(search.downcase) } if search

    todos
  end

  def get_todo_by_id(id)
    @todos[id]
  end

  def create_todo(text:, priority: nil, completed: nil, due_date: nil, reminder_time: nil)
    todo = Todo.new(
      text: text,
      priority: priority || 'medium',
      completed: completed || false,
      due_date: due_date,
      reminder_time: reminder_time
    )
    @todos[todo.id] = todo
    todo
  end

  def update_todo(id, text: nil, priority: nil, completed: nil, due_date: nil, reminder_time: nil)
    todo = @todos[id]
    return nil unless todo

    todo.text = text if text
    todo.priority = priority if priority && Todo::VALID_PRIORITIES.include?(priority)
    todo.completed = completed unless completed.nil?
    todo.due_date = due_date unless due_date.nil?
    todo.reminder_time = reminder_time unless reminder_time.nil?
    todo.update_timestamp

    todo
  end

  def delete_todo(id)
    @todos.delete(id) ? true : false
  end

  def toggle_todo(id)
    todo = @todos[id]
    return nil unless todo

    todo.completed = !todo.completed
    todo.update_timestamp
    todo
  end

  def get_stats
    todos = @todos.values
    total = todos.size
    completed = todos.count(&:completed)
    active = total - completed

    priority_breakdown = {
      'low' => todos.count { |t| t.priority == 'low' },
      'medium' => todos.count { |t| t.priority == 'medium' },
      'high' => todos.count { |t| t.priority == 'high' }
    }

    overdue_count = todos.count(&:overdue?)
    due_today_count = todos.count(&:due_today?)
    upcoming_count = todos.count(&:due_soon?)

    {
      total: total,
      active: active,
      completed: completed,
      completionRate: total > 0 ? (completed.to_f / total * 100).round(2) : 0,
      priorityBreakdown: priority_breakdown,
      overdueCount: overdue_count,
      dueTodayCount: due_today_count,
      upcomingCount: upcoming_count
    }
  end

  def clear_completed
    @todos.reject! { |_, todo| todo.completed }
  end

  private

  def load_sample_data
    Todo.create_sample_todos.each do |todo|
      @todos[todo.id] = todo
    end
  end
end

