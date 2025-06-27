import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Target,
  Clock,
  Brain,
  Zap,
  Trophy,
  Coffee,
  CheckCircle,
  SkipForward,
  RotateCcw,
  Maximize,
  Minimize,
} from "lucide-react";
import { PersistentStats } from "@/lib/persistent-stats";
import { SettingsManager } from "@/lib/settings-manager";
import { realGoogleIntegration } from "@/lib/real-google-integration";
import { aiService } from "@/lib/ai-service";
import { notificationService } from "@/lib/notification-service";
import { toast } from "sonner";

interface FocusSession {
  id: string;
  task: string;
  duration: number; // in minutes
  startTime?: Date;
  endTime?: Date;
  completed: boolean;
  productivity?: number;
}

const FocusMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State management
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [currentTask, setCurrentTask] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [breakTime, setBreakTime] = useState(false);

  // AI Coaching states
  const [aiCoaching, setAiCoaching] = useState(true);
  const [lastAiTip, setLastAiTip] = useState("");
  const [aiMotivation, setAiMotivation] = useState([
    "🎯 Je bent gefocust! Blijf doorgaan met deze geweldige flow.",
    "💪 Geweldig! Je bent al halverwege je sessie. Keep it up!",
    "🔥 Laatste sprint! Je doet het fantastisch. Nog even volhouden!",
    "✨ Bijna klaar! Je productiviteit is door het dak aan het gaan!",
  ]);

  // Custom duration state
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = SettingsManager.getSettings();
    setSoundEnabled(settings.sounds);
    setSelectedDuration(settings.focusSettings.defaultDuration);
    setTimeLeft(settings.focusSettings.defaultDuration * 60);
    setAiCoaching(settings.enableAiCoach);

    // Check for suggested task from AI or location state
    const suggestedTask =
      localStorage.getItem("suggestedTask") ||
      location.state?.task ||
      location.state?.block?.task;
    const suggestedDuration =
      localStorage.getItem("suggestedDuration") ||
      location.state?.duration ||
      location.state?.block?.duration;

    if (suggestedTask) {
      setCurrentTask(suggestedTask);
      localStorage.removeItem("suggestedTask");
    }

    if (suggestedDuration) {
      const duration = parseInt(suggestedDuration);
      setSelectedDuration(duration);
      setTimeLeft(duration * 60);
      localStorage.removeItem("suggestedDuration");
    }

    // Get session count for the day
    if (user?.id) {
      const stats = PersistentStats.getTodaysStats();
      setSessionCount(stats.sessionsCompleted);
    }
  }, [location, user]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleSessionComplete();
            return 0;
          }

          // AI coaching at certain intervals
          if (aiCoaching && time % 300 === 0) {
            // Every 5 minutes
            showAiMotivation();
          }

          // Milestone celebrations
          const progress =
            ((selectedDuration * 60 - time) / (selectedDuration * 60)) * 100;
          if (
            Math.floor(progress) === 25 ||
            Math.floor(progress) === 50 ||
            Math.floor(progress) === 75
          ) {
            showMilestoneMotivation(Math.floor(progress));
          }

          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, selectedDuration, aiCoaching]);

  // Session management
  const startSession = useCallback(async () => {
    if (!currentTask.trim()) {
      toast.error("Voer een taak in om te beginnen!");
      return;
    }

    if (!user?.id) {
      toast.error("Je moet ingelogd zijn om focus sessies te starten.");
      return;
    }

    setIsActive(true);
    setSessionStarted(true);
    setIsPaused(false);

    // Start tracking in persistent stats
    PersistentStats.startFocusSession(user.id, currentTask, selectedDuration);

    // Play start sound
    if (soundEnabled) {
      playSound("start");
    }

    // Create Google Calendar event if connected
    if (realGoogleIntegration.isConnected()) {
      try {
        await realGoogleIntegration.createFocusSession(
          currentTask,
          selectedDuration,
        );
        toast.success("Focus sessie toegevoegd aan je Google Calendar! 📅");
      } catch (error) {
        console.error("Failed to create calendar event:", error);
      }
    }

    // AI coaching start message
    if (aiCoaching) {
      setTimeout(() => {
        const tips = [
          `🎯 Perfecte keuze! "${currentTask}" verdient je volledige aandacht. Laten we dit samen doen!`,
          `💪 ${selectedDuration} minuten pure focus op "${currentTask}". Je hebt dit onder controle!`,
          `🚀 Klaar voor take-off! Focus op "${currentTask}" en laat je productiviteit de lucht in schieten!`,
        ];
        showAiTip(tips[Math.floor(Math.random() * tips.length)]);
      }, 2000);
    }

    // Show focus notification
    notificationService.showNotification({
      title: "🎯 Focus Sessie Gestart!",
      message: `Je werkt nu ${selectedDuration} minuten aan: ${currentTask}`,
      type: "success",
      psychology: "progress",
    });

    toast.success(`Focus sessie gestart voor ${selectedDuration} minuten! 🎯`);
  }, [currentTask, selectedDuration, soundEnabled, user, aiCoaching]);

  const pauseSession = () => {
    setIsPaused(!isPaused);
    if (soundEnabled) {
      playSound(isPaused ? "resume" : "pause");
    }

    toast.info(isPaused ? "Sessie hervat! 🔄" : "Sessie gepauzeerd ⏸️");
  };

  const stopSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setSessionStarted(false);

    if (soundEnabled) {
      playSound("stop");
    }

    // Don't record as completed if stopped early
    if (user?.id) {
      const completionRate =
        ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

      // Update daily stats with partial completion
      const todayStats = PersistentStats.getTodaysStats();
      const updatedStats = {
        ...todayStats,
        totalFocusTime:
          todayStats.totalFocusTime +
          Math.round((selectedDuration * 60 - timeLeft) / 60),
        productivity: Math.max(completionRate, todayStats.productivity),
      };

      // Store updated stats
      const dateKey = new Date().toISOString().split("T")[0];
      localStorage.setItem(
        `focus_stats_daily_${user.id}_${dateKey}`,
        JSON.stringify(updatedStats),
      );
    }

    toast.warning(
      "Sessie gestopt. Probeer volgende keer langer vol te houden! 💪",
    );
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    setSessionStarted(false);
    setSessionCount((prev) => prev + 1);

    if (soundEnabled) {
      playSound("complete");
    }

    // Record completion in persistent stats
    if (user?.id) {
      PersistentStats.completeFocusSession(
        user.id,
        currentTask,
        selectedDuration,
        100,
      );

      // Generate AI insight after session
      if (aiCoaching) {
        setTimeout(() => {
          aiService.generateInsights(user.id).then((insights) => {
            if (insights.length > 0) {
              const completionInsight = insights.find(
                (i) => i.type === "achievement",
              );
              if (completionInsight) {
                showAiTip(completionInsight.message);
              }
            }
          });
        }, 3000);
      }
    }

    // Show completion notification with actions
    notificationService.showNotification({
      title: "🏆 Focus Sessie Voltooid!",
      message: `Gefeliciteerd! Je hebt ${selectedDuration} minuten productief gewerkt aan "${currentTask}".`,
      type: "success",
      psychology: "achievement",
      actions: [
        {
          label: "Start Pauze",
          action: () => navigate("/pause"),
          primary: true,
        },
        {
          label: "Nieuwe Sessie",
          action: () => {
            resetSession();
            setCurrentTask("");
          },
        },
      ],
    });

    // Achievement notification
    notificationService.showAchievement(
      "Focus Master!",
      `Je hebt je ${sessionCount + 1}e focus sessie van vandaag voltooid. Geweldig gedaan! 🎯`,
    );

    toast.success("🏆 Gefeliciteerd! Sessie succesvol voltooid!");

    // Auto-suggest break after 3 seconds
    setTimeout(() => {
      if (SettingsManager.getSettings().productivity.autoStartBreaks) {
        navigate("/pause");
      }
    }, 3000);
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setSessionStarted(false);
    setTimeLeft(selectedDuration * 60);
    setMotivation("");
    setLastAiTip("");
  };

  const handleDurationChange = (value: string) => {
    if (value === "custom") {
      setSelectedDuration(customDuration || 25);
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 100);
    } else {
      const duration = parseInt(value);
      setSelectedDuration(duration);
      setCustomDuration(null);
      if (!sessionStarted) {
        setTimeLeft(duration * 60);
      }
    }
  };

  // AI Coaching functions
  const showAiMotivation = () => {
    const progress =
      ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;
    let motivationIndex = 0;

    if (progress >= 75) motivationIndex = 3;
    else if (progress >= 50) motivationIndex = 2;
    else if (progress >= 25) motivationIndex = 1;

    const message = aiMotivation[motivationIndex];
    showAiTip(message);
  };

  const showMilestoneMotivation = (percentage: number) => {
    const messages = {
      25: "🎯 Geweldig begin! Je bent al 25% - blijf gefocust!",
      50: "💪 Halfway there! Je doet het fantastisch!",
      75: "🔥 Laatste kwart! Je bent bijna klaar - vol gas!",
    };

    const message = messages[percentage as keyof typeof messages];
    if (message) {
      showAiTip(message);

      // Visual celebration
      const celebration = document.createElement("div");
      celebration.className =
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce z-50";
      celebration.textContent =
        percentage === 50 ? "🎉" : percentage === 75 ? "🚀" : "⭐";
      document.body.appendChild(celebration);

      setTimeout(() => {
        if (celebration.parentElement) {
          celebration.remove();
        }
      }, 2000);
    }
  };

  const showAiTip = (tip: string) => {
    setLastAiTip(tip);
    setMotivation(tip);

    // Clear motivation after 10 seconds
    setTimeout(() => {
      setMotivation("");
    }, 10000);
  };

  // Sound functions
  const playSound = (
    type: "start" | "pause" | "resume" | "stop" | "complete",
  ) => {
    if (!soundEnabled) return;

    // Create audio context for different sounds
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const volume = 0.5; // Default volume since soundVolume doesn't exist in settings
    gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);

    switch (type) {
      case "start":
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        break;
      case "complete":
        // Victory chord
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        setTimeout(
          () =>
            oscillator.frequency.setValueAtTime(
              659.25,
              audioContext.currentTime,
            ),
          200,
        );
        setTimeout(
          () =>
            oscillator.frequency.setValueAtTime(
              783.99,
              audioContext.currentTime,
            ),
          400,
        );
        break;
      case "pause":
        oscillator.frequency.setValueAtTime(392.0, audioContext.currentTime); // G4
        break;
      default:
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    }

    oscillator.type = "sine";
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Utility functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    return ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${isFullscreen ? "fixed inset-0 z-50 bg-gray-900" : ""}`}
    >
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                disabled={isActive}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Terug naar Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Focus Mode</h1>
                <p className="text-gray-600">
                  {sessionCount > 0
                    ? `${sessionCount} sessies voltooid vandaag`
                    : "Start je focus sessie"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                className={`${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
              >
                {isActive ? (isPaused ? "Gepauzeerd" : "Actief") : "Inactief"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`max-w-4xl mx-auto px-4 ${isFullscreen ? "h-full flex items-center justify-center" : "py-8"}`}
      >
        {!sessionStarted ? (
          /* Setup Screen */
          <div className="space-y-8">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <span>Start je Focus Sessie</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task" className="text-lg font-medium">
                      Waar ga je aan werken?
                    </Label>
                    <Input
                      id="task"
                      value={currentTask}
                      onChange={(e) => setCurrentTask(e.target.value)}
                      placeholder="Bijv. E-mails beantwoorden, Rapport schrijven, Coding..."
                      className="mt-2 text-lg p-4 h-14"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-medium">
                      Hoelang wil je focussen?
                    </Label>
                    <Select
                      value={selectedDuration.toString() === customDuration?.toString() ? "custom" : selectedDuration.toString()}
                      onValueChange={handleDurationChange}
                    >
                      <SelectTrigger className="mt-2 h-14 text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">
                          15 minuten (Short Sprint)
                        </SelectItem>
                        <SelectItem value="25">
                          25 minuten (Pomodoro)
                        </SelectItem>
                        <SelectItem value="30">
                          30 minuten (Medium Focus)
                        </SelectItem>
                        <SelectItem value="45">
                          45 minuten (Deep Work)
                        </SelectItem>
                        <SelectItem value="60">
                          60 minuten (Power Hour)
                        </SelectItem>
                        <SelectItem value="90">
                          90 minuten (Ultra Focus)
                        </SelectItem>
                        <SelectItem value="custom">
                          🎯 Custom (eigen tijd)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedDuration.toString() === customDuration?.toString() && (
                      <div className="mt-4">
                        <Label htmlFor="customTime" className="text-base font-medium">
                          Aantal minuten (5-180):
                        </Label>
                        <Input
                          id="customTime"
                          type="number"
                          min="5"
                          max="180"
                          placeholder="Bijv. 37"
                          className="mt-2 h-12 text-lg"
                          ref={customInputRef}
                          value={customDuration ?? ''}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value);
                            if (!isNaN(minutes) && minutes >= 5 && minutes <= 180) {
                              setCustomDuration(minutes);
                              setSelectedDuration(minutes);
                              setTimeLeft(minutes * 60);
                            } else {
                              setCustomDuration(null);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-sm">Geluiden inschakelen</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={aiCoaching}
                        onChange={(e) => setAiCoaching(e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-sm">AI Coaching</label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={startSession}
                  disabled={!currentTask.trim()}
                  className="w-full py-6 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600"
                  size="lg"
                >
                  <Play className="h-6 w-6 mr-3" />
                  Start Focus Sessie ({selectedDuration} min)
                </Button>
              </CardContent>
            </Card>

            {/* Quick start suggestions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Quick Start Suggesties</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { task: "E-mails afhandelen", duration: 25, icon: "📧" },
                    { task: "Rapport schrijven", duration: 45, icon: "📄" },
                    { task: "Planning maken", duration: 30, icon: "📋" },
                    { task: "Eigen tijd invoeren", duration: null, icon: "⌨️", custom: true },
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => {
                        setCurrentTask(suggestion.task);
                        if (suggestion.custom) {
                          setSelectedDuration(customDuration || 25);
                          setTimeout(() => {
                            customInputRef.current?.focus();
                          }, 100);
                        } else {
                          setSelectedDuration(suggestion.duration);
                          setCustomDuration(null);
                          setTimeLeft(suggestion.duration * 60);
                        }
                      }}
                      className="p-4 h-auto flex flex-col items-center space-y-2 hover:bg-blue-50"
                    >
                      <span className="text-2xl">{suggestion.icon}</span>
                      <span className="font-medium">{suggestion.task}</span>
                      {suggestion.custom ? (
                        <span className="text-sm text-gray-500">Custom tijd</span>
                      ) : (
                        <span className="text-sm text-gray-500">{suggestion.duration} min</span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Active Session Screen */
          <div className={`space-y-8 ${isFullscreen ? "text-center" : ""}`}>
            <Card
              className={`shadow-2xl border-0 ${isFullscreen ? "bg-gray-800 text-white" : ""}`}
            >
              <CardHeader className="text-center pb-4">
                <CardTitle
                  className={`text-2xl font-bold ${isFullscreen ? "text-white" : "text-gray-900"}`}
                >
                  {currentTask}
                </CardTitle>
                <div className="flex items-center justify-center space-x-4 mt-2">
                  <Badge
                    className={`${isActive && !isPaused ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {isActive && !isPaused
                      ? "Actief"
                      : isPaused
                        ? "Gepauzeerd"
                        : "Gestopt"}
                  </Badge>
                  <Badge variant="outline">Sessie #{sessionCount + 1}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Timer Display */}
                <div className="text-center">
                  <div
                    className={`text-8xl font-bold mb-4 ${isFullscreen ? "text-white" : "text-gray-900"} ${isPaused ? "opacity-50" : ""}`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                  <Progress
                    value={getProgressPercentage()}
                    className={`h-4 mb-4 ${isFullscreen ? "bg-gray-700" : ""}`}
                  />
                  <p
                    className={`text-lg ${isFullscreen ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {Math.round(getProgressPercentage())}% voltooid
                  </p>
                </div>

                {/* AI Motivation */}
                {motivation && aiCoaching && (
                  <Card
                    className={`${isFullscreen ? "bg-gray-700 border-gray-600" : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"} animate-pulse`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Brain
                          className={`h-6 w-6 ${isFullscreen ? "text-purple-400" : "text-purple-600"}`}
                        />
                        <p
                          className={`font-medium ${isFullscreen ? "text-white" : "text-purple-900"}`}
                        >
                          {motivation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Controls */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={pauseSession}
                    disabled={!isActive}
                    size="lg"
                    variant={isPaused ? "default" : "outline"}
                    className="w-32"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Hervatten
                      </>
                    ) : (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Pauzeren
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={stopSession}
                    disabled={!isActive}
                    size="lg"
                    variant="destructive"
                    className="w-32"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stoppen
                  </Button>

                  <Button onClick={toggleFullscreen} size="lg" variant="ghost">
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {/* Session Info */}
                {!isFullscreen && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">
                        Geplande Tijd
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedDuration} min
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">
                        Voltooiing
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {Math.round(getProgressPercentage())}%
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Trophy className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-900">
                        Vandaag
                      </p>
                      <p className="text-lg font-bold text-purple-600">
                        {sessionCount} sessies
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusMode;
