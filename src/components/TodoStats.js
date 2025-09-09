import React from 'react';
import { CheckCircle, Circle, Clock, TrendingUp } from 'lucide-react';
import './TodoStats.css';

const TodoStats = ({ todos }) => {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const activeTodos = totalTodos - completedTodos;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const getPriorityCount = (priority) => {
    return todos.filter(todo => todo.priority === priority).length;
  };

  const highPriority = getPriorityCount('high');
  const mediumPriority = getPriorityCount('medium');
  const lowPriority = getPriorityCount('low');

  const stats = [
    {
      label: 'Total',
      value: totalTodos,
      icon: Circle,
      color: '#6b7280',
      bgColor: '#f3f4f6'
    },
    {
      label: 'Active',
      value: activeTodos,
      icon: Clock,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      label: 'Completed',
      value: completedTodos,
      icon: CheckCircle,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      label: 'Progress',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: '#3b82f6',
      bgColor: '#dbeafe'
    }
  ];

  return (
    <div className="todo-stats">
      <div className="stats-container">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.label} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div 
                  className="stat-icon" 
                  style={{ 
                    backgroundColor: stat.bgColor,
                    color: stat.color 
                  }}
                >
                  <IconComponent size={20} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {totalTodos > 0 && (
          <div className="priority-breakdown">
            <h4 className="breakdown-title">Priority Breakdown</h4>
            <div className="priority-stats">
              <div className="priority-stat">
                <span className="priority-dot high"></span>
                <span className="priority-label">High: {highPriority}</span>
              </div>
              <div className="priority-stat">
                <span className="priority-dot medium"></span>
                <span className="priority-label">Medium: {mediumPriority}</span>
              </div>
              <div className="priority-stat">
                <span className="priority-dot low"></span>
                <span className="priority-label">Low: {lowPriority}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoStats;
