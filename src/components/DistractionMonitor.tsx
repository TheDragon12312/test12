import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Eye, Clock, Globe } from "lucide-react";
import { distractionDetector } from "@/lib/distraction-detector";

interface DistractionAlert {
  id: string;
  type: "tab_switch" | "window_blur" | "idle_time" | "suspicious_url";
  details: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

const DistractionMonitor = () => {
  const { user } = useAuth();
  const [currentDistraction, setCurrentDistraction] =
    useState<DistractionAlert | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!user) {
      distractionDetector.stopMonitoring();
      return;
    }

    // Start echte afleidingsdetectie
    distractionDetector.loadSettings(user.id);
    distractionDetector.startMonitoring(user.id);
    setIsMonitoring(true);

    // Set callback voor afleidingen - alleen de gele notification van distraction-detector.ts wordt gebruikt
    distractionDetector.onDistraction((event) => {
      // Toon alleen medium en high severity afleidingen
      if (event.severity !== "low") {
        setCurrentDistraction(event);
      }

      // Update count
      setTodayCount(distractionDetector.getTodaysDistractions().length);
    });

    // Initial count
    setTodayCount(distractionDetector.getTodaysDistractions().length);

    return () => {
      distractionDetector.stopMonitoring();
    };
  }, [user]);

  const getDistractionTitle = (type: DistractionAlert["type"]): string => {
    switch (type) {
      case "tab_switch":
        return "🔄 Te veel tab switches";
      case "window_blur":
        return "👁️ Focus verloren";
      case "idle_time":
        return "⏰ Lange inactiviteit";
      case "suspicious_url":
        return "🚨 Afleidende website";
      default:
        return "⚠️ Afleiding gedetecteerd";
    }
  };

  const getDistractionIcon = (type: DistractionAlert["type"]) => {
    switch (type) {
      case "tab_switch":
        return <Eye className="h-5 w-5 text-orange-600 mt-0.5" />;
      case "window_blur":
        return <Eye className="h-5 w-5 text-orange-600 mt-0.5" />;
      case "idle_time":
        return <Clock className="h-5 w-5 text-orange-600 mt-0.5" />;
      case "suspicious_url":
        return <Globe className="h-5 w-5 text-orange-600 mt-0.5" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />;
    }
  };

  const dismissDistraction = () => {
    setCurrentDistraction(null);
  };

  const refocusNow = () => {
    setCurrentDistraction(null);
  };

  if (!currentDistraction) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card
        className={"shadow-lg border-orange-200 bg-orange-50"}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {getDistractionIcon(currentDistraction.type)}
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                {getDistractionTitle(currentDistraction.type)}
              </h3>
              <p className="text-sm mt-1 text-orange-700">
                {currentDistraction.details}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Vandaag: {todayCount} afleidingen gedetecteerd
              </p>
              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  onClick={refocusNow}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Terug focussen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={dismissDistraction}
                >
                  Sluiten
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={dismissDistraction}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistractionMonitor;
