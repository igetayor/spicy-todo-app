import React, { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import './TodoItem.css';

const TodoItem = ({ todo, onToggleTodo, onUpdateTodo, onDeleteTodo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(todo.text);
  };

  const handleSave = () => {
    if (editText.trim() && editText !== todo.text) {
      onUpdateTodo(todo.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '🟡';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-content">
        <div className="todo-checkbox">
          <div 
            className={`checkbox ${todo.completed ? 'checked' : ''}`}
            onClick={() => onToggleTodo(todo.id)}
          />
        </div>
        
        <div className="todo-main">
          {isEditing ? (
            <div className="edit-form">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="edit-input"
                autoFocus
                maxLength={200}
              />
              <div className="edit-actions">
                <button onClick={handleSave} className="save-button">
                  <Check size={16} />
                </button>
                <button onClick={handleCancel} className="cancel-button">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="todo-text">{todo.text}</div>
              <div className="todo-meta">
                <span className="priority-badge">
                  {getPriorityEmoji(todo.priority)} {todo.priority}
                </span>
                <span className="todo-date">
                  {todo.completed ? 'Completed' : 'Created'} {formatDate(todo.completed ? todo.updatedAt : todo.createdAt)}
                </span>
              </div>
            </>
          )}
        </div>
        
        {!isEditing && (
          <div className="todo-actions">
            <button onClick={handleEdit} className="action-button edit-button">
              <Edit2 size={16} />
            </button>
            <button onClick={() => onDeleteTodo(todo.id)} className="action-button delete-button">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
