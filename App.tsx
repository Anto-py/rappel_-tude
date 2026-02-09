
import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, Calendar, Settings, Sparkles, Bell, MessageSquare, Clock, Send } from 'lucide-react';
import { StudySession, MotivationalQuote } from './types';
import { generateStudyPlan, getMotivationalQuote } from './services/geminiService';
import { Button } from './components/Button';
import { StudyCard } from './components/StudyCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DAYS = [
  { label: 'D', value: 0 },
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
];

const App: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    teamsId: '',
    time: '',
    duration: 30,
    daysOfWeek: [] as number[]
  });

  useEffect(() => {
    const saved = localStorage.getItem('studyflow_sessions');
    if (saved) setSessions(JSON.parse(saved));
    
    const fetchQuote = async () => {
      const q = await getMotivationalQuote();
      setQuote(q);
    };
    fetchQuote();
  }, []);

  useEffect(() => {
    localStorage.setItem('studyflow_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Teams Notification System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();
      const todayDateStr = now.toISOString().split('T')[0];
      
      setSessions(prev => {
        let changed = false;
        const nextSessions = prev.map(s => {
          const isRightDay = s.daysOfWeek?.includes(currentDay) || (s.daysOfWeek?.length === 0);
          const notSentToday = s.lastSentDate !== todayDateStr;

          if (s.startTime === currentStr && isRightDay && notSentToday && !s.isCompleted) {
            // Trigger Teams Notification simulation
            setNotification(`Message Teams envoyé à ${s.teamsId} pour ${s.topic}`);
            
            // Simulation log for Webhook Teams
            console.log(`%c [MICROSOFT TEAMS] %c Envoi d'une notification à ${s.teamsId}...`, 'background: #4B53BC; color: white; font-weight: bold;', 'color: #4B53BC;');
            console.log(`Payload: { "text": "Bonjour ! C'est l'heure de réviser ${s.topic} (${s.subject}). Bon courage !" }`);
            
            changed = true;
            return { ...s, emailSent: true, lastSentDate: todayDateStr };
          }
          return s;
        });

        if (changed) {
          setTimeout(() => setNotification(null), 6000);
          return nextSessions;
        }
        return prev;
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.topic || !formData.time || !formData.teamsId) return;

    setIsLoadingPlan(true);
    const breakdown = await generateStudyPlan(formData.subject, formData.topic, formData.duration);
    
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      subject: formData.subject,
      topic: formData.topic,
      teamsId: formData.teamsId,
      startTime: formData.time,
      durationMinutes: formData.duration,
      isCompleted: false,
      emailSent: false,
      daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : [new Date().getDay()],
      breakdown
    };

    setSessions(prev => [newSession, ...prev]);
    setFormData({ subject: '', topic: '', teamsId: '', time: '', duration: 30, daysOfWeek: [] });
    setIsAdding(false);
    setIsLoadingPlan(false);
  };

  const toggleDay = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue]
    }));
  };

  const toggleComplete = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const completedCount = sessions.filter(s => s.isCompleted).length;
  const pendingCount = sessions.length - completedCount;
  const chartData = [
    { name: 'Complété', value: completedCount, color: '#4f46e5' },
    { name: 'À faire', value: pendingCount, color: '#e2e8f0' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#4B53BC] p-2 rounded-xl text-white">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">StudyFlow <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-normal">Teams Edition</span></h1>
        </div>

        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>
          <button className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Calendar className="h-5 w-5" /> Planning
          </button>
          <button className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <MessageSquare className="h-5 w-5" /> Conversations
          </button>
          <button className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Settings className="h-5 w-5" /> Paramètres
          </button>
        </div>
        
        <div className="mt-auto p-4 bg-slate-100 rounded-2xl border border-slate-200">
           <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Statut Intégration</p>
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <p className="text-xs font-bold text-slate-700">Connecté à MS Teams</p>
           </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Rappels Teams</h2>
            <p className="text-slate-500 mt-1">Vos révisions synchronisées avec votre espace de travail.</p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="bg-[#4B53BC] hover:bg-[#3b42a0] text-white">
            <Plus className="h-5 w-5" /> Nouveau Rappel
          </Button>
        </header>

        {notification && (
          <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border-l-4 border-[#4B53BC] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
              <div className="bg-[#4B53BC]/10 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-[#4B53BC]" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Notification Teams</p>
                <p className="text-slate-500 text-xs">{notification}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {sessions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <div className="bg-[#4B53BC]/5 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-[#4B53BC]" />
                </div>
                <h4 className="text-slate-700 font-bold text-xl">Aucun rappel actif</h4>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                  Ajoutez un ID Teams pour commencer à recevoir vos rappels de révision.
                </p>
                <Button variant="outline" className="mt-8 mx-auto" onClick={() => setIsAdding(true)}>
                  Configurer un rappel
                </Button>
              </div>
            ) : (
              sessions.map(session => (
                <StudyCard 
                  key={session.id} 
                  session={session} 
                  onToggleComplete={toggleComplete}
                  onDelete={deleteSession}
                />
              ))
            )}
          </div>

          <div className="space-y-8">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-500" /> Progression
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modal Integration Teams */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-[#4B53BC] h-2 w-2 rounded-full"></div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Planifier</h3>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Un message sera envoyé dans Teams.</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                   <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddSession} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jours de la semaine</label>
                  <div className="flex justify-between gap-1">
                    {DAYS.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${
                          formData.daysOfWeek.includes(day.value)
                            ? 'bg-[#4B53BC] border-[#4B53BC] text-white shadow-lg shadow-[#4B53BC]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ID Teams ou Webhook</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Identifiant ou URL Webhook..."
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#4B53BC] outline-none transition-all font-medium text-slate-700"
                      value={formData.teamsId}
                      onChange={e => setFormData({ ...formData, teamsId: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Matière</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Philo"
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#4B53BC] outline-none transition-all font-medium"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Heure</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#4B53BC] outline-none transition-all font-medium"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sujet détaillé</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Dissertation sur le temps"
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#4B53BC] outline-none transition-all font-medium"
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-2xl py-4 border-slate-200"
                    onClick={() => setIsAdding(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] rounded-2xl py-4 bg-[#4B53BC] hover:bg-[#3b42a0]"
                    isLoading={isLoadingPlan}
                  >
                    Confirmer planning
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
