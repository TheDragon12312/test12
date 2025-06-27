export interface AppSettings {
  theme: "light" | "dark" | "auto";
  language: "nl" | "en" | "fr" | "de" | "es";
  compactMode: boolean;
  notifications: boolean;
  sounds: boolean;
  distractionBlocking: boolean;
  aiCoaching: boolean;
  emailNotifications: {
    dailyReport: boolean;
    weeklyReport: boolean;
    focusReminders: boolean;
    achievementNotifications: boolean;
  };
  focusSettings: {
    defaultDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
  };
  productivity: {
    dailyGoal: number; // minutes
    weeklyGoal: number; // minutes
    autoStartBreaks: boolean;
    showProgressNotifications: boolean;
  };
}

export class SettingsManager {
  private static readonly STORAGE_KEY = "focusflow_settings";

  // Default settings
  private static readonly DEFAULT_SETTINGS: AppSettings = {
    theme: "auto",
    language: "nl",
    compactMode: false,
    notifications: true,
    sounds: true,
    distractionBlocking: true,
    aiCoaching: true,
    emailNotifications: {
      dailyReport: false,
      weeklyReport: false,
      focusReminders: true,
      achievementNotifications: true,
    },
    focusSettings: {
      defaultDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    },
    productivity: {
      dailyGoal: 120, // 2 hours
      weeklyGoal: 600, // 10 hours
      autoStartBreaks: false,
      showProgressNotifications: true,
    },
  };

  // Get all settings
  static getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...this.DEFAULT_SETTINGS, ...parsedSettings };
      }
      return this.DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Failed to load settings:", error);
      return this.DEFAULT_SETTINGS;
    }
  }

  // Save settings
  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));

      // Apply theme immediately
      this.applyTheme(settings.theme);

      // Apply compact mode
      this.applyCompactMode(settings.compactMode);

      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }

  // Update specific setting
  static updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ): void {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    this.saveSettings(updatedSettings);
  }

  // Apply theme
  private static applyTheme(theme: "light" | "dark" | "auto"): void {
    const root = document.documentElement;

    if (theme === "auto") {
      // Use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }

  // Apply compact mode
  private static applyCompactMode(compactMode: boolean): void {
    const root = document.documentElement;
    root.classList.toggle("compact", compactMode);

    if (compactMode) {
      root.style.setProperty("--spacing-unit", "0.75rem");
      root.style.setProperty("--padding-base", "0.5rem");
    } else {
      root.style.setProperty("--spacing-unit", "1rem");
      root.style.setProperty("--padding-base", "1rem");
    }
  }

  // Initialize settings on app load
  static initialize(): void {
    const settings = this.getSettings();
    this.applyTheme(settings.theme);
    this.applyCompactMode(settings.compactMode);

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const currentSettings = this.getSettings();
        if (currentSettings.theme === "auto") {
          this.applyTheme("auto");
        }
      });
  }

  // Reset to defaults
  static resetToDefaults(): void {
    this.saveSettings(this.DEFAULT_SETTINGS);
  }

  // Export settings
  static exportSettings(): string {
    return JSON.stringify(this.getSettings(), null, 2);
  }

  // Import settings
  static importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      // Validate settings structure
      const validatedSettings = {
        ...this.DEFAULT_SETTINGS,
        ...importedSettings,
      };
      this.saveSettings(validatedSettings);
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  }

  // Get specific setting
  static getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const settings = this.getSettings();
    return settings[key];
  }

  // Get section of settings (alias for getSetting for complex objects)
  static getSection<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.getSetting(key);
  }
}

// Initialize settings when module loads
if (typeof window !== "undefined") {
  SettingsManager.initialize();
}
