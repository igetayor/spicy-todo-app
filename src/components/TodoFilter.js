import React from 'react';
import { Search, Filter, Trash2 } from 'lucide-react';
import './TodoFilter.css';

const TodoFilter = ({ 
  filter, 
  onFilterChange, 
  searchTerm, 
  onSearchChange, 
  onClearCompleted, 
  completedCount 
}) => {
  const filterOptions = [
    { value: 'all', label: 'All', emoji: '📋' },
    { value: 'active', label: 'Active', emoji: '🔥' },
    { value: 'completed', label: 'Done', emoji: '✅' }
  ];

  return (
    <div className="todo-filter">
      <div className="filter-container">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search todos..."
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-label">
            <Filter size={16} />
            <span>Filter:</span>
          </div>
          <div className="filter-buttons">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`filter-button ${filter === option.value ? 'active' : ''}`}
              >
                <span className="filter-emoji">{option.emoji}</span>
                <span className="filter-text">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {completedCount > 0 && (
          <div className="clear-section">
            <button
              onClick={onClearCompleted}
              className="clear-button"
              title={`Clear ${completedCount} completed todo${completedCount > 1 ? 's' : ''}`}
            >
              <Trash2 size={16} />
              <span>Clear Done ({completedCount})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoFilter;
