export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "focus"
    | "break"
    | "achievement";
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    style?: "primary" | "secondary" | "danger";
  }>;
  persistent?: boolean;
  autoDismiss?: number; // seconds
  psychology?: "motivation" | "progress" | "social" | "achievement" | "urgency";
}

export interface NotificationSettings {
  enabled: boolean;
  browserNotifications: boolean;
  focusReminders: boolean;
  breakReminders: boolean;
  achievementNotifications: boolean;
  dailyGoalReminders: boolean;
  weeklyReports: boolean;
  distractionAlerts: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

class NotificationServiceClass {
  private notifications: AppNotification[] = [];
  private settings: NotificationSettings;
  private readonly STORAGE_KEY = "notification_service_data";
  private readonly SETTINGS_KEY = "notification_settings";

  constructor() {
    this.loadSettings();
    this.loadNotifications();
    this.requestPermission();
  }

  // Load settings from storage
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      } else {
        this.settings = this.getDefaultSettings();
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
      this.settings = this.getDefaultSettings();
    }
  }

  // Get default settings
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      browserNotifications: true,
      focusReminders: true,
      breakReminders: true,
      achievementNotifications: true,
      dailyGoalReminders: true,
      weeklyReports: false,
      distractionAlerts: true,
      soundEnabled: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
    };
  }

  // Save settings
  private saveSettings(): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  }

  // Load notifications from storage
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = data.notifications || [];
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }

  // Save notifications to storage
  private saveNotifications(): void {
    try {
      const data = {
        notifications: this.notifications,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  // Request browser notification permission
  private async requestPermission(): Promise<void> {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  // Check if in quiet hours
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.settings.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMin] = this.settings.quietHours.end
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // Show notification
  showNotification(
    notification: Omit<AppNotification, "id" | "timestamp" | "read">,
  ): string {
    if (!this.settings.enabled || this.isQuietHours()) {
      return "";
    }

    const fullNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Add to notifications array
    this.notifications.unshift(fullNotification);

    // Keep only latest 50 notifications
    this.notifications = this.notifications.slice(0, 50);
    this.saveNotifications();

    // Show browser notification if enabled
    if (
      this.settings.browserNotifications &&
      this.shouldShowBrowserNotification(notification.type)
    ) {
      this.showBrowserNotification(fullNotification);
    }

    // Show in-app notification
    this.showInAppNotification(fullNotification);

    return fullNotification.id;
  }

  // Check if should show browser notification for type
  private shouldShowBrowserNotification(
    type: AppNotification["type"],
  ): boolean {
    switch (type) {
      case "focus":
        return this.settings.focusReminders;
      case "break":
        return this.settings.breakReminders;
      case "achievement":
        return this.settings.achievementNotifications;
      case "warning":
        return this.settings.distractionAlerts;
      default:
        return true;
    }
  }

  // Show browser notification
  private showBrowserNotification(notification: AppNotification): void {
    if ("Notification" in window && Notification.permission === "granted") {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: "/placeholder.svg",
        tag: notification.id,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotif.close();
      }, 5000);

      browserNotif.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotif.close();
      };
    }
  }

  // Show in-app notification
  private showInAppNotification(notification: AppNotification): void {
    const notificationElement = document.createElement("div");
    const typeColors = {
      info: "bg-blue-100 border-blue-200 text-blue-800",
      success: "bg-green-100 border-green-200 text-green-800",
      warning: "bg-yellow-100 border-yellow-200 text-yellow-800",
      error: "bg-red-100 border-red-200 text-red-800",
      focus: "bg-purple-100 border-purple-200 text-purple-800",
      break: "bg-orange-100 border-orange-200 text-orange-800",
      achievement: "bg-green-100 border-green-200 text-green-800",
    };

    const typeIcons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      focus: "🎯",
      break: "☕",
      achievement: "🏆",
    };

    notificationElement.className = `fixed top-4 right-4 ${typeColors[notification.type]} border rounded-lg p-4 shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300`;
    notificationElement.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="text-lg">${typeIcons[notification.type]}</div>
        <div class="flex-1">
          <h4 class="font-medium">${notification.title}</h4>
          <p class="text-sm mt-1">${notification.message}</p>
          ${
            notification.actions
              ? `
            <div class="mt-3 space-x-2">
              ${notification.actions
                .map(
                  (action) => `
                <button 
                  onclick="window.notificationService.handleAction('${notification.id}', '${action.action}')"
                  class="text-xs px-2 py-1 rounded ${action.style === "primary" ? "bg-current text-white" : "border border-current"}"
                >
                  ${action.label}
                </button>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
          <button onclick="this.closest('.fixed').remove(); window.notificationService.markAsRead('${notification.id}')" class="text-xs mt-2 underline opacity-75 hover:opacity-100">Dismiss</button>
        </div>
      </div>
    `;

    document.body.appendChild(notificationElement);

    // Animate in
    setTimeout(() => {
      notificationElement.classList.remove("translate-x-full");
    }, 100);

    // Auto dismiss if specified
    if (
      notification.autoDismiss ||
      (!notification.persistent && !notification.actionable)
    ) {
      const dismissTime = notification.autoDismiss
        ? notification.autoDismiss * 1000
        : 5000;
      setTimeout(() => {
        notificationElement.classList.add("translate-x-full");
        setTimeout(() => {
          if (notificationElement.parentElement) {
            notificationElement.remove();
          }
        }, 300);
      }, dismissTime);
    }
  }

  // Handle notification action
  handleAction(notificationId: string, action: string): void {
    console.log(`Handling action ${action} for notification ${notificationId}`);

    // Mark notification as read
    this.markAsRead(notificationId);

    // Handle specific actions
    switch (action) {
      case "start_session":
        window.location.href = "/focus";
        break;
      case "start_break":
        console.log("Starting break timer...");
        break;
      case "view_stats":
        window.location.href = "/statistics";
        break;
      case "enable_blocking":
        window.location.href = "/settings";
        break;
      default:
        console.log(`Unhandled action: ${action}`);
    }
  }

  // Get all notifications
  getNotifications(): AppNotification[] {
    return this.notifications;
  }

  // Get unread notifications
  getUnreadNotifications(): AppNotification[] {
    return this.notifications.filter((n) => !n.read);
  }

  // Get unread count
  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Update settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Get settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Schedule focus reminder
  scheduleFocusReminder(delay: number = 30): void {
    setTimeout(
      () => {
        this.showNotification({
          title: "🎯 Time to Focus!",
          message:
            "Ready for another productive session? Your goals are waiting!",
          type: "focus",
          actionable: true,
          actions: [
            {
              label: "Start Session",
              action: "start_session",
              style: "primary",
            },
            { label: "Remind Later", action: "dismiss" },
          ],
          psychology: "motivation",
        });
      },
      delay * 60 * 1000,
    );
  }

  // Schedule break reminder
  scheduleBreakReminder(delay: number = 25): void {
    setTimeout(
      () => {
        this.showNotification({
          title: "☕ Break Time!",
          message:
            "You've been focused for a while. Time for a refreshing break!",
          type: "break",
          actionable: true,
          actions: [
            { label: "Take Break", action: "start_break", style: "primary" },
            { label: "Keep Working", action: "dismiss" },
          ],
          psychology: "progress",
        });
      },
      delay * 60 * 1000,
    );
  }

  // Show achievement notification
  showAchievement(title: string, description: string): void {
    this.showNotification({
      title: `🏆 ${title}`,
      message: description,
      type: "achievement",
      psychology: "achievement",
      autoDismiss: 8,
    });
  }

  // Show focus streak notification
  showFocusStreak(days: number): void {
    this.showNotification({
      title: "🔥 Focus Streak!",
      message: `Amazing! You're on a ${days}-day focus streak. Keep the momentum going!`,
      type: "achievement",
      psychology: "social",
    });
  }
}

export const notificationService = new NotificationServiceClass();

// Make it available globally
if (typeof window !== "undefined") {
  (window as any).notificationService = notificationService;
}
