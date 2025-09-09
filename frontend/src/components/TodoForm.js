import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import './TodoForm.css';

const TodoForm = ({ onAddTodo }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTodo(text.trim(), priority);
      setText('');
      setPriority('medium');
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
      </div>
    </form>
  );
};

export default TodoForm;
