
import React from 'react';
import { StudySession } from '../types';
import { CheckCircle, Clock, BookOpen, Trash2, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';

interface StudyCardProps {
  session: StudySession;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const DAYS_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const StudyCard: React.FC<StudyCardProps> = ({ session, onToggleComplete, onDelete }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={`p-5 rounded-3xl border transition-all duration-300 ${session.isCompleted ? 'bg-slate-50 border-slate-200 opacity-60 scale-[0.98]' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <button 
            onClick={() => onToggleComplete(session.id)}
            className={`mt-1 h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all ${session.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-[#4B53BC] hover:scale-105'}`}
          >
            {session.isCompleted && <CheckCircle className="h-4 w-4 text-white" />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-lg font-bold leading-tight ${session.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {session.topic}
              </h3>
              {session.emailSent && !session.isCompleted && (
                <span className="flex items-center gap-1 bg-[#4B53BC]/10 text-[#4B53BC] px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-[#4B53BC]/20">
                  <Send className="h-2.5 w-2.5" /> Teams OK
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-[12px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> {session.subject}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" /> {session.startTime}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" /> {session.teamsId}
              </span>
            </div>

            {/* Days Indicator */}
            {session.daysOfWeek && session.daysOfWeek.length > 0 && (
              <div className="flex gap-1 mt-3">
                {DAYS_LABELS.map((label, idx) => {
                  const isActive = session.daysOfWeek?.includes(idx);
                  return (
                    <span 
                      key={idx} 
                      className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold border ${
                        isActive 
                          ? 'bg-[#4B53BC]/10 text-[#4B53BC] border-[#4B53BC]/20' 
                          : 'bg-slate-50 text-slate-300 border-slate-100'
                      }`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
           {session.breakdown && session.breakdown.length > 0 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
          <button 
            onClick={() => onDelete(session.id)}
            className="p-2 rounded-xl hover:bg-rose-50 text-rose-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isExpanded && session.breakdown && (
        <div className="mt-5 pt-5 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-[#4B53BC]"></div>
            <p className="text-[10px] font-black text-[#4B53BC] uppercase tracking-widest">Guide de révision Teams</p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.breakdown.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100/50">
                <span className="flex-shrink-0 h-5 w-5 flex items-center justify-center bg-white text-[#4B53BC] rounded-lg text-[10px] font-black shadow-sm border border-slate-100">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
