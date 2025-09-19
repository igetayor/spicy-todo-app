import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoItem from '../TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    id: '1',
    text: 'Test todo item',
    priority: 'medium',
    completed: false,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  };

  const mockOnToggleTodo = jest.fn();
  const mockOnUpdateTodo = jest.fn();
  const mockOnDeleteTodo = jest.fn();

  beforeEach(() => {
    mockOnToggleTodo.mockClear();
    mockOnUpdateTodo.mockClear();
    mockOnDeleteTodo.mockClear();
  });

  it('renders todo item correctly', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText('Test todo item')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('displays correct priority indicator', () => {
    const highPriorityTodo = { ...mockTodo, priority: 'high' };
    render(
      <TodoItem
        todo={highPriorityTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    // Should have high priority styling/indicator
    const todoElement = screen.getByText('Test todo item').closest('.todo-item');
    expect(todoElement).toHaveClass('priority-high');
  });

  it('displays completed state correctly', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(
      <TodoItem
        todo={completedTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    const todoText = screen.getByText('Test todo item');
    expect(todoText).toHaveClass('completed');
  });

  it('calls onToggleTodo when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(mockOnToggleTodo).toHaveBeenCalledWith(mockTodo.id);
  });

  it('calls onDeleteTodo when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    
    expect(mockOnDeleteTodo).toHaveBeenCalledWith(mockTodo.id);
  });

  it('enters edit mode when text is double-clicked', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    // Should show input field for editing
    expect(screen.getByDisplayValue('Test todo item')).toBeInTheDocument();
    expect(screen.queryByText('Test todo item')).not.toBeInTheDocument();
  });

  it('exits edit mode and saves when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    await user.clear(input);
    await user.type(input, 'Updated todo text{enter}');
    
    expect(mockOnUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { text: 'Updated todo text' });
    expect(screen.getByText('Updated todo item')).toBeInTheDocument();
  });

  it('exits edit mode and cancels when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    await user.clear(input);
    await user.type(input, 'This should be cancelled');
    await user.keyboard('{Escape}');
    
    expect(mockOnUpdateTodo).not.toHaveBeenCalled();
    expect(screen.getByText('Test todo item')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('This should be cancelled')).not.toBeInTheDocument();
  });

  it('exits edit mode and saves when input loses focus', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    await user.clear(input);
    await user.type(input, 'Updated via blur');
    await user.tab(); // Move focus away
    
    expect(mockOnUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { text: 'Updated via blur' });
  });

  it('does not save empty text when editing', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    await user.clear(input);
    await user.keyboard('{Enter}');
    
    expect(mockOnUpdateTodo).not.toHaveBeenCalled();
    expect(screen.getByText('Test todo item')).toBeInTheDocument();
  });

  it('does not save whitespace-only text when editing', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    await user.clear(input);
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    
    expect(mockOnUpdateTodo).not.toHaveBeenCalled();
    expect(screen.getByText('Test todo item')).toBeInTheDocument();
  });

  it('trims whitespace when saving edited text', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    await user.clear(input);
    await user.type(input, '  Trimmed text  ');
    await user.keyboard('{Enter}');
    
    expect(mockOnUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { text: 'Trimmed text' });
  });

  it('handles keyboard navigation in edit mode', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    expect(input).toHaveFocus();
    
    // Test arrow keys for text navigation
    await user.keyboard('{ArrowRight}');
    await user.type(input, 'X');
    expect(input.value).toContain('X');
  });

  it('selects all text when entering edit mode', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue('Test todo item');
    
    // Type new text (should replace selected text)
    await user.type(input, 'New text');
    
    expect(input.value).toBe('New text');
  });

  it('handles different priority levels correctly', () => {
    const priorities = ['low', 'medium', 'high'];
    
    priorities.forEach(priority => {
      const todo = { ...mockTodo, priority };
      const { unmount } = render(
        <TodoItem
          todo={todo}
          onToggleTodo={mockOnToggleTodo}
          onUpdateTodo={mockOnUpdateTodo}
          onDeleteTodo={mockOnDeleteTodo}
        />
      );
      
      const todoElement = screen.getByText('Test todo item').closest('.todo-item');
      expect(todoElement).toHaveClass(`priority-${priority}`);
      
      unmount();
    });
  });

  it('handles completed and active states correctly', () => {
    const states = [true, false];
    
    states.forEach(completed => {
      const todo = { ...mockTodo, completed };
      const { unmount } = render(
        <TodoItem
          todo={todo}
          onToggleTodo={mockOnToggleTodo}
          onUpdateTodo={mockOnUpdateTodo}
          onDeleteTodo={mockOnDeleteTodo}
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.checked).toBe(completed);
      
      const todoText = screen.getByText('Test todo item');
      if (completed) {
        expect(todoText).toHaveClass('completed');
      } else {
        expect(todoText).not.toHaveClass('completed');
      }
      
      unmount();
    });
  });

  it('prevents multiple simultaneous edits', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const todoText = screen.getByText('Test todo item');
    
    // Start editing
    await user.dblClick(todoText);
    expect(screen.getByDisplayValue('Test todo item')).toBeInTheDocument();
    
    // Try to start editing again (should not create another input)
    await user.dblClick(screen.getByDisplayValue('Test todo item'));
    const inputs = screen.getAllByDisplayValue('Test todo item');
    expect(inputs).toHaveLength(1);
  });

  it('handles very long text correctly', async () => {
    const longText = 'This is a very long todo item text that should be handled properly by the component without breaking the layout or functionality';
    const longTodo = { ...mockTodo, text: longText };
    
    render(
      <TodoItem
        todo={longTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText(longText)).toBeInTheDocument();
    
    // Should still be able to edit long text
    const user = userEvent.setup();
    const todoText = screen.getByText(longText);
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue(longText);
    expect(input).toBeInTheDocument();
  });

  it('handles special characters in text', async () => {
    const specialText = 'Todo with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    const specialTodo = { ...mockTodo, text: specialText };
    
    render(
      <TodoItem
        todo={specialTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    expect(screen.getByText(specialText)).toBeInTheDocument();
    
    // Should be able to edit text with special characters
    const user = userEvent.setup();
    const todoText = screen.getByText(specialText);
    await user.dblClick(todoText);
    
    const input = screen.getByDisplayValue(specialText);
    expect(input).toBeInTheDocument();
  });

  it('handles rapid clicks gracefully', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    
    // Rapid clicks
    await user.click(checkbox);
    await user.click(checkbox);
    await user.click(checkbox);
    
    // Should have called toggle for each click
    expect(mockOnToggleTodo).toHaveBeenCalledTimes(3);
  });

  it('handles delete button hover states', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleTodo={mockOnToggleTodo}
        onUpdateTodo={mockOnUpdateTodo}
        onDeleteTodo={mockOnDeleteTodo}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    
    // Hover over delete button
    await user.hover(deleteButton);
    expect(deleteButton).toBeInTheDocument();
    
    // Move mouse away
    await user.unhover(deleteButton);
    expect(deleteButton).toBeInTheDocument();
  });
});
