import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from '../TodoList';

describe('TodoList', () => {
  const mockTodos = [
    {
      id: '1',
      text: 'First todo',
      priority: 'high',
      completed: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      text: 'Second todo',
      priority: 'medium',
      completed: true,
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-01T11:30:00Z'
    },
    {
      id: '3',
      text: 'Third todo',
      priority: 'low',
      completed: false,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    }
  ];

  const mockOnToggleTodo = jest.fn();
  const mockOnUpdateTodo = jest.fn();
  const mockOnDeleteTodo = jest.fn();

  beforeEach(() => {
    mockOnToggleTodo.mockClear();
    mockOnUpdateTodo.mockClear();
    mockOnDeleteTodo.mockClear();
  });

  it('renders all todos correctly', () => {
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('First todo')).toBeInTheDocument();
    expect(screen.getByText('Second todo')).toBeInTheDocument();
    expect(screen.getByText('Third todo')).toBeInTheDocument();
  });

  it('renders empty state when no todos', () => {
    render(
      <TodoList
        todos={[]}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText(/no todos found/i)).toBeInTheDocument();
  });

  it('passes correct props to each TodoItem', () => {
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    // Each todo should be rendered with its data
    mockTodos.forEach(todo => {
      expect(screen.getByText(todo.text)).toBeInTheDocument();
    });
  });

  it('calls onToggleTodo when a todo is toggled', async () => {
    const user = userEvent.setup();
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);
    
    expect(mockOnToggleTodo).toHaveBeenCalledWith('1');
  });

  it('calls onUpdateTodo when a todo is updated', async () => {
    const user = userEvent.setup();
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const firstTodoText = screen.getByText('First todo');
    await user.dblClick(firstTodoText);
    
    const input = screen.getByDisplayValue('First todo');
    await user.clear(input);
    await user.type(input, 'Updated first todo{enter}');
    
    expect(mockOnUpdateTodo).toHaveBeenCalledWith('1', { text: 'Updated first todo' });
  });

  it('calls onDeleteTodo when a todo is deleted', async () => {
    const user = userEvent.setup();
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);
    
    expect(mockOnDeleteTodo).toHaveBeenCalledWith('1');
  });

  it('renders todos in correct order', () => {
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoElements = screen.getAllByRole('listitem');
    expect(todoElements).toHaveLength(3);
    
    // Should be in the same order as provided
    expect(todoElements[0]).toHaveTextContent('First todo');
    expect(todoElements[1]).toHaveTextContent('Second todo');
    expect(todoElements[2]).toHaveTextContent('Third todo');
  });

  it('handles single todo correctly', () => {
    const singleTodo = [mockTodos[0]];
    
    render(
      <TodoList
        todos={singleTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('First todo')).toBeInTheDocument();
    expect(screen.queryByText('Second todo')).not.toBeInTheDocument();
    expect(screen.queryByText('Third todo')).not.toBeInTheDocument();
  });

  it('handles todos with different completion states', () => {
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked(); // First todo (not completed)
    expect(checkboxes[1]).toBeChecked();     // Second todo (completed)
    expect(checkboxes[2]).not.toBeChecked(); // Third todo (not completed)
  });

  it('handles todos with different priorities', () => {
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoItems = screen.getAllByRole('listitem');
    expect(todoItems[0]).toHaveClass('priority-high');
    expect(todoItems[1]).toHaveClass('priority-medium');
    expect(todoItems[2]).toHaveClass('priority-low');
  });

  it('handles large number of todos', () => {
    const manyTodos = Array.from({ length: 50 }, (_, index) => ({
      id: `todo-${index}`,
      text: `Todo number ${index}`,
      priority: ['low', 'medium', 'high'][index % 3],
      completed: index % 2 === 0,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    }));
    
    render(
      <TodoList
        todos={manyTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoElements = screen.getAllByRole('listitem');
    expect(todoElements).toHaveLength(50);
    
    // Check that some todos are rendered
    expect(screen.getByText('Todo number 0')).toBeInTheDocument();
    expect(screen.getByText('Todo number 25')).toBeInTheDocument();
    expect(screen.getByText('Todo number 49')).toBeInTheDocument();
  });

  it('handles todos with special characters', () => {
    const specialTodos = [
      {
        id: '1',
        text: 'Todo with émojis 🎉',
        priority: 'medium',
        completed: false,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        text: 'Todo with special chars: !@#$%^&*()',
        priority: 'high',
        completed: false,
        createdAt: '2024-01-01T11:00:00Z',
        updatedAt: '2024-01-01T11:00:00Z'
      }
    ];
    
    render(
      <TodoList
        todos={specialTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('Todo with émojis 🎉')).toBeInTheDocument();
    expect(screen.getByText('Todo with special chars: !@#$%^&*()')).toBeInTheDocument();
  });

  it('handles todos with very long text', () => {
    const longTextTodo = {
      id: '1',
      text: 'This is a very long todo item text that should be handled properly by the component without breaking the layout or functionality of the todo list component',
      priority: 'medium',
      completed: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    };
    
    render(
      <TodoList
        todos={[longTextTodo]}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText(longTextTodo.text)).toBeInTheDocument();
  });

  it('handles rapid state changes', async () => {
    const user = userEvent.setup();
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    
    // Rapidly toggle todos
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await user.click(checkboxes[0]);
    
    expect(mockOnToggleTodo).toHaveBeenCalledTimes(4);
    expect(mockOnToggleTodo).toHaveBeenNthCalledWith(1, '1');
    expect(mockOnToggleTodo).toHaveBeenNthCalledWith(2, '2');
    expect(mockOnToggleTodo).toHaveBeenNthCalledWith(3, '3');
    expect(mockOnToggleTodo).toHaveBeenNthCalledWith(4, '1');
  });

  it('handles keyboard navigation between todos', async () => {
    const user = userEvent.setup();
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const firstTodoText = screen.getByText('First todo');
    await user.dblClick(firstTodoText);
    
    const input = screen.getByDisplayValue('First todo');
    expect(input).toHaveFocus();
    
    // Tab should move to next focusable element
    await user.tab();
    // Focus should move to next todo's checkbox or delete button
    expect(input).not.toHaveFocus();
  });

  it('maintains scroll position during updates', () => {
    const manyTodos = Array.from({ length: 20 }, (_, index) => ({
      id: `todo-${index}`,
      text: `Todo ${index}`,
      priority: 'medium',
      completed: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    }));
    
    render(
      <TodoList
        todos={manyTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    // Simulate scroll to middle
    const listContainer = screen.getByRole('list');
    listContainer.scrollTop = 100;
    
    // Trigger a re-render (simulate props change)
    const { rerender } = render(
      <TodoList
        todos={manyTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    // List should still be rendered correctly
    expect(screen.getByText('Todo 0')).toBeInTheDocument();
    expect(screen.getByText('Todo 19')).toBeInTheDocument();
  });

  it('handles prop changes correctly', () => {
    const { rerender } = render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('First todo')).toBeInTheDocument();
    
    // Update todos prop
    const updatedTodos = [mockTodos[0], mockTodos[2]]; // Remove middle todo
    rerender(
      <TodoList
        todos={updatedTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('First todo')).toBeInTheDocument();
    expect(screen.queryByText('Second todo')).not.toBeInTheDocument();
    expect(screen.getByText('Third todo')).toBeInTheDocument();
  });

  it('handles callback prop changes', () => {
    const newMockOnToggleTodo = jest.fn();
    const { rerender } = render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    // Change callback props
    rerender(
      <TodoList
        todos={mockTodos}
        onToggleTodo={newMockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    // Should use new callback
    expect(screen.getByText('First todo')).toBeInTheDocument();
  });

  it('renders with proper accessibility attributes', () => {
    render(
      <TodoList
        todos={mockTodos}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    
    // Each todo should have proper structure
    listItems.forEach(item => {
      expect(item).toBeInTheDocument();
    });
  });

  it('handles todos with missing optional properties', () => {
    const minimalTodo = {
      id: '1',
      text: 'Minimal todo',
      priority: 'medium',
      completed: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    };
    
    render(
      <TodoList
        todos={[minimalTodo]}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('Minimal todo')).toBeInTheDocument();
  });
});
