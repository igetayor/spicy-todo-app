import { logger } from '../utils/logger';

class ReminderService {
  constructor() {
    this.reminderCheckInterval = null;
    this.notificationPermission = null;
    this.init();
  }

  init() {
    // Request notification permission
    if ('Notification' in window) {
      this.requestNotificationPermission();
    }
    
    // Start checking for reminders
    this.startReminderCheck();
    
    logger.info('Reminder service initialized');
  }

  async requestNotificationPermission() {
    try {
      if (Notification.permission === 'default') {
        this.notificationPermission = await Notification.requestPermission();
      } else {
        this.notificationPermission = Notification.permission;
      }
      
      logger.info('Notification permission status', { 
        permission: this.notificationPermission 
      });
    } catch (error) {
      logger.error('Error requesting notification permission', { error });
    }
  }

  startReminderCheck() {
    // Check for reminders every minute
    this.reminderCheckInterval = setInterval(() => {
      this.checkReminders();
    }, 60000); // 60 seconds
    
    // Also check immediately
    this.checkReminders();
  }

  stopReminderCheck() {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
      this.reminderCheckInterval = null;
    }
  }

  checkReminders() {
    const todos = this.getTodosFromStorage();
    const now = new Date();
    
    todos.forEach(todo => {
      if (todo.dueDate && todo.reminderTime && !todo.completed) {
        const reminderDateTime = new Date(`${todo.dueDate}T${todo.reminderTime}`);
        const timeDiff = reminderDateTime - now;
        
        // Check if reminder time is within the next 5 minutes and hasn't been shown yet
        if (timeDiff >= 0 && timeDiff <= 5 * 60 * 1000) {
          const reminderKey = `reminder_${todo.id}_${todo.dueDate}_${todo.reminderTime}`;
          const hasShownReminder = localStorage.getItem(reminderKey);
          
          if (!hasShownReminder) {
            this.showReminder(todo);
            localStorage.setItem(reminderKey, 'shown');
          }
        }
      }
    });
  }

  showReminder(todo) {
    // Show browser notification
    if (this.notificationPermission === 'granted') {
      const notification = new Notification(`🌶️ Reminder: ${todo.text}`, {
        body: `Due: ${this.formatDate(todo.dueDate)} at ${todo.reminderTime}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `todo-${todo.id}`,
        requireInteraction: true,
        actions: [
          {
            action: 'complete',
            title: 'Mark Complete'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    // Show in-app notification
    this.showInAppNotification(todo);
    
    logger.info('Reminder shown', { 
      todoId: todo.id, 
      text: todo.text, 
      dueDate: todo.dueDate, 
      reminderTime: todo.reminderTime 
    });
  }

  showInAppNotification(todo) {
    // Create a custom notification element
    const notification = document.createElement('div');
    notification.className = 'reminder-notification';
    notification.innerHTML = `
      <div class="reminder-content">
        <div class="reminder-icon">🔔</div>
        <div class="reminder-text">
          <div class="reminder-title">${todo.text}</div>
          <div class="reminder-subtitle">Due: ${this.formatDate(todo.dueDate)} at ${todo.reminderTime}</div>
        </div>
        <button class="reminder-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #ff6b6b;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .reminder-notification .reminder-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .reminder-notification .reminder-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      .reminder-notification .reminder-text {
        flex: 1;
      }
      .reminder-notification .reminder-title {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.25rem;
      }
      .reminder-notification .reminder-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
      }
      .reminder-notification .reminder-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #9ca3af;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      .reminder-notification .reminder-close:hover {
        background-color: #f3f4f6;
        color: #374151;
      }
    `;
    
    if (!document.head.querySelector('style[data-reminder-styles]')) {
      style.setAttribute('data-reminder-styles', 'true');
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 8000);
  }

  getTodosFromStorage() {
    // This would typically come from your app state or API
    // For now, we'll try to get it from localStorage or return empty array
    try {
      const todos = localStorage.getItem('spicy-todos');
      return todos ? JSON.parse(todos) : [];
    } catch (error) {
      logger.error('Error getting todos from storage', { error });
      return [];
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  // Method to be called when todos are updated
  updateTodos(todos) {
    try {
      localStorage.setItem('spicy-todos', JSON.stringify(todos));
    } catch (error) {
      logger.error('Error updating todos in storage', { error });
    }
  }

  // Clean up old reminder flags (call this periodically)
  cleanupOldReminders() {
    const keys = Object.keys(localStorage);
    const reminderKeys = keys.filter(key => key.startsWith('reminder_'));
    
    reminderKeys.forEach(key => {
      const [, , dueDate] = key.split('_');
      const reminderDate = new Date(dueDate);
      const now = new Date();
      
      // Remove reminder flags older than 7 days
      if (now - reminderDate > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
      }
    });
  }

  destroy() {
    this.stopReminderCheck();
    logger.info('Reminder service destroyed');
  }
}

// Create singleton instance
const reminderService = new ReminderService();

export default reminderService;


