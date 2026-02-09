
import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, Calendar, Settings, Sparkles, Bell, Mail } from 'lucide-react';
import { StudySession, MotivationalQuote } from './types';
import { generateStudyPlan, getMotivationalQuote } from './services/geminiService';
import { Button } from './components/Button';
import { StudyCard } from './components/StudyCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
    email: '',
    time: '',
    duration: 30
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

  // Unified Notification & Email System
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setSessions(prev => {
        let changed = false;
        const nextSessions = prev.map(s => {
          if (s.startTime === currentStr && !s.isCompleted && !s.emailSent) {
            // Trigger Notification
            setNotification(`Email de rappel envoyé à ${s.email} pour ${s.topic}`);
            
            // Log simulation d'envoi d'email
            console.log(`%c [SERVICE EMAIL] %c Envoi d'un rappel à ${s.email}...`, 'background: #4f46e5; color: white; font-weight: bold;', 'color: #4f46e5;');
            console.log(`Sujet: C'est l'heure d'étudier ton cours de ${s.subject} !`);
            console.log(`Contenu: Bonjour, n'oublie pas ta session de ${s.durationMinutes} min sur "${s.topic}".`);
            
            changed = true;
            return { ...s, emailSent: true };
          }
          return s;
        });

        if (changed) {
          setTimeout(() => setNotification(null), 6000);
          return nextSessions;
        }
        return prev;
      });
    }, 10000); // Check every 10 seconds for more reactivity in MVP
    
    return () => clearInterval(interval);
  }, []);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.topic || !formData.time || !formData.email) return;

    setIsLoadingPlan(true);
    const breakdown = await generateStudyPlan(formData.subject, formData.topic, formData.duration);
    
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      subject: formData.subject,
      topic: formData.topic,
      email: formData.email,
      startTime: formData.time,
      durationMinutes: formData.duration,
      isCompleted: false,
      emailSent: false,
      breakdown
    };

    setSessions(prev => [newSession, ...prev]);
    setFormData({ subject: '', topic: '', email: '', time: '', duration: 30 });
    setIsAdding(false);
    setIsLoadingPlan(false);
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Navigation */}
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">StudyFlow</h1>
        </div>

        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>
          <button className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Calendar className="h-5 w-5" /> Planning
          </button>
          <button className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Mail className="h-5 w-5" /> Emails
          </button>
          <button className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <Settings className="h-5 w-5" /> Paramètres
          </button>
        </div>

        <div className="mt-auto p-4 bg-indigo-900 rounded-2xl text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 bg-indigo-500/20 w-16 h-16 rounded-full blur-2xl"></div>
          <p className="text-xs text-indigo-300 font-bold uppercase mb-2">Statut Serveur Mail</p>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
             <p className="text-sm font-medium">Opérationnel</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Gestionnaire d'Études</h2>
            <p className="text-slate-500 mt-1">L'IA s'occupe de vos rappels par email.</p>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-5 w-5" /> Créer un rappel
          </Button>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-500/30 backdrop-blur-md">
              <div className="bg-indigo-600 p-2 rounded-full">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Action de rappel</p>
                <p className="text-indigo-200 text-xs">{notification}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Sessions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">Sessions programmées</h3>
              <span className="text-sm text-slate-400 font-medium">{sessions.length} au total</span>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="text-slate-700 font-bold text-xl">Aucun email en attente</h4>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                  Ajoutez un sujet et un email élève pour commencer à envoyer des rappels automatiques.
                </p>
                <Button variant="outline" className="mt-8 mx-auto" onClick={() => setIsAdding(true)}>
                  Nouveau planning
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

          {/* Right Column: Statistics */}
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Taux d'engagement</h3>
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
              <div className="mt-4 flex justify-around text-center">
                <div className="bg-indigo-50 p-3 rounded-2xl flex-1 mr-2">
                  <p className="text-2xl font-black text-indigo-600 leading-none">{completedCount}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1 tracking-wider">Succès</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl flex-1 ml-2">
                  <p className="text-2xl font-black text-slate-800 leading-none">{pendingCount}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">En cours</p>
                </div>
              </div>
            </section>

            {quote && (
              <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl">
                 <Sparkles className="h-6 w-6 text-indigo-200 mb-3" />
                 <p className="text-sm italic leading-relaxed font-medium">"{quote.text}"</p>
                 <div className="mt-4 h-px bg-white/20 w-12"></div>
                 <p className="mt-3 text-xs font-bold text-indigo-200 uppercase tracking-widest">{quote.author}</p>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Add Session Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nouvelle Étude</h3>
                  <p className="text-slate-400 text-sm font-medium">Un email sera envoyé au moment du rappel.</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                   <Plus className="h-6 w-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddSession} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email de l'Élève</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="nom@ecole.com"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Matière</label>
                    <input 
                      type="text" 
                      placeholder="Maths..."
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sujet</label>
                    <input 
                      type="text" 
                      placeholder="Algèbre..."
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      value={formData.topic}
                      onChange={e => setFormData({ ...formData, topic: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Heure Rappel</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Durée</label>
                    <select 
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>1 heure</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-2xl py-4"
                    onClick={() => setIsAdding(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] rounded-2xl py-4"
                    isLoading={isLoadingPlan}
                  >
                    Planifier & Email
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
