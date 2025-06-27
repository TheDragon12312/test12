import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Clock,
  Users,
  Zap,
  Download,
  Upload,
  Eye,
  X,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { realGoogleIntegration } from "@/lib/real-google-integration";
import { realMicrosoftIntegration } from "@/lib/real-microsoft-integration";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
}

const CalendarIntegration = () => {
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendars, setCalendars] = useState<
    Array<{ id: string; name: string; primary?: boolean }>
  >([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncSettings, setSyncSettings] = useState({
    enabled: false,
    autoSync: false,
    syncFrequency: "hourly" as "realtime" | "hourly" | "daily",
    calendarsToSync: ["primary"],
    createFocusBlocks: true,
    blockMeetingTime: true,
    bufferTime: 15,
    provider: "google" as "google" | "microsoft",
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if any provider is connected
    const googleConnected = realGoogleIntegration.isConnected();
    const microsoftConnected = realMicrosoftIntegration.isConnected();

    setIsConnected(googleConnected || microsoftConnected);

    if (googleConnected) {
      setSyncSettings((prev) => ({ ...prev, provider: "google" }));
      loadCalendars();
      loadEvents();
    } else if (microsoftConnected) {
      setSyncSettings((prev) => ({ ...prev, provider: "microsoft" }));
      loadCalendars();
      loadEvents();
    }
  }, [user, navigate]);

  const handleConnectProvider = async (provider: "google" | "microsoft") => {
    setIsConnecting(true);
    try {
      if (provider === "google") {
        await loginWithGoogle();
        // No further code here, as the user will be redirected
        return;
      } else {
        const success = await realMicrosoftIntegration.connect();
        if (success) {
          setIsConnected(true);
          setSyncSettings((prev) => ({ ...prev, provider }));
          toast({
            title: "Microsoft Account Gekoppeld! 🎉",
            description: `Je kunt nu je Outlook Calendar synchroniseren.`,
          });
          await loadCalendars();
          await loadEvents();
        } else {
          toast({
            title: "Koppeling Mislukt",
            description: `Er ging iets mis bij het koppelen van je Microsoft account.`,
            variant: "destructive",
          });
        }
        setIsConnecting(false);
      }
    } catch (error: any) {
      toast({
        title: "Fout bij Koppelen",
        description:
          error.message ||
          `Kon geen verbinding maken met ${provider}. Probeer het opnieuw.`,
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectProvider = () => {
    if (syncSettings.provider === "google") {
      realGoogleIntegration.disconnect();
    } else {
      realMicrosoftIntegration.disconnect();
    }

    setIsConnected(false);
    setCalendars([]);
    setEvents([]);

    toast({
      title: `${syncSettings.provider === "google" ? "Google" : "Microsoft"} Account Ontkoppeld`,
      description: "Je calendar is niet meer gesynchroniseerd.",
    });
  };

  const loadCalendars = async () => {
    try {
      let userCalendars: any[] = [];

      if (syncSettings.provider === "google") {
        const googleCalendars = await realGoogleIntegration.getCalendars();
        userCalendars = googleCalendars.map((cal) => ({
          id: cal.id,
          name: cal.summary,
          color: "#4285f4",
          type: "google",
        }));
      } else {
        const microsoftCalendars =
          await realMicrosoftIntegration.getCalendars();
        userCalendars = microsoftCalendars.map((cal) => ({
          id: cal.id,
          name: cal.name,
          color: "#0078d4",
          type: "microsoft",
        }));
      }

      setCalendars(userCalendars);
    } catch (error) {
      console.error("Failed to load calendars:", error);
      toast({
        title: "Fout bij laden calendars",
        description: "Kon calendars niet ophalen. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const loadEvents = async () => {
    try {
      let calendarEvents: any[] = [];

      if (syncSettings.provider === "google") {
        const googleEvents = await realGoogleIntegration.getEvents();
        calendarEvents = googleEvents.map((event) => ({
          id: event.id,
          title: event.summary,
          start: event.start.dateTime,
          type: "google",
        }));
      } else {
        const microsoftEvents = await realMicrosoftIntegration.getEvents();
        calendarEvents = microsoftEvents.map((event) => ({
          id: event.id,
          summary: event.subject,
          start: { dateTime: event.start.dateTime },
          end: { dateTime: event.end.dateTime },
          location: event.location?.displayName,
        }));
      }

      setEvents(calendarEvents);
      setLastSync(new Date());
    } catch (error) {
      console.error("Failed to load events:", error);
      toast({
        title: "Fout bij laden afspraken",
        description: "Kon afspraken niet ophalen. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);

    try {
      const syncedEvents = await GoogleIntegration.syncCalendarEvents();
      setEvents(syncedEvents);
      setLastSync(new Date());

      toast({
        title: "Synchronisatie Voltooid ✅",
        description: `${syncedEvents.length} evenementen gesynchroniseerd.`,
      });
    } catch (error) {
      toast({
        title: "Synchronisatie Mislukt",
        description: "Er ging iets mis bij het synchroniseren van je calendar.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSyncSettings = (key: string, value: any) => {
    const newSettings = { ...syncSettings, [key]: value };
    setSyncSettings(newSettings);
    GoogleIntegration.updateCalendarSyncSettings(newSettings);

    toast({
      title: "Instellingen Opgeslagen",
      description: "Je synchronisatie-instellingen zijn bijgewerkt.",
    });
  };

  const generateFocusBlocks = () => {
    const focusBlocks = GoogleIntegration.convertEventsToFocusBlocks(events);

    console.log("Generated focus blocks:", focusBlocks);

    toast({
      title: "Focus Blokken Gegenereerd! 🎯",
      description: `${focusBlocks.length} focus blokken aangemaakt op basis van je agenda.`,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Calendar Integratie
              </h1>
              <p className="text-gray-600">
                Synchroniseer je Google Calendar met FocusFlow
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected && (
              <Badge
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verbonden
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!isConnected ? (
          /* Connection Setup */
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Koppel je Calendar</CardTitle>
              <CardDescription className="text-lg">
                Kies Google Calendar of Microsoft Outlook om automatisch focus
                blokken te genereren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Automatische Sync</h3>
                  <p className="text-sm text-gray-600">
                    Je afspraken worden automatisch gesynchroniseerd
                  </p>
                </div>
                <div className="text-center p-4">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Smart Planning</h3>
                  <p className="text-sm text-gray-600">
                    Automatisch focus tijd rond meetings plannen
                  </p>
                </div>
                <div className="text-center p-4">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Buffer Tijd</h3>
                  <p className="text-sm text-gray-600">
                    Configureerbare buffer tijd voor en na afspraken
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Je Google Calendar data wordt alleen lokaal opgeslagen en
                  nooit gedeeld met derden.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleConnectProvider("google")}
                  disabled={isConnecting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 h-16"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Verbinden...
                    </>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Google Calendar</div>
                        <div className="text-sm opacity-80">
                          Gmail + Calendar
                        </div>
                      </div>
                    </div>
                  )}
                </Button>

                <Button
                  onClick={() => handleConnectProvider("microsoft")}
                  disabled={isConnecting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-800 to-indigo-800 hover:from-blue-900 hover:to-indigo-900 text-white px-8 h-16"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Verbinden...
                    </>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Microsoft Outlook</div>
                        <div className="text-sm opacity-80">
                          Outlook + Calendar
                        </div>
                      </div>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Connected State */
          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="events">Afspraken</TabsTrigger>
              <TabsTrigger value="settings">Instellingen</TabsTrigger>
              <TabsTrigger value="sync">Synchronisatie</TabsTrigger>
            </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Je Komende Afspraken
                  </h2>
                  <p className="text-gray-600">
                    {events.length} afspraken gevonden
                    {lastSync && (
                      <span className="ml-2">
                        • Laatste sync: {lastSync.toLocaleTimeString("nl-NL")}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={generateFocusBlocks} variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Genereer Focus Blokken
                  </Button>
                  <Button onClick={handleSyncNow} disabled={isSyncing}>
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    Sync Nu
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {events.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-600 mb-2">
                        Geen afspraken gevonden
                      </h3>
                      <p className="text-gray-500">
                        Je hebt geen komende afspraken in je Google Calendar.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => (
                    <Card
                      key={event.id}
                      className="border-0 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {event.summary}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {new Date(
                                  event.start.dateTime,
                                ).toLocaleDateString("nl-NL", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div>
                                {new Date(
                                  event.start.dateTime,
                                ).toLocaleTimeString("nl-NL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(
                                  event.end.dateTime,
                                ).toLocaleTimeString("nl-NL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {Math.round(
                              (new Date(event.end.dateTime).getTime() -
                                new Date(event.start.dateTime).getTime()) /
                                (1000 * 60),
                            )}
                            min
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Synchronisatie Instellingen</span>
                  </CardTitle>
                  <CardDescription>
                    Configureer hoe je Google Calendar wordt gesynchroniseerd
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Calendar Synchronisatie Inschakelen</Label>
                      <p className="text-sm text-gray-600">
                        Synchroniseer automatisch met je Google Calendar
                      </p>
                    </div>
                    <Switch
                      checked={syncSettings.enabled}
                      onCheckedChange={(checked) =>
                        updateSyncSettings("enabled", checked)
                      }
                    />
                  </div>

                  {syncSettings.enabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Automatische Synchronisatie</Label>
                          <p className="text-sm text-gray-600">
                            Sync op de achtergrond zonder handmatige actie
                          </p>
                        </div>
                        <Switch
                          checked={syncSettings.autoSync}
                          onCheckedChange={(checked) =>
                            updateSyncSettings("autoSync", checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Synchronisatie Frequentie</Label>
                        <Select
                          value={syncSettings.syncFrequency}
                          onValueChange={(value) =>
                            updateSyncSettings("syncFrequency", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">
                              ⚡ Real-time (elke 5 min)
                            </SelectItem>
                            <SelectItem value="hourly">⏰ Elk uur</SelectItem>
                            <SelectItem value="daily">📅 Dagelijks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Automatisch Focus Blokken Maken</Label>
                            <p className="text-sm text-gray-600">
                              Creëer focus tijd rond je afspraken
                            </p>
                          </div>
                          <Switch
                            checked={syncSettings.createFocusBlocks}
                            onCheckedChange={(checked) =>
                              updateSyncSettings("createFocusBlocks", checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Meeting Tijd Blokkeren</Label>
                            <p className="text-sm text-gray-600">
                              Voorkom focus sessies tijdens afspraken
                            </p>
                          </div>
                          <Switch
                            checked={syncSettings.blockMeetingTime}
                            onCheckedChange={(checked) =>
                              updateSyncSettings("blockMeetingTime", checked)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Buffer Tijd (minuten)</Label>
                          <p className="text-xs text-gray-500">
                            Tijd voor en na afspraken voor voorbereiding
                          </p>
                          <Slider
                            value={[syncSettings.bufferTime]}
                            onValueChange={(value) =>
                              updateSyncSettings("bufferTime", value[0])
                            }
                            max={30}
                            min={5}
                            step={5}
                          />
                          <div className="text-center text-sm text-gray-600">
                            {syncSettings.bufferTime} minuten
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calendars om te Synchroniseren</CardTitle>
                  <CardDescription>
                    Kies welke van je Google Calendars je wilt synchroniseren
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {calendars.map((calendar) => (
                      <div
                        key={calendar.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${calendar.primary ? "bg-blue-500" : "bg-gray-400"}`}
                          />
                          <div>
                            <p className="font-medium">{calendar.name}</p>
                            {calendar.primary && (
                              <Badge variant="outline" className="text-xs">
                                Primair
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={syncSettings.calendarsToSync.includes(
                            calendar.id,
                          )}
                          onCheckedChange={(checked) => {
                            const newCalendars = checked
                              ? [...syncSettings.calendarsToSync, calendar.id]
                              : syncSettings.calendarsToSync.filter(
                                  (id) => id !== calendar.id,
                                );
                            updateSyncSettings("calendarsToSync", newCalendars);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sync Tab */}
            <TabsContent value="sync" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Synchronisatie Status</CardTitle>
                  <CardDescription>
                    Bekijk de status van je Google Calendar synchronisatie
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          {syncSettings.provider === "google"
                            ? "Google"
                            : "Microsoft"}{" "}
                          Account Verbonden
                        </p>
                        <p className="text-sm text-green-600">
                          Laatste sync:{" "}
                          {lastSync?.toLocaleString("nl-NL") ||
                            "Nog niet gesynchroniseerd"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDisconnectProvider}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Ontkoppelen
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {calendars.length}
                      </div>
                      <div className="text-sm text-blue-600">Calendars</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {events.length}
                      </div>
                      <div className="text-sm text-purple-600">Afspraken</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {syncSettings.enabled ? "ON" : "OFF"}
                      </div>
                      <div className="text-sm text-green-600">Auto Sync</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {syncSettings.bufferTime}min
                      </div>
                      <div className="text-sm text-orange-600">Buffer</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="w-full"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                      />
                      {isSyncing ? "Synchroniseren..." : "Nu Synchroniseren"}
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={generateFocusBlocks}>
                        <Plus className="h-4 w-4 mr-2" />
                        Genereer Focus Blokken
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/planning")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Bekijk Planning
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CalendarIntegration;
