import React from 'react';
import TodoItem from './TodoItem';
import EmptyState from './EmptyState';
import './TodoList.css';

const TodoList = ({ todos, onToggleTodo, onUpdateTodo, onDeleteTodo }) => {
  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="todo-list">
      <div className="todo-list-container">
        {todos.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            index={index}
            onToggleTodo={onToggleTodo}
            onUpdateTodo={onUpdateTodo}
            onDeleteTodo={onDeleteTodo}
          />
        ))}
      </div>
    </div>
  );
};

export default TodoList;
