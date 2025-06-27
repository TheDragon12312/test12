export interface DailyStats {
  date: string;
  focusTime: number; // in minutes
  sessionsCompleted: number;
  productivity: number; // percentage
  distractionsBlocked: number;
  tasksCompleted: number;
}

export interface WeeklyStats {
  week: string;
  totalFocusTime: number;
  averageProductivity: number;
  totalSessions: number;
  totalDistractionsBlocked: number;
  totalTasksCompleted: number;
}

export class PersistentStats {
  private static readonly STORAGE_KEY = "focusflow_stats";

  // Get today's stats
  static getTodaysStats(): DailyStats {
    const today = new Date().toISOString().split("T")[0];
    const allStats = this.getAllStats();

    const todayStats = allStats.find((stat) => stat.date === today);
    if (todayStats) {
      return todayStats;
    }

    // Create new stats for today
    const newStats: DailyStats = {
      date: today,
      focusTime: 0,
      sessionsCompleted: 0,
      productivity: 0,
      distractionsBlocked: 0,
      tasksCompleted: 0,
    };

    allStats.push(newStats);
    this.saveAllStats(allStats);
    return newStats;
  }

  // Get all daily stats
  static getAllStats(): DailyStats[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Save all stats
  private static saveAllStats(stats: DailyStats[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to save stats:", error);
    }
  }

  // Update today's stats
  static updateTodaysStats(updates: Partial<DailyStats>): void {
    const allStats = this.getAllStats();
    const today = new Date().toISOString().split("T")[0];

    const todayIndex = allStats.findIndex((stat) => stat.date === today);
    if (todayIndex >= 0) {
      allStats[todayIndex] = { ...allStats[todayIndex], ...updates };
    } else {
      allStats.push({
        date: today,
        focusTime: 0,
        sessionsCompleted: 0,
        productivity: 0,
        distractionsBlocked: 0,
        tasksCompleted: 0,
        ...updates,
      });
    }

    this.saveAllStats(allStats);
  }

  // Start focus session
  static startFocusSession(): void {
    console.log("Focus session started");
    // In a real app, this would track session start time
  }

  // Complete focus session
  static completeFocusSession(duration: number): void {
    const todayStats = this.getTodaysStats();

    this.updateTodaysStats({
      focusTime: todayStats.focusTime + duration,
      sessionsCompleted: todayStats.sessionsCompleted + 1,
      productivity: Math.min(100, todayStats.productivity + 5), // Increase productivity
    });
  }

  // Add blocked distraction
  static addBlockedDistraction(): void {
    const todayStats = this.getTodaysStats();

    this.updateTodaysStats({
      distractionsBlocked: todayStats.distractionsBlocked + 1,
    });
  }

  // Complete task
  static completeTask(): void {
    const todayStats = this.getTodaysStats();

    this.updateTodaysStats({
      tasksCompleted: todayStats.tasksCompleted + 1,
    });
  }

  // Get weekly stats
  static getWeeklyStats(): WeeklyStats[] {
    const allStats = this.getAllStats();
    const weeklyStats: WeeklyStats[] = [];

    // Group stats by week
    const weekGroups: { [key: string]: DailyStats[] } = {};

    allStats.forEach((stat) => {
      const date = new Date(stat.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      weekGroups[weekKey].push(stat);
    });

    // Calculate weekly totals
    Object.entries(weekGroups).forEach(([weekKey, stats]) => {
      const totalFocusTime = stats.reduce(
        (sum, stat) => sum + stat.focusTime,
        0,
      );
      const totalSessions = stats.reduce(
        (sum, stat) => sum + stat.sessionsCompleted,
        0,
      );
      const averageProductivity =
        stats.reduce((sum, stat) => sum + stat.productivity, 0) / stats.length;
      const totalDistractionsBlocked = stats.reduce(
        (sum, stat) => sum + stat.distractionsBlocked,
        0,
      );
      const totalTasksCompleted = stats.reduce(
        (sum, stat) => sum + stat.tasksCompleted,
        0,
      );

      weeklyStats.push({
        week: weekKey,
        totalFocusTime,
        averageProductivity: Math.round(averageProductivity),
        totalSessions,
        totalDistractionsBlocked,
        totalTasksCompleted,
      });
    });

    return weeklyStats.sort((a, b) => b.week.localeCompare(a.week));
  }

  // Reset all stats
  static resetAllStats(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
