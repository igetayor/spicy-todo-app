import React from 'react';
import { CheckCircle, Circle, Clock, TrendingUp, Calendar, AlertTriangle, CalendarDays } from 'lucide-react';
import './TodoStats.css';

const TodoStats = ({ todos, stats }) => {
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

  // Due date statistics
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = todos.filter(todo => 
    !todo.completed && todo.dueDate && todo.dueDate < today
  ).length;
  const dueTodayCount = todos.filter(todo => 
    !todo.completed && todo.dueDate && todo.dueDate === today
  ).length;
  const upcomingCount = todos.filter(todo => {
    if (!todo.completed && todo.dueDate && todo.dueDate > today) {
      const dueDate = new Date(todo.dueDate);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return dueDate <= nextWeek;
    }
    return false;
  }).length;

  const mainStats = [
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

  const dueDateStats = [
    {
      label: 'Overdue',
      value: overdueCount,
      icon: AlertTriangle,
      color: '#dc2626',
      bgColor: '#fee2e2'
    },
    {
      label: 'Due Today',
      value: dueTodayCount,
      icon: Calendar,
      color: '#d97706',
      bgColor: '#fed7aa'
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: CalendarDays,
      color: '#7c3aed',
      bgColor: '#e9d5ff'
    }
  ];

  return (
    <div className="todo-stats">
      <div className="stats-container">
        <div className="stats-grid">
          {mainStats.map((stat, index) => {
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

        {(overdueCount > 0 || dueTodayCount > 0 || upcomingCount > 0) && (
          <div className="due-date-stats">
            <h4 className="breakdown-title">Due Date Overview</h4>
            <div className="stats-grid due-date-grid">
              {dueDateStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={stat.label} className="stat-card due-date-card" style={{ animationDelay: `${(index + 4) * 0.1}s` }}>
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
          </div>
        )}

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
