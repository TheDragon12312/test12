
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Target,
  Plus,
  UserPlus,
  Crown,
  Sparkles,
  Trophy,
  TrendingUp,
  BarChart3,
  Play,
  Coffee,
  MessageCircle,
  Video,
  Mail,
  CheckCircle,
  Timer,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useTeamCollaboration } from "@/hooks/useTeamCollaboration";
import { paddleService } from "@/lib/paddle-service";

const TeamCollaboration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    friends,
    teamSessions,
    loading,
    addFriend,
    createTeamSession,
    joinTeamSession,
    refreshData
  } = useTeamCollaboration();

  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSession, setNewSession] = useState({
    name: "",
    description: "",
    start_time: "",
    duration: 60,
    participantIds: [] as string[]
  });

  const [teamStats, setTeamStats] = useState({
    totalSessions: 0,
    avgProductivity: 0,
    activeMembers: friends.length,
    weeklyGrowth: 15,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    setTeamStats(prev => ({
      ...prev,
      totalSessions: teamSessions.length,
      avgProductivity: friends.length > 0 
        ? Math.round(friends.reduce((sum, f) => sum + f.productivity, 0) / friends.length)
        : 0,
      activeMembers: friends.filter(f => f.status !== 'offline').length,
    }));
  }, [friends, teamSessions]);

  const handleAddFriend = async () => {
    if (!newFriendEmail.trim() || !newFriendEmail.includes("@")) {
      toast.error("Voer een geldig e-mailadres in");
      return;
    }

    const success = await addFriend(newFriendEmail);
    if (success) {
      setNewFriendEmail("");
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.name.trim()) {
      toast.error("Sessie naam is verplicht");
      return;
    }

    if (!newSession.start_time) {
      toast.error("Start tijd is verplicht");
      return;
    }

    const success = await createTeamSession(newSession);
    if (success) {
      setNewSession({
        name: "",
        description: "",
        start_time: "",
        duration: 60,
        participantIds: []
      });
      setShowCreateSession(false);
    }
  };

  const handleUpgradeToTeam = async () => {
    try {
      await paddleService.openCheckout({
        items: [{ priceId: "team_monthly" }],
        customer: { email: user?.email },
        successUrl: `${window.location.origin}/team?upgraded=true`
      });
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Er ging iets mis bij het upgraden');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "focus":
        return <Target className="h-4 w-4 text-green-600" />;
      case "break":
        return <Coffee className="h-4 w-4 text-orange-600" />;
      case "online":
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case "offline":
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "focus":
        return "bg-green-100 text-green-700 border-green-200";
      case "break":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "online":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "offline":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Team Samenwerking
              </h1>
              <p className="text-gray-600">
                Synchroniseer en optimaliseer samen
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-green-100 text-green-700 animate-pulse">
              🟢 {teamStats.activeMembers} online
            </Badge>
            <Button
              variant="outline"
              onClick={handleUpgradeToTeam}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade naar Team
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {friends.length}
              </div>
              <p className="text-sm text-gray-600">Vrienden</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {teamStats.avgProductivity}%
              </div>
              <p className="text-sm text-gray-600">Gem. Productiviteit</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {teamStats.totalSessions}
              </div>
              <p className="text-sm text-gray-600">Team Sessies</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                +{teamStats.weeklyGrowth}%
              </div>
              <p className="text-sm text-gray-600">Deze Week</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Vrienden ({friends.length})</TabsTrigger>
            <TabsTrigger value="sessions">Team Sessies ({teamSessions.length})</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vrienden ({friends.length})</span>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Vriend Toevoegen
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add friend */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="E-mailadres van vriend"
                    value={newFriendEmail}
                    onChange={(e) => setNewFriendEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddFriend}
                    disabled={!newFriendEmail.trim()}
                  >
                    Toevoegen
                  </Button>
                </div>

                {/* Friends list */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Vrienden laden...</p>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Nog geen vrienden</p>
                      <p>Voeg vrienden toe om samen te focussen!</p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={friend.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {friend.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{friend.name}</h4>
                              <Badge
                                className={getStatusColor(friend.status)}
                                variant="outline"
                              >
                                {getStatusIcon(friend.status)}
                                <span className="ml-1 capitalize">
                                  {friend.status}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {friend.email}
                            </p>
                            {friend.currentTask && (
                              <p className="text-xs text-blue-600">
                                🎯 {friend.currentTask}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {friend.productivity}%
                              </div>
                              <div className="text-xs text-gray-500">
                                Productiviteit
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {friend.sessionsToday}
                              </div>
                              <div className="text-xs text-gray-500">Sessies</div>
                            </div>
                            <Progress
                              value={friend.productivity}
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team Sessies</span>
                  <Button
                    onClick={() => setShowCreateSession(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nieuwe Sessie
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showCreateSession && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold">Nieuwe Team Sessie</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Sessie Naam</Label>
                          <Input
                            value={newSession.name}
                            onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Bijvoorbeeld: Ochtend Focus"
                          />
                        </div>
                        <div>
                          <Label>Duur (minuten)</Label>
                          <Input
                            type="number"
                            value={newSession.duration}
                            onChange={(e) => setNewSession(prev => ({ ...prev, duration: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Beschrijving</Label>
                        <Input
                          value={newSession.description}
                          onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Optionele beschrijving"
                        />
                      </div>
                      <div>
                        <Label>Start Tijd</Label>
                        <Input
                          type="datetime-local"
                          value={newSession.start_time}
                          onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleCreateSession}>
                          Sessie Maken
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateSession(false)}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Sessies laden...</p>
                  </div>
                ) : teamSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Nog geen team sessies</p>
                    <p>Plan je eerste gezamenlijke focus sessie!</p>
                  </div>
                ) : (
                  teamSessions.map((session) => (
                    <div
                      key={session.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {session.name}
                          </h4>
                          <p className="text-gray-600">{session.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(session.start_time).toLocaleString('nl-NL')}
                            </span>
                            <span className="flex items-center">
                              <Timer className="h-4 w-4 mr-1" />
                              {session.duration} min
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {session.participants.length} deelnemers
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge
                            className={
                              session.status === "active"
                                ? "bg-green-100 text-green-700"
                                : session.status === "scheduled"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }
                          >
                            {session.status === "active" && (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            {session.status === "scheduled" && (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {session.status === "completed" && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {session.status === "active"
                              ? "Actief"
                              : session.status === "scheduled"
                                ? "Gepland"
                                : session.status === "completed"
                                  ? "Voltooid"
                                  : "Geannuleerd"}
                          </Badge>

                          {session.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => joinTeamSession(session.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Deelnemen
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
                  Productiviteits Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {friends
                    .sort((a, b) => b.productivity - a.productivity)
                    .map((friend, index) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold">
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.avatar_url} />
                            <AvatarFallback>
                              {friend.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{friend.name}</h4>
                            <p className="text-sm text-gray-500">
                              {friend.sessionsToday} sessies vandaag
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {friend.productivity}%
                          </div>
                          <Progress value={friend.productivity} className="w-20 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamCollaboration;
