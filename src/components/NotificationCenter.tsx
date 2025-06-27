
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  Trophy,
  Clock,
  Target,
  Lightbulb,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  notificationService,
  AppNotification,
} from "@/lib/notification-service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(() =>
    notificationService.getSettings(),
  );

  useEffect(() => {
    if (!user?.id) return;

    // Load initial notifications
    const userNotifications = notificationService.getNotifications();
    setNotifications(userNotifications);

    // Note: Real app would poll or use WebSocket for updates
    // For now, we'll rely on local state updates
  }, [user?.id]);

  const unreadCount = notifications.filter(
    (n) => !n.read,
  ).length;
  const isNotificationsEnabled = notificationSettings.enabled;

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    // Update local state to mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    // Update local state to mark all as read
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Alle notificaties gelezen! ✅");
  };

  const handleRemoveNotification = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    // Update local state to remove the notification from UI
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
    setNotifications([]);
    toast.success("Alle notificaties verwijderd! 🗑️");
  };

  const handleToggleNotifications = (enabled: boolean) => {
    notificationService.updateSettings({ enabled });
    setNotificationSettings((prev) => ({ ...prev, enabled }));

    if (enabled) {
      toast.success("Notificaties ingeschakeld! 🔔");
      // Show welcome back notification
      setTimeout(() => {
        notificationService.showNotification({
          title: "Welkom terug! 👋",
          message:
            "Notificaties zijn weer ingeschakeld. Je mist geen belangrijke updates meer!",
          type: "success",
          psychology: "social",
        });
      }, 1000);
    } else {
      toast.info("Notificaties uitgeschakeld 🔕");
    }
  };

  const handleToggleBrowserNotifications = (enabled: boolean) => {
    const newSettings = {
      ...notificationSettings,
      browserNotifications: enabled,
    };
    notificationService.updateSettings(newSettings);
    setNotificationSettings(newSettings);

    if (enabled) {
      toast.success("Browser notificaties ingeschakeld! 🌐");
    } else {
      toast.success("Browser notificaties uitgeschakeld! 🔕");
    }
  };

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "success":
        return <Trophy className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "error":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (
    type: AppNotification["type"],
    read: boolean,
  ) => {
    const opacity = read ? "opacity-60" : "";
    switch (type) {
      case "success":
        return `bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${opacity}`;
      case "warning":
        return `bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 ${opacity}`;
      case "error":
        return `bg-gradient-to-r from-red-50 to-pink-50 border-red-200 ${opacity}`;
      default:
        return `bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${opacity}`;
    }
  };

  const handleNotificationAction = (actionFn: string) => {
    try {
      // Handle different action types
      switch (actionFn) {
        case "start_session":
          window.location.href = "/focus";
          break;
        case "start_break":
          console.log("Starting break...");
          break;
        case "view_stats":
          window.location.href = "/statistics";
          break;
        default:
          console.log("Unknown action:", actionFn);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Notification action error:", error);
      toast.error("Er ging iets mis bij het uitvoeren van de actie");
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Nu";
    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffHours < 24) return `${diffHours}u geleden`;
    if (diffDays < 7) return `${diffDays}d geleden`;

    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Use all notifications for display
  const displayNotifications = notifications;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative transition-all duration-200 ${
            isNotificationsEnabled
              ? "hover:bg-blue-50 hover:text-blue-700"
              : "opacity-50 hover:bg-gray-100"
          }`}
        >
          {isNotificationsEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {unreadCount > 0 && isNotificationsEnabled && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                {isNotificationsEnabled ? (
                  <Bell className="h-5 w-5 text-blue-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-gray-500" />
                )}
                <span>Notificaties</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && isNotificationsEnabled && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    {unreadCount} nieuw
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0 || !isNotificationsEnabled}
                  className="h-6 px-2 text-xs hover:bg-blue-100"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Alle lezen
                </Button>
              </div>
            </div>

            {/* Notification Controls */}
            <div className="space-y-3 pt-3 border-t border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isNotificationsEnabled ? (
                    <Bell className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    Notificaties {isNotificationsEnabled ? "aan" : "uit"}
                  </span>
                </div>
                <Switch
                  checked={isNotificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              {isNotificationsEnabled && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {notificationSettings.browserNotifications ? (
                      <Volume2 className="h-4 w-4 text-blue-600" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm">Browser meldingen</span>
                  </div>
                  <Switch
                    checked={notificationSettings.browserNotifications}
                    onCheckedChange={handleToggleBrowserNotifications}
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!isNotificationsEnabled ? (
              <div className="p-8 text-center text-gray-500">
                <BellOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  Notificaties uitgeschakeld
                </p>
                <p className="text-sm text-gray-400">
                  Schakel notificaties in om updates te ontvangen
                </p>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Geen notificaties</p>
                <p className="text-sm text-gray-400">
                  Je ontvangt hier updates over je productiviteit
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    notificationService.showNotification({
                      title: "Test Notificatie 🎉",
                      message:
                        "Dit is een test om te controleren of alles werkt!",
                      type: "success",
                      psychology: "achievement",
                    });
                  }}
                  className="mt-4"
                >
                  Test Notificatie
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-1 p-2">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        notification.read
                          ? getNotificationBgColor(notification.type, true)
                          : `${getNotificationBgColor(notification.type, false)} shadow-sm ring-1 ring-blue-200`
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-700 mt-1 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:bg-green-100"
                                  title="Markeer als gelezen"
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveNotification(notification.id)
                                }
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:text-red-600 hover:bg-red-100"
                                title="Verwijderen"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {notification.actions &&
                            notification.actions.length > 0 && (
                              <div className="flex space-x-2 mt-3">
                                {notification.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant={
                                      action.style === "primary" ? "default" : "outline"
                                    }
                                    onClick={() =>
                                      handleNotificationAction(action.action)
                                    }
                                    className={`h-7 text-xs transition-all duration-200 ${
                                      action.style === "primary"
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {displayNotifications.length > 0 && isNotificationsEnabled && (
              <>
                <Separator />
                <div className="p-3 flex items-center justify-between bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Alles wissen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = "/settings?tab=notifications";
                    }}
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Instellingen
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
