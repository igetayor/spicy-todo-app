import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoForm from '../TodoForm';

describe('TodoForm', () => {
  const mockOnAddTodo = jest.fn();

  beforeEach(() => {
    mockOnAddTodo.mockClear();
  });

  it('renders form elements correctly', () => {
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    expect(screen.getByPlaceholderText(/what needs to be done/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('medium')).toBeInTheDocument();
  });

  it('handles text input changes', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(input, 'Test todo');
    
    expect(input).toHaveValue('Test todo');
  });

  it('handles priority selection changes', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const select = screen.getByLabelText(/priority/i);
    await user.selectOptions(select, 'high');
    
    expect(select).toHaveValue('high');
  });

  it('calls onAddTodo with correct parameters when form is submitted', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const select = screen.getByLabelText(/priority/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    await user.type(input, 'Test todo');
    await user.selectOptions(select, 'high');
    await user.click(submitButton);
    
    expect(mockOnAddTodo).toHaveBeenCalledWith('Test todo', 'high');
  });

  it('calls onAddTodo when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(input, 'Test todo{enter}');
    
    expect(mockOnAddTodo).toHaveBeenCalledWith('Test todo', 'medium');
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const select = screen.getByLabelText(/priority/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    await user.type(input, 'Test todo');
    await user.selectOptions(select, 'high');
    await user.click(submitButton);
    
    expect(input).toHaveValue('');
    expect(select).toHaveValue('medium'); // Reset to default
  });

  it('does not call onAddTodo with empty text', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const submitButton = screen.getByRole('button', { name: /add/i });
    await user.click(submitButton);
    
    expect(mockOnAddTodo).not.toHaveBeenCalled();
  });

  it('does not call onAddTodo with whitespace-only text', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    await user.type(input, '   ');
    await user.click(submitButton);
    
    expect(mockOnAddTodo).not.toHaveBeenCalled();
  });

  it('trims whitespace from text input', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    await user.type(input, '  Test todo  ');
    await user.click(submitButton);
    
    expect(mockOnAddTodo).toHaveBeenCalledWith('Test todo', 'medium');
  });

  it('disables submit button when text input is empty', () => {
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const submitButton = screen.getByRole('button', { name: /add/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when text input has content', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    expect(submitButton).toBeDisabled();
    
    await user.type(input, 'Test todo');
    
    expect(submitButton).toBeEnabled();
  });

  it('handles maximum length input', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const longText = 'a'.repeat(200); // Max length is 200
    
    await user.type(input, longText);
    
    expect(input).toHaveValue(longText);
    expect(input).toHaveAttribute('maxLength', '200');
  });

  it('prevents submission when text exceeds max length', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    // Type text that exceeds max length
    const longText = 'a'.repeat(250);
    await user.type(input, longText);
    
    // The input should be limited by maxLength attribute
    expect(input.value.length).toBeLessThanOrEqual(200);
  });

  it('handles multiple priority options', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const select = screen.getByLabelText(/priority/i);
    
    // Test all priority options
    const priorities = ['low', 'medium', 'high'];
    
    for (const priority of priorities) {
      await user.selectOptions(select, priority);
      expect(select).toHaveValue(priority);
    }
  });

  it('handles form submission with different priority combinations', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const select = screen.getByLabelText(/priority/i);
    const submitButton = screen.getByRole('button', { name: /add/i });
    
    const testCases = [
      { text: 'Low priority task', priority: 'low' },
      { text: 'Medium priority task', priority: 'medium' },
      { text: 'High priority task', priority: 'high' },
    ];
    
    for (const testCase of testCases) {
      await user.clear(input);
      await user.type(input, testCase.text);
      await user.selectOptions(select, testCase.priority);
      await user.click(submitButton);
      
      expect(mockOnAddTodo).toHaveBeenCalledWith(testCase.text, testCase.priority);
      
      // Reset for next iteration
      mockOnAddTodo.mockClear();
    }
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    
    // Focus should start on input
    input.focus();
    expect(input).toHaveFocus();
    
    // Tab should move to priority select
    await user.tab();
    const select = screen.getByLabelText(/priority/i);
    expect(select).toHaveFocus();
    
    // Tab should move to submit button
    await user.tab();
    const submitButton = screen.getByRole('button', { name: /add/i });
    expect(submitButton).toHaveFocus();
  });

  it('handles Enter key on priority select', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const select = screen.getByLabelText(/priority/i);
    
    await user.type(input, 'Test todo');
    await user.click(select); // Focus select
    await user.keyboard('{Enter}'); // Press Enter on select
    
    // Should not trigger form submission when Enter is pressed on select
    expect(mockOnAddTodo).not.toHaveBeenCalled();
  });

  it('maintains form state during typing', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const select = screen.getByLabelText(/priority/i);
    
    await user.type(input, 'Test');
    await user.selectOptions(select, 'high');
    
    expect(input).toHaveValue('Test');
    expect(select).toHaveValue('high');
    
    await user.type(input, ' todo');
    
    expect(input).toHaveValue('Test todo');
    expect(select).toHaveValue('high'); // Should maintain selection
  });

  it('handles rapid typing', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    
    // Type rapidly
    await user.type(input, 'Rapid typing test', { delay: 10 });
    
    expect(input).toHaveValue('Rapid typing test');
  });

  it('handles copy and paste', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    
    // Simulate paste operation
    await user.click(input);
    await user.paste('Pasted text');
    
    expect(input).toHaveValue('Pasted text');
  });

  it('handles form reset', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const select = screen.getByLabelText(/priority/i);
    
    await user.type(input, 'Test todo');
    await user.selectOptions(select, 'high');
    
    // Submit form (which resets it)
    const submitButton = screen.getByRole('button', { name: /add/i });
    await user.click(submitButton);
    
    expect(input).toHaveValue('');
    expect(select).toHaveValue('medium');
  });
});
