import React from 'react';
import { CheckSquare, Plus, Sparkles } from 'lucide-react';
import './EmptyState.css';

const EmptyState = () => {
  return (
    <div className="empty-state">
      <div className="empty-content">
        <div className="empty-icon">
          <CheckSquare size={64} />
        </div>
        <h3 className="empty-title">No todos found</h3>
        <p className="empty-description">
          Looks like you're all caught up! 🎉<br />
          Add a new todo to get started.
        </p>
        <div className="empty-actions">
          <div className="action-hint">
            <Plus size={16} />
            <span>Click the "Add" button above to create your first todo</span>
          </div>
        </div>
        <div className="sparkle-container">
          <Sparkles size={20} className="sparkle sparkle-1" />
          <Sparkles size={16} className="sparkle sparkle-2" />
          <Sparkles size={24} className="sparkle sparkle-3" />
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
