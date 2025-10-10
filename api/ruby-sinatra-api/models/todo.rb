require 'securerandom'
require 'time'

class Todo
  VALID_PRIORITIES = %w[low medium high].freeze

  attr_accessor :id, :text, :priority, :completed, :due_date, :reminder_time, :created_at, :updated_at

  def initialize(text:, priority: 'medium', completed: false, due_date: nil, reminder_time: nil, id: nil)
    @id = id || SecureRandom.uuid
    @text = text
    @priority = VALID_PRIORITIES.include?(priority) ? priority : 'medium'
    @completed = completed || false
    @due_date = due_date
    @reminder_time = reminder_time
    @created_at = Time.now.utc.iso8601
    @updated_at = Time.now.utc.iso8601
  end

  def update_timestamp
    @updated_at = Time.now.utc.iso8601
  end

  def to_h
    {
      id: @id,
      text: @text,
      priority: @priority,
      completed: @completed,
      dueDate: @due_date,
      reminderTime: @reminder_time,
      createdAt: @created_at,
      updatedAt: @updated_at
    }
  end

  def overdue?
    return false if @due_date.nil? || @completed
    Date.parse(@due_date) < Date.today
  rescue ArgumentError
    false
  end

  def due_today?
    return false if @due_date.nil? || @completed
    Date.parse(@due_date) == Date.today
  rescue ArgumentError
    false
  end

  def due_soon?
    return false if @due_date.nil? || @completed
    due_date = Date.parse(@due_date)
    due_date > Date.today && due_date <= Date.today + 7
  rescue ArgumentError
    false
  end

  def self.create_sample_todos
    today = Date.today
    tomorrow = today + 1
    next_week = today + 7
    yesterday = today - 1

    [
      new(text: 'Learn Ruby programming', priority: 'high', completed: false, 
          due_date: tomorrow.to_s, reminder_time: '09:00'),
      new(text: 'Build API with Sinatra', priority: 'high', completed: true, 
          due_date: yesterday.to_s, reminder_time: '14:30'),
      new(text: 'Add Redis caching layer', priority: 'medium', completed: false, 
          due_date: next_week.to_s, reminder_time: '16:00'),
      new(text: 'Write RSpec tests', priority: 'medium', completed: false),
      new(text: 'Deploy to Heroku', priority: 'low', completed: false)
    ]
  end
end

