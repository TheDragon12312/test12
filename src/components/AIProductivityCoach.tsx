
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  Zap,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Trophy,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Settings,
  Calendar,
  BarChart3,
  Plane as Planning,
} from "lucide-react";
import { aiService, AIInsight, ProductivityAnalysis } from "@/lib/ai-service";
import { SettingsManager } from "@/lib/settings-manager";
import { PersistentStats } from "@/lib/persistent-stats";
import { notificationService } from "@/lib/notification-service";

interface CoachState {
  isMinimized: boolean;
  currentInsight: AIInsight | null;
  currentInsightIndex: number;
  insights: AIInsight[];
  analysis: ProductivityAnalysis | null;
  lastUpdate: Date;
}

const AIProductivityCoach = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coachState, setCoachState] = useState<CoachState>({
    isMinimized: false,
    currentInsight: null,
    currentInsightIndex: 0,
    insights: [],
    analysis: null,
    lastUpdate: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Load existing data
    loadData();

    // Auto-refresh insights every 30 minutes
    const interval = setInterval(generateInsights, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      const storedInsights = aiService.getInsights();
      // Analysis will be generated on demand since there's no stored analysis method

      setCoachState((prev) => ({
        ...prev,
        insights: storedInsights,
        analysis: null, // Analysis will be generated when needed
        currentInsight: storedInsights.length > 0 ? storedInsights[0] : null,
        currentInsightIndex: 0,
      }));

      // Generate new insights if none exist or if they're old
      if (
        storedInsights.length === 0 ||
        shouldRefreshInsights(storedInsights)
      ) {
        generateInsights();
      }
    } catch (error) {
      console.error("Load AI data error:", error);
    }
  };

  const shouldRefreshInsights = (insights: AIInsight[]): boolean => {
    if (insights.length === 0) return true;
    const latestInsight = insights[0];
    const hoursSinceUpdate =
      (Date.now() - new Date(latestInsight.timestamp).getTime()) /
      (1000 * 60 * 60);
    return hoursSinceUpdate > 2;
  };

  const generateInsights = async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      const aiCoachingEnabled = SettingsManager.getSetting("aiCoaching");
      if (!aiCoachingEnabled) return;

      // Get user stats for AI analysis
      const todayStats = PersistentStats.getTodaysStats();
      const userStats = {
        focusTime: todayStats.focusTime,
        sessionsCompleted: todayStats.sessionsCompleted,
        distractionsBlocked: todayStats.distractionsBlocked,
      };

      const [insights, analysis] = await Promise.all([
        aiService.generateInsights(userStats),
        aiService.analyzeProductivity(userStats),
      ]);

      setCoachState((prev) => ({
        ...prev,
        insights,
        analysis,
        currentInsight:
          insights.find((i) => i.priority === "high") || insights[0] || null,
        currentInsightIndex: 0,
        lastUpdate: new Date(),
      }));
    } catch (error) {
      console.error("Generate insights error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissInsight = () => {
    if (!user?.id || !coachState.currentInsight) return;

    aiService.markInsightAsRead(coachState.currentInsight.id);

    const remainingInsights = coachState.insights.filter(
      (insight) => insight.id !== coachState.currentInsight?.id,
    );

    setCoachState((prev) => ({
      ...prev,
      insights: remainingInsights,
      currentInsight: remainingInsights[0] || null,
      currentInsightIndex: 0,
    }));
  };

  const navigateInsight = (direction: "prev" | "next") => {
    if (coachState.insights.length === 0) return;

    let newIndex = coachState.currentInsightIndex;

    if (direction === "next") {
      newIndex = (newIndex + 1) % coachState.insights.length;
    } else {
      newIndex = newIndex === 0 ? coachState.insights.length - 1 : newIndex - 1;
    }

    setCoachState((prev) => ({
      ...prev,
      currentInsightIndex: newIndex,
      currentInsight: prev.insights[newIndex] || null,
    }));
  };

  const toggleMinimize = () => {
    setCoachState((prev) => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  };

  const handleAction = async () => {
    if (!coachState.currentInsight?.action) return;

    const action = coachState.currentInsight.action.toLowerCase();

    console.log("🤖 AI Action triggered:", action);

    try {
      // Parse different action types and navigate accordingly
      if (
        action.includes("activeer focus") ||
        action.includes("start focus") ||
        action.includes("focus sessie") ||
        action.includes("continue streak")
      ) {
        // Navigate to focus mode with suggested task
        const taskMatch = coachState.currentInsight.message.match(
          /(?:voor|aan):\s*([^.!?]+)/i,
        );
        const task = taskMatch ? taskMatch[1].trim() : "Productieve taak";

        // Store task suggestion for FocusMode
        localStorage.setItem("suggestedTask", task);
        localStorage.setItem("suggestedDuration", "25");

        console.log("🎯 Navigating to focus mode with task:", task);
        navigate("/focus");
      } else if (
        action.includes("pauze") ||
        action.includes("break") ||
        action.includes("rust") ||
        action.includes("take") && action.includes("break")
      ) {
        console.log("☕ Navigating to pause mode");
        navigate("/pause");
      } else if (
        action.includes("instellingen") ||
        action.includes("settings") ||
        action.includes("configureer") ||
        action.includes("enable blocking")
      ) {
        console.log("⚙️ Navigating to settings");
        navigate("/settings");
      } else if (
        action.includes("statistieken") ||
        action.includes("analytics") ||
        action.includes("view stats") ||
        (action.includes("bekijk") && action.includes("data"))
      ) {
        console.log("📊 Navigating to statistics");
        navigate("/statistics");
      } else if (
        action.includes("calendar") ||
        action.includes("agenda") ||
        action.includes("planning")
      ) {
        if (action.includes("planning") || action.includes("plan")) {
          console.log("📋 Navigating to planning");
          navigate("/planning");
        } else {
          console.log("📅 Navigating to calendar");
          navigate("/calendar");
        }
      } else if (action.includes("email") || action.includes("mail")) {
        console.log("📧 Navigating to email management");
        navigate("/email");
      } else if (action.includes("team") || action.includes("samenwerk")) {
        console.log("👥 Navigating to team collaboration");
        navigate("/team");
      } else if (action.includes("dashboard") || action.includes("overzicht")) {
        console.log("🏠 Navigating to dashboard");
        navigate("/dashboard");
      } else {
        // Generic action - show success message
        console.log("✅ Generic AI action executed:", action);

        // Show success notification
        notificationService.showNotification({
          title: "🤖 AI Actie Uitgevoerd",
          message: `"${coachState.currentInsight.action}" is succesvol uitgevoerd!`,
          type: "success",
          psychology: "achievement",
        });

        // Create visual feedback
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-100 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300";
        notification.innerHTML = `
          <div class="flex items-start space-x-3">
            <div class="text-green-600">🤖</div>
            <div>
              <h4 class="font-medium text-green-900">AI Actie Voltooid!</h4>
              <p class="text-sm text-green-700 mt-1">${coachState.currentInsight.action}</p>
              <button onclick="this.closest('.fixed').remove()" class="text-xs text-green-600 mt-2 underline">Sluiten</button>
            </div>
          </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
          notification.classList.remove("translate-x-full");
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
          notification.classList.add("translate-x-full");
          setTimeout(() => {
            if (notification.parentElement) {
              notification.remove();
            }
          }, 300);
        }, 5000);
      }

      // Mark insight as acted upon
      dismissInsight();
    } catch (error) {
      console.error("❌ Error executing AI action:", error);

      // Show error notification
      notificationService.showNotification({
        title: "⚠️ Actie Mislukt",
        message:
          "Er ging iets mis bij het uitvoeren van de AI actie. Probeer het opnieuw.",
        type: "error",
      });
    }
  };

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "achievement":
        return <Trophy className="h-4 w-4" />;
      case "tip":
        return <Lightbulb className="h-4 w-4" />;
      case "suggestion":
        return <Target className="h-4 w-4" />;
      case "motivation":
        return <Zap className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "achievement":
        return "text-green-600 bg-green-50 border-green-200";
      case "tip":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "suggestion":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "motivation":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: AIInsight["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Don't render if AI is disabled
  const aiCoachingEnabled = SettingsManager.getSetting("aiCoaching");
  if (!aiCoachingEnabled || !user) return null;

  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        coachState.isMinimized ? "w-16 h-16" : "w-80 max-h-96"
      } shadow-xl border-l-4 border-l-blue-500 bg-white`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/ai-coach-avatar.png" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                <Brain className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            {!coachState.isMinimized && (
              <div>
                <CardTitle className="text-sm font-medium">AI Coach</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {coachState.analysis?.productivity_score
                    ? `Productiviteit: ${Math.round(coachState.analysis.productivity_score)}%`
                    : "Analyseren..."}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {!coachState.isMinimized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateInsights}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Vernieuw insights"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
              className="h-6 w-6 p-0"
              title={coachState.isMinimized ? "Uitklappen" : "Inklappen"}
            >
              {coachState.isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!coachState.isMinimized && (
        <CardContent className="pt-0">
          {coachState.currentInsight ? (
            <div className="space-y-3">
              {/* Current Insight */}
              <div
                className={`p-3 rounded-lg border ${getInsightColor(coachState.currentInsight.type)}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(coachState.currentInsight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">
                          {coachState.currentInsight.title}
                        </h4>
                        {coachState.insights.length > 1 && (
                          <Badge variant="outline" className="text-xs px-1 h-5">
                            {coachState.currentInsightIndex + 1}/
                            {coachState.insights.length}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${getPriorityColor(coachState.currentInsight.priority)}`}
                        />
                        {coachState.insights.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateInsight("prev")}
                              className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                              title="Vorige insight"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateInsight("next")}
                              className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                              title="Volgende insight"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={dismissInsight}
                          className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                          title="Verwijderen"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                      {coachState.currentInsight.message}
                    </p>
                    {coachState.currentInsight.actionable &&
                      coachState.currentInsight.action && (
                        <Button
                          size="sm"
                          onClick={handleAction}
                          className="text-xs h-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                          title={`Klik om actie uit te voeren: ${coachState.currentInsight.action}`}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {coachState.currentInsight.action}
                        </Button>
                      )}
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              {coachState.analysis && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Focus Kwaliteit:</span>
                    <Badge
                      variant={
                        coachState.analysis.focus_quality === "excellent"
                          ? "default"
                          : coachState.analysis.focus_quality === "good"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {coachState.analysis.focus_quality === "excellent"
                        ? "Uitstekend"
                        : coachState.analysis.focus_quality === "good"
                          ? "Goed"
                          : coachState.analysis.focus_quality === "average"
                            ? "Gemiddeld"
                            : "Slecht"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Productiviteit</span>
                      <span>
                        {Math.round(coachState.analysis.productivity_score)}%
                      </span>
                    </div>
                    <Progress
                      value={coachState.analysis.productivity_score}
                      className="h-1"
                    />
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">
                    {coachState.insights.length}
                  </div>
                  <div className="text-gray-500">Insights</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">
                    {coachState.analysis?.stress_level === "low"
                      ? "Laag"
                      : coachState.analysis?.stress_level === "medium"
                        ? "Gemiddeld"
                        : "Hoog"}
                  </div>
                  <div className="text-gray-500">Stress</div>
                </div>
              </div>

              {/* Break Suggestion */}
              {coachState.analysis?.energy_level === "low" && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <Coffee className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-700">
                    Tijd voor een pauze? Je energie is laag.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/pause")}
                    className="text-xs h-5 px-2 ml-auto"
                  >
                    Pauze
                  </Button>
                </div>
              )}

              {/* Last Update */}
              <div className="text-xs text-gray-400 text-center">
                Laatste update:{" "}
                {coachState.lastUpdate.toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Brain className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">
                {isLoading ? "Analyseren..." : "Geen nieuwe insights"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsights}
                disabled={isLoading}
                className="text-xs"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Vernieuwen
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AIProductivityCoach;
