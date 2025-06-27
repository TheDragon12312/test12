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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Bell,
  Palette,
  Shield,
  Zap,
  Brain,
  Clock,
  Target,
  Eye,
  Globe,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  Calendar,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { SettingsManager, AppSettings } from "@/lib/settings-manager";
import { notificationService } from "@/lib/notification-service";
import { i18n, Language } from "@/lib/i18n";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.email?.split("@")[0] || "Gebruiker",
    email: user?.email || "",
    timezone: "Europe/Amsterdam",
    language: "nl",
  });

  const [settings, setSettings] = useState<AppSettings>(() =>
    SettingsManager.getSettings(),
  );
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Settings are managed locally and updated manually

  const handleSave = (section: string) => {
    toast.success(`${section} instellingen opgeslagen! ✅`);
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    SettingsManager.updateSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Apply language change immediately
    if (key === "language") {
      i18n.setLanguage(value as Language);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        profile,
        settings,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "focusflow-settings.json";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Data geëxporteerd! 📁");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export mislukt");
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Weet je zeker dat je je account wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.",
    );

    if (confirmed) {
      logout();
      navigate("/");
      toast.success("Account verwijderd");
    }
  };

  const resetToDefaults = () => {
    const confirmed = window.confirm(
      "Weet je zeker dat je alle instellingen wilt resetten?",
    );

    if (confirmed) {
      SettingsManager.resetToDefaults();
      setSettings(SettingsManager.getSettings());
      toast.success("Standaardinstellingen hersteld! 🔄");
    }
  };

  const testNotification = () => {
    notificationService.showNotification({
      title: "Test Notificatie",
      message: "Dit is een test om te controleren of notificaties werken!",
      type: "info",
    });
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-focus-50 via-white to-zen-50">
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
              <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
              <p className="text-gray-600">
                Pas FocusFlow aan naar jouw voorkeuren
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="focus" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="focus" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Focus</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Coach</span>
            </TabsTrigger>
            <TabsTrigger
              value="distraction"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Afleiding</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center space-x-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaties</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center space-x-2"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Uiterlijk</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Integraties</span>
            </TabsTrigger>
          </TabsList>

          {/* Focus Settings */}
          <TabsContent value="focus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Focus Instellingen</span>
                </CardTitle>
                <CardDescription>
                  Configureer je ideale focus- en pauzetijden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Standaard Focus Tijd</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[settings.defaultFocusTime]}
                        onValueChange={(value) =>
                          updateSetting("defaultFocusTime", value[0])
                        }
                        max={60}
                        min={5}
                        step={5}
                      />
                      <div className="text-center text-sm text-gray-600">
                        {settings.defaultFocusTime} minuten
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Korte Pauze</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[settings.defaultBreakTime]}
                        onValueChange={(value) =>
                          updateSetting("defaultBreakTime", value[0])
                        }
                        max={15}
                        min={3}
                        step={1}
                      />
                      <div className="text-center text-sm text-gray-600">
                        {settings.defaultBreakTime} minuten
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Lange Pauze</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[settings.longBreakTime]}
                        onValueChange={(value) =>
                          updateSetting("longBreakTime", value[0])
                        }
                        max={30}
                        min={10}
                        step={5}
                      />
                      <div className="text-center text-sm text-gray-600">
                        {settings.longBreakTime} minuten
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-start pauzes</Label>
                      <p className="text-sm text-gray-600">
                        Start automatisch pauzes na een focus sessie
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoStartBreaks}
                      onCheckedChange={(checked) =>
                        updateSetting("autoStartBreaks", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-start focus</Label>
                      <p className="text-sm text-gray-600">
                        Start automatisch focus sessies na een pauze
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoStartFocus}
                      onCheckedChange={(checked) =>
                        updateSetting("autoStartFocus", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Geluidsmeldingen</Label>
                      <p className="text-sm text-gray-600">
                        Speel geluiden af bij start/einde van sessies
                      </p>
                    </div>
                    <Switch
                      checked={settings.playSounds}
                      onCheckedChange={(checked) =>
                        updateSetting("playSounds", checked)
                      }
                    />
                  </div>

                  {settings.playSounds && (
                    <div className="space-y-2">
                      <Label>Geluidsvolume</Label>
                      <Slider
                        value={[settings.soundVolume]}
                        onValueChange={(value) =>
                          updateSetting("soundVolume", value[0])
                        }
                        max={100}
                        min={0}
                        step={10}
                      />
                      <div className="text-center text-sm text-gray-600">
                        {settings.soundVolume}%
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={() => handleSave("Focus")} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Focus Instellingen Opslaan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Coach Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Productiviteitscoach</span>
                  <Badge className="bg-purple-100 text-purple-700">
                    Premium
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Configureer je persoonlijke AI coach voor optimale
                  productiviteit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>AI Coach Inschakelen</Label>
                    <p className="text-sm text-gray-600">
                      Ontvang persoonlijke coaching en inzichten
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAiCoach}
                    onCheckedChange={(checked) =>
                      updateSetting("enableAiCoach", checked)
                    }
                  />
                </div>

                {settings.enableAiCoach && (
                  <>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Coach Persoonlijkheid</Label>
                        <Select
                          value={settings.coachPersonality}
                          onValueChange={(
                            value: "motivating" | "calm" | "professional",
                          ) => updateSetting("coachPersonality", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="motivating">
                              🔥 Motiverend en Energiek
                            </SelectItem>
                            <SelectItem value="calm">
                              🧘 Kalm en Ondersteunend
                            </SelectItem>
                            <SelectItem value="professional">
                              💼 Professioneel en Direct
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Inzicht Frequentie</Label>
                        <Select
                          value={settings.insightFrequency}
                          onValueChange={(value: "low" | "medium" | "high") =>
                            updateSetting("insightFrequency", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              Laag (1-2 per dag)
                            </SelectItem>
                            <SelectItem value="medium">
                              Gemiddeld (3-5 per dag)
                            </SelectItem>
                            <SelectItem value="high">
                              Hoog (5+ per dag)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Leren van Patronen</Label>
                          <p className="text-sm text-gray-600">
                            AI analyseert je werkpatronen voor betere suggesties
                          </p>
                        </div>
                        <Switch
                          checked={settings.learningFromPatterns}
                          onCheckedChange={(checked) =>
                            updateSetting("learningFromPatterns", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Persoonlijke Tips</Label>
                          <p className="text-sm text-gray-600">
                            Ontvang op maat gemaakte productiviteitstips
                          </p>
                        </div>
                        <Switch
                          checked={settings.personalizedTips}
                          onCheckedChange={(checked) =>
                            updateSetting("personalizedTips", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Productiviteitsdoelen</Label>
                          <p className="text-sm text-gray-600">
                            AI helpt je realistische doelen te stellen
                          </p>
                        </div>
                        <Switch
                          checked={settings.productivityGoals}
                          onCheckedChange={(checked) =>
                            updateSetting("productivityGoals", checked)
                          }
                        />
                      </div>
                    </div>

                    <Alert>
                      <HelpCircle className="h-4 w-4" />
                      <AlertDescription>
                        De AI coach gebruikt alleen je productiviteitsdata om
                        inzichten te genereren. Je persoonlijke bestanden en
                        gevoelige informatie worden nooit geanalyseerd.
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                <Button
                  onClick={() => handleSave("AI Coach")}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  AI Instellingen Opslaan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distraction Settings */}
          <TabsContent value="distraction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Afleidingsdetectie</span>
                </CardTitle>
                <CardDescription>
                  Configureer hoe FocusFlow afleidingen detecteert en blokkeert
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Afleidingsdetectie Inschakelen</Label>
                    <p className="text-sm text-gray-600">
                      Monitor activiteit en waarschuw bij afleidingen
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableDetection}
                    onCheckedChange={(checked) =>
                      updateSetting("enableDetection", checked)
                    }
                  />
                </div>

                {/* NIEUW: Tab switch meldingen aan/uit */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tab Switch Melding</Label>
                    <p className="text-sm text-gray-600">
                      Toon melding bij tabblad wisselen
                    </p>
                  </div>
                  <Switch
                    checked={settings.tabSwitchAlerts !== false}
                    onCheckedChange={(checked) =>
                      updateSetting("tabSwitchAlerts", checked)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Toegestane Domeinen (allowlist)</Label>
                  <p className="text-xs text-gray-500">
                    Domeinen gescheiden door komma waarvoor tab switch is toegestaan (bijv. teams.microsoft.com, outlook.com)
                  </p>
                  <Input
                    value={settings.tabSwitchAllowlist || ""}
                    onChange={(e) =>
                      updateSetting("tabSwitchAllowlist", e.target.value)
                    }
                    placeholder="teams.microsoft.com, outlook.com"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>URL Blokkering</Label>
                      <p className="text-sm text-gray-600">
                        Blokkeer afleidende websites tijdens focus sessies
                      </p>
                    </div>
                    <Switch
                      checked={settings.urlBlocking}
                      onCheckedChange={(checked) =>
                        updateSetting("urlBlocking", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Strikte Modus</Label>
                      <p className="text-sm text-gray-600">
                        Forceer focus door sterke beperkingen
                      </p>
                    </div>
                    <Switch
                      checked={settings.strictMode}
                      onCheckedChange={(checked) =>
                        updateSetting("strictMode", checked)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Geblokkeerde Sites</Label>
                    <p className="text-xs text-gray-500">
                      Komma-gescheiden lijst van domeinen om te blokkeren
                    </p>
                    <Input
                      value={settings.customBlockedSites}
                      onChange={(e) =>
                        updateSetting("customBlockedSites", e.target.value)
                      }
                      placeholder="facebook.com, twitter.com, instagram.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Toegestane Sites</Label>
                    <p className="text-xs text-gray-500">
                      Sites die altijd toegankelijk blijven
                    </p>
                    <Input
                      value={settings.allowList}
                      onChange={(e) =>
                        updateSetting("allowList", e.target.value)
                      }
                      placeholder="github.com, stackoverflow.com, docs.google.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notificaties</span>
                </CardTitle>
                <CardDescription>
                  Beheer wanneer en hoe je notificaties wilt ontvangen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Focus Herinneringen</Label>
                      <p className="text-sm text-gray-600">
                        Krijg herinneringen om focus sessies te starten
                      </p>
                    </div>
                    <Switch
                      checked={settings.focusReminders}
                      onCheckedChange={(checked) =>
                        updateSetting("focusReminders", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Pauze Herinneringen</Label>
                      <p className="text-sm text-gray-600">
                        Waarschuwingen wanneer het tijd is voor een pauze
                      </p>
                    </div>
                    <Switch
                      checked={settings.breakReminders}
                      onCheckedChange={(checked) =>
                        updateSetting("breakReminders", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dagelijks Rapport</Label>
                      <p className="text-sm text-gray-600">
                        Ontvang een samenvatting van je dagelijkse
                        productiviteit
                      </p>
                    </div>
                    <Switch
                      checked={settings.dailyReport}
                      onCheckedChange={(checked) =>
                        updateSetting("dailyReport", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Wekelijks Rapport</Label>
                      <p className="text-sm text-gray-600">
                        Krijg een wekelijkse analyse van je prestaties
                      </p>
                    </div>
                    <Switch
                      checked={settings.weeklyReport}
                      onCheckedChange={(checked) =>
                        updateSetting("weeklyReport", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Afleiding Waarschuwingen</Label>
                      <p className="text-sm text-gray-600">
                        Meldingen bij gedetecteerde afleidingen
                      </p>
                    </div>
                    <Switch
                      checked={settings.distractionAlerts}
                      onCheckedChange={(checked) =>
                        updateSetting("distractionAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Prestatie Meldingen</Label>
                      <p className="text-sm text-gray-600">
                        Vieringen van behaalde mijlpalen en doelen
                      </p>
                    </div>
                    <Switch
                      checked={settings.achievementNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("achievementNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Samenvattingen</Label>
                      <p className="text-sm text-gray-600">
                        Ontvang periodieke emails met je statistieken
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailDigests}
                      onCheckedChange={(checked) =>
                        updateSetting("emailDigests", checked)
                      }
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleSave("Notificaties")}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Notificatie Instellingen Opslaan
                  </Button>
                  <Button variant="outline" onClick={testNotification}>
                    <Bell className="h-4 w-4 mr-2" />
                    Test Notificatie
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Uiterlijk & Thema</span>
                </CardTitle>
                <CardDescription>
                  Personaliseer hoe FocusFlow eruitziet en aanvoelt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Taal / Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value: Language) =>
                        updateSetting("language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Thema</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: "light" | "dark" | "auto") =>
                        updateSetting("theme", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">🌞 Licht</SelectItem>
                        <SelectItem value="dark">🌙 Donker</SelectItem>
                        <SelectItem value="auto">🔄 Automatisch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Kleur</Label>
                    <Select
                      value={settings.accentColor}
                      onValueChange={(
                        value: "blue" | "purple" | "green" | "orange",
                      ) => updateSetting("accentColor", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">🔵 Blauw</SelectItem>
                        <SelectItem value="purple">🟣 Paars</SelectItem>
                        <SelectItem value="green">🟢 Groen</SelectItem>
                        <SelectItem value="orange">🟠 Oranje</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compacte Modus</Label>
                      <p className="text-sm text-gray-600">
                        Gebruik minder ruimte voor een dichtere interface
                      </p>
                    </div>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(checked) =>
                        updateSetting("compactMode", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Toon Statistieken</Label>
                      <p className="text-sm text-gray-600">
                        Toon productiviteitsstatistieken in de sidebar
                      </p>
                    </div>
                    <Switch
                      checked={settings.showStatistics}
                      onCheckedChange={(checked) =>
                        updateSetting("showStatistics", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Animaties</Label>
                      <p className="text-sm text-gray-600">
                        Schakel visuele animaties en transities in
                      </p>
                    </div>
                    <Switch
                      checked={settings.animationsEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("animationsEnabled", checked)
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave("Uiterlijk")}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Uiterlijk Instellingen Opslaan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Integraties</span>
                </CardTitle>
                <CardDescription>
                  Verbind je externe diensten voor een naadloze ervaring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Calendar Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Google Calendar</h4>
                      <p className="text-sm text-gray-600">
                        {/* {isGoogleConnected
                          ? "Verbonden en actief"
                          : "Niet verbonden"} */}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* {isGoogleConnected && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        ✓ Actief
                      </Badge>
                    )}
                    {isGoogleConnected ? (
                      <Button
                        variant="outline"
                        onClick={handleGoogleDisconnect}
                      >
                        Loskoppelen
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGoogleConnect}
                        disabled={isConnectingGoogle}
                      >
                        {isConnectingGoogle ? "Verbinden..." : "Verbinden"}
                      </Button>
                    )} */}
                  </div>
                </div>

                {/* Email Integration */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Rapporten</h4>
                      <p className="text-sm text-gray-600">
                        {settings.emailDigests
                          ? "Ingeschakeld"
                          : "Uitgeschakeld"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {settings.emailDigests && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        ✓ Actief
                      </Badge>
                    )}
                    <Switch
                      checked={settings.emailDigests}
                      onCheckedChange={(checked) =>
                        updateSetting("emailDigests", checked)
                      }
                    />
                  </div>
                </div>

                {/* {isGoogleConnected && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      🎉 Google Calendar is succesvol verbonden! Je kunt nu
                      focus sessies automatisch toevoegen aan je agenda.
                    </AlertDescription>
                  </Alert>
                )} */}

                <Button
                  onClick={() => handleSave("Integraties")}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Integratie Instellingen Opslaan
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Gevaarlijke Zone</span>
                </CardTitle>
                <CardDescription className="text-red-600">
                  Deze acties kunnen niet ongedaan gemaakt worden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-700">
                      Alle Instellingen Resetten
                    </h4>
                    <p className="text-sm text-red-600">
                      Zet alle instellingen terug naar standaardwaarden
                    </p>
                  </div>
                  <Button variant="outline" onClick={resetToDefaults}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Alles
                  </Button>
                </div>

                <Separator className="bg-red-200" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-700">
                      Account Verwijderen
                    </h4>
                    <p className="text-sm text-red-600">
                      Permanent verwijder je account en alle data
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijderen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
