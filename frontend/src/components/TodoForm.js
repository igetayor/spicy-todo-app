import React, { useState } from 'react';
import { Plus, Zap, Calendar, Clock, Repeat } from 'lucide-react';
import './TodoForm.css';

const TodoForm = ({ onAddTodo }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('none');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTodo(text.trim(), priority, dueDate, reminderTime, recurrenceRule);
      setText('');
      setPriority('medium');
      setDueDate('');
      setReminderTime('');
      setRecurrenceRule('none');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="todo-form-container">
        <div className="input-group">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What needs to be done? 🌶️"
            className="todo-input"
            maxLength={200}
          />
          <button type="submit" className="add-button" disabled={!text.trim()}>
            <Plus size={20} />
            <span>Add</span>
          </button>
        </div>
        
        <div className="form-controls">
          <div className="priority-selector">
            <label className="priority-label">
              <Zap size={16} />
              Priority:
            </label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              className="priority-select"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>
          
          <div className="due-date-selector">
            <label className="due-date-label">
              <Calendar size={16} />
              Due Date:
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="due-date-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          {dueDate && (
            <div className="reminder-selector">
              <label className="reminder-label">
                <Clock size={16} />
                Reminder:
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="reminder-input"
              />
            </div>
          )}

          <div className="recurrence-selector">
            <label className="recurrence-label">
              <Repeat size={16} />
              Repeat:
            </label>
            <select 
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className="recurrence-select"
            >
              <option value="none">No repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TodoForm;
