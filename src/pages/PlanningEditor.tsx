import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ArrowLeft, Clock, Target } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import realGoogleIntegration from '@/lib/real-google-integration';

interface Task {
  id: string;
  name: string;
  duration: number;
}

const PlanningEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'E-mails beantwoorden', duration: 30 },
    { id: '2', name: 'Presentatie voorbereiden', duration: 60 },
    { id: '3', name: 'Vergadering bijwonen', duration: 45 },
  ]);
  const [newTask, setNewTask] = useState({ name: '', duration: 30 });
  const [autoImport, setAutoImport] = useState(false);
  const [importing, setImporting] = useState(false);

  const addTask = () => {
    if (!newTask.name.trim()) {
      toast({
        title: "Fout",
        description: "Voer een taaknaam in",
        variant: "destructive",
      });
      return;
    }

    const task: Task = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newTask.name,
      duration: newTask.duration,
    };

    setTasks([...tasks, task]);
    setNewTask({ name: '', duration: 30 });
    
    toast({
      title: "Taak toegevoegd",
      description: `"${task.name}" is toegevoegd aan je planning`,
    });
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast({
      title: "Taak verwijderd",
      description: "De taak is verwijderd uit je planning",
    });
  };

  const generateSchedule = () => {
    // Auto-generate breaks between focus blocks
    const schedule = [];
    let currentTime = 9; // Start at 9:00
    let currentMinutes = 0;

    tasks.forEach((task, index) => {
      // Add focus block
      const startTime = `${currentTime.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      schedule.push({
        id: `focus-${task.id}-${index}`,
        task: task.name,
        duration: task.duration,
        type: 'focus',
        startTime,
      });

      // Update time
      currentMinutes += task.duration;
      if (currentMinutes >= 60) {
        currentTime += Math.floor(currentMinutes / 60);
        currentMinutes = currentMinutes % 60;
      }

      // Add break (except after last task)
      if (index < tasks.length - 1) {
        const breakDuration = task.duration >= 60 ? 15 : 10;
        const breakStartTime = `${currentTime.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        schedule.push({
          id: `break-${task.id}-${index}`,
          task: task.duration >= 60 ? 'Lange pauze' : 'Korte pauze',
          duration: breakDuration,
          type: 'break',
          startTime: breakStartTime,
        });

        currentMinutes += breakDuration;
        if (currentMinutes >= 60) {
          currentTime += Math.floor(currentMinutes / 60);
          currentMinutes = currentMinutes % 60;
        }
      }
    });

    return schedule;
  };

  const totalWorkTime = tasks.reduce((sum, task) => sum + task.duration, 0);
  const schedule = generateSchedule();

  const saveSchedule = () => {
    // Here you would normally save to backend/localStorage
    toast({
      title: "Planning opgeslagen!",
      description: "Je dagplanning is bijgewerkt",
    });
    navigate('/dashboard');
  };

  // Import Google Calendar events as tasks
  const importGoogleCalendarEvents = async () => {
    setImporting(true);
    try {
      // Ensure Google is connected
      if (!realGoogleIntegration.isConnected()) {
        await realGoogleIntegration.connect();
      }
      const events = await realGoogleIntegration.getEvents();
      if (!events.length) {
        toast({ title: 'Geen afspraken gevonden', description: 'Er zijn geen Google Calendar afspraken voor vandaag.' });
        setImporting(false);
        return;
      }
      // Map events to tasks (simple: summary as name, duration in minutes)
      const importedTasks = events.map(event => {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const duration = Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000));
        return {
          id: `google-${event.id}-${start.getTime()}`,
          name: event.summary || 'Afspraken',
          duration,
        };
      });
      setTasks(prev => ([...prev, ...importedTasks]));
      toast({ title: 'Afspraken geïmporteerd', description: `${importedTasks.length} afspraken toegevoegd aan je planning.` });
    } catch (e) {
      toast({ title: 'Fout bij importeren', description: 'Kon Google Calendar afspraken niet importeren.', variant: 'destructive' });
    }
    setImporting(false);
  };

  // Auto-import on mount if enabled
  useEffect(() => {
    if (autoImport) {
      importGoogleCalendarEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoImport]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-focus-50 via-white to-zen-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dagplanning Editor</h1>
              <p className="text-gray-600">Plan je taken en focusblokken</p>
            </div>
          </div>
          <Button onClick={saveSchedule}>
            Opslaan
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Import Google Calendar */}
        <div className="flex items-center space-x-4 mb-4">
          <Button onClick={importGoogleCalendarEvents} disabled={importing} variant="outline">
            {importing ? 'Importeren...' : 'Importeer van Google Calendar'}
          </Button>
          <div className="flex items-center space-x-2">
            <Switch id="autoImport" checked={autoImport} onCheckedChange={setAutoImport} />
            <Label htmlFor="autoImport">Automatisch importeren</Label>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              <p className="text-sm text-gray-600">Taken gepland</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{totalWorkTime}min</p>
              <p className="text-sm text-gray-600">Totale werktijd</p>
            </CardContent>
          </Card>
        </div>

        {/* Add New Task */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Nieuwe Taak Toevoegen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="taskName">Taaknaam</Label>
                <Input
                  id="taskName"
                  placeholder="Bijv. E-mails beantwoorden"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duur (minuten)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="120"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({...newTask, duration: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>
            <Button onClick={addTask} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Taak Toevoegen
            </Button>
          </CardContent>
        </Card>

        {/* Current Tasks */}
        {tasks.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Huidige Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.name}</h3>
                      <p className="text-sm text-gray-600">{task.duration} minuten</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {task.duration}min
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Schedule Preview */}
        {schedule.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Voorvertoning Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.map((block) => (
                  <div 
                    key={block.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      block.type === 'focus' 
                        ? 'bg-primary/5 border border-primary/20' 
                        : 'bg-accent/5 border border-accent/20'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      block.type === 'focus' ? 'bg-primary' : 'bg-accent'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {block.task}
                        </span>
                        <span className="text-sm text-gray-500">
                          {block.startTime} ({block.duration}min)
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={block.type === 'focus' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {block.type === 'focus' ? 'Focus' : 'Pauze'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlanningEditor;
