import React, { useState, useEffect, useRef } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES, SpecialStatus } from '../types';
import { SheetService } from '../services/sheetService';
import { calculateTotalScore, calculateGrade, calculateRank, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, Search, Trophy, User, Gift, Target, Compass, Sparkles } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode>(SubjectCode.M1_HISTORY);
  const [filterText, setFilterText] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async (isPolling = false) => {
    if (!isPolling && students.length === 0) setLoading(true);
    try {
        const data = await SheetService.getAllStudents();
        if (isMounted.current) {
            setStudents(prev => JSON.stringify(data) !== JSON.stringify(prev) ? data : prev);
            setLoading(false);
        }
    } catch (error) {
        console.error("Failed to fetch data", error);
        if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoRefresh) {
        fetchData(true);
        interval = setInterval(() => fetchData(true), 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isAutoRefresh]);

  const filteredStudents = students.filter(s => {
    const hasSubject = !!s.subjects[selectedSubject];
    const matchesSearch = s.name.toLowerCase().includes(filterText.toLowerCase()) || s.id.toLowerCase().includes(filterText.toLowerCase());
    return hasSubject && matchesSearch;
  });

  const getStats = () => {
    if (filteredStudents.length === 0) return { avg: 0, max: 0, min: 0 };
    const scores = filteredStudents.map(s => {
      const sub = s.subjects[selectedSubject]!;
      return sub.status === 'Normal' ? calculateTotalScore(sub.scores) : 0;
    }).filter(s => s > 0);
    if (scores.length === 0) return { avg: 0, max: 0, min: 0 };
    return {
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      max: Math.max(...scores),
      min: Math.min(...scores)
    };
  };

  const stats = getStats();

  const handleInlineUpdate = async (studentId: string, type: 'assignment' | 'midterm' | 'final' | 'status', value: string, index?: number) => {
    let numVal = Number(value);
    const statusVal = value as SpecialStatus;
    if (type === 'assignment') { numVal = Math.min(10, Math.max(0, numVal)); }
    else if (type === 'midterm' || type === 'final') { numVal = Math.min(20, Math.max(0, numVal)); }

    let rightsToUpdate: number | null = null;
    setStudents(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        const newS = JSON.parse(JSON.stringify(s)); 
        const sub = newS.subjects[selectedSubject];
        if (!sub) return s;
        if (type === 'assignment' && typeof index === 'number') sub.scores.assignments[index] = numVal;
        else if (type === 'midterm') sub.scores.midterm = numVal;
        else if (type === 'final') sub.scores.final = numVal;
        else if (type === 'status') sub.status = statusVal;
        if (sub.status === 'Normal') {
            const newTotal = calculateTotalScore(sub.scores);
            const maxRewards = calculateMaxRewards(newTotal);
            const newBalance = Math.max(0, maxRewards - (sub.redeemedCount || 0));
            if (sub.rewardRights !== newBalance) { sub.rewardRights = newBalance; rightsToUpdate = newBalance; }
        }
        return newS;
    }));
    await SheetService.updateStudentScore(studentId, selectedSubject, (type === 'assignment' ? 'assignments' : type) as any, (type === 'status' ? statusVal : numVal), index);
    if (rightsToUpdate !== null) await SheetService.updateStudentScore(studentId, selectedSubject, 'rewardRights', rightsToUpdate);
  };

  const handleRightsUpdate = async (val: string) => {
     if(!editingStudent) return;
     const num = Number(val);
     setStudents(prev => prev.map(s => {
        if (s.id === editingStudent.id && s.subjects[selectedSubject]) s.subjects[selectedSubject]!.rewardRights = num;
        return s;
     }));
     setEditingStudent(prev => {
         if(!prev || !prev.subjects[selectedSubject]) return prev;
         prev.subjects[selectedSubject]!.rewardRights = num;
         return { ...prev };
     });
     await SheetService.updateStudentScore(editingStudent.id, selectedSubject, 'rewardRights', num);
  };

  const chartData = filteredStudents.map(s => ({
      name: s.name.split(' ')[0],
      score: s.subjects[selectedSubject]!.status === 'Normal' ? calculateTotalScore(s.subjects[selectedSubject]!.scores) : 0,
  }));

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fadeIn pb-20">
      {/* Teacher Dashboard Header */}
      <div className="bg-[#134e4a]/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent"></div>
        <div className="relative z-10">
           <h1 className="text-3xl font-display font-black text-white flex items-center gap-4 tracking-widest uppercase">
             <Compass className="text-cyan-400" /> Expedition Center
           </h1>
           <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest">Seasonal Control Panel</span>
              <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter border transition-all ${isAutoRefresh ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/30 border-white/10'}`}
              >
                LIVE: {isAutoRefresh ? 'CONNECTED' : 'PAUSED'}
              </button>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto relative z-10">
          <select 
            className="bg-black/40 text-white p-4 rounded-[1.5rem] border border-white/10 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold text-sm"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
          >
            {Object.values(SubjectCode).map(code => (
              <option key={code} value={code} className="bg-slate-900">{SUBJECT_NAMES[code]}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-4 top-4 text-white/20 w-5 h-5" />
            <input 
              type="text" placeholder="Find traveler..." 
              className="bg-black/40 text-white pl-12 p-4 rounded-[1.5rem] border border-white/10 outline-none w-full focus:ring-2 focus:ring-cyan-500 font-bold"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <button onClick={() => fetchData(false)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-[1.5rem] transition-all shadow-xl active:scale-95 group">
            <RefreshCw size={24} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Group Average', value: stats.avg, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Target },
          { label: 'Peak Performance', value: stats.max, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Sparkles },
          { label: 'Low Threshold', value: stats.min, color: 'text-rose-400', bg: 'bg-rose-500/10', icon: User },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center relative overflow-hidden group shadow-lg`}>
             <stat.icon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">{stat.label}</p>
             <p className={`text-5xl font-display font-black ${stat.color} mt-2`}>{stat.value}</p>
          </div>
        ))}
        <div className="bg-black/20 p-6 rounded-[2.5rem] h-32 border border-white/5 flex items-center shadow-inner">
           <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <Bar dataKey="score">
                      {chartData.map((e, i) => (
                        <Cell key={i} fill={e.score >= 80 ? '#34d399' : '#0ea5e9'} fillOpacity={0.6} />
                      ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white/5 rounded-[3rem] overflow-hidden overflow-x-auto border border-white/5 shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-black/60 text-white/30 text-[9px] uppercase font-black tracking-widest">
              <th className="p-6 text-center">Pos</th>
              <th className="p-6 text-center">Rank</th>
              <th className="p-6">Traveler ID</th>
              <th className="p-6">Name</th>
              {[1, 2, 3, 4, 5, 6].map(i => <th key={i} className="p-2 text-center bg-emerald-900/10 text-emerald-400/80">A{i}</th>)}
              <th className="p-6 text-center bg-rose-900/10 text-rose-400/80">Mid</th>
              <th className="p-6 text-center bg-rose-900/10 text-rose-400/80">Fin</th>
              <th className="p-6 text-center text-white font-black bg-white/5">Score</th>
              <th className="p-6 text-center text-cyan-400 bg-white/5">Grade</th>
              <th className="p-6 text-center text-amber-500 bg-amber-900/10">Harvest</th>
              <th className="p-6 text-center">Status</th>
              <th className="p-6 text-center">Gift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-display">
            {loading ? (
              <tr><td colSpan={19} className="p-32 text-center font-festive text-3xl text-white/10 animate-pulse tracking-widest">Nurturing Data...</td></tr>
            ) : filteredStudents.map((student, index) => {
              const sub = student.subjects[selectedSubject]!;
              const total = calculateTotalScore(sub.scores);
              const max = calculateMaxRewards(total);
              const calculatedRights = Math.max(0, max - (sub.redeemedCount || 0));
              return (
                <tr key={student.id} className="hover:bg-cyan-500/5 transition-all group border-b border-white/5">
                  <td className="p-5 text-center text-xs text-white/20 font-mono">{index + 1}</td>
                  <td className="p-2 text-center"><div className="w-12 h-12 mx-auto hover:scale-125 transition-transform"><RankBadge rank={calculateRank(total, sub.status)} size="sm" showLabel={false} /></div></td>
                  <td className="p-5 font-mono text-xs text-cyan-400/60 font-bold">{student.id}</td>
                  <td className="p-5 text-sm font-black text-white tracking-wide">{student.name}</td>
                  {sub.scores.assignments.map((score, idx) => (
                      <td key={idx} className="p-1 border-x border-white/5 bg-emerald-900/5">
                          <input 
                              type="number" className="w-full bg-transparent text-center font-mono text-sm focus:bg-emerald-500/20 outline-none text-emerald-100 font-bold py-2"
                              value={score} onChange={(e) => handleInlineUpdate(student.id, 'assignment', e.target.value, idx)}
                          />
                      </td>
                  ))}
                  <td className="p-1 border-x border-white/5 bg-rose-900/5">
                      <input type="number" className="w-full bg-transparent text-center font-mono text-sm text-rose-300 font-bold py-2" value={sub.scores.midterm} onChange={(e) => handleInlineUpdate(student.id, 'midterm', e.target.value)}/>
                  </td>
                  <td className="p-1 border-x border-white/5 bg-rose-900/5">
                      <input type="number" className="w-full bg-transparent text-center font-mono text-sm text-rose-300 font-bold py-2" value={sub.scores.final} onChange={(e) => handleInlineUpdate(student.id, 'final', e.target.value)}/>
                  </td>
                  <td className="p-5 text-center font-black text-white text-xl">{sub.status === 'Normal' ? total : '-'}</td>
                  <td className="p-5 text-center font-black text-cyan-400 text-xl">{calculateGrade(total, sub.status)}</td>
                  <td className="p-5 text-center font-black text-2xl text-amber-500 bg-amber-900/5">{calculatedRights}</td>
                  <td className="p-2 text-center">
                    <select className="bg-black/60 text-[10px] border border-white/10 rounded-xl px-2 py-1.5 font-black tracking-widest text-emerald-400" value={sub.status} onChange={(e) => handleInlineUpdate(student.id, 'status', e.target.value)}>
                        <option value="Normal">NORMAL</option>
                        <option value="ร">RE (ร)</option>
                        <option value="มส.">NA (มส.)</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => setEditingStudent(student)} className="text-white/20 hover:text-amber-400 transition-colors p-3 bg-white/5 rounded-2xl"><Trophy size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reward Editor Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#134e4a] border border-white/10 rounded-[4rem] w-full max-w-md overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.2)] animate-fadeIn">
            <div className="p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Trophy size={56} className="text-amber-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-display font-black text-white uppercase tracking-widest">{editingStudent.name}</h2>
                    <p className="text-cyan-400/40 text-xs font-bold mt-1 uppercase tracking-widest">Reward Adjustment</p>
                </div>
                <div className="bg-black/40 p-10 rounded-[3rem] border border-white/5">
                    <p className="text-[10px] uppercase text-white/30 font-black tracking-[0.4em] mb-4">Current Harvest Balance</p>
                    <div className="flex items-center justify-center gap-8">
                        <button className="w-16 h-16 rounded-3xl bg-rose-900/30 text-rose-500 text-3xl font-black shadow-lg hover:scale-110 active:scale-95 transition-all" onClick={() => handleRightsUpdate(String((editingStudent.subjects[selectedSubject]?.rewardRights || 0) - 1))}>-</button>
                        <span className="text-7xl font-display font-black text-amber-400">{editingStudent.subjects[selectedSubject]?.rewardRights || 0}</span>
                        <button className="w-16 h-16 rounded-3xl bg-emerald-900/30 text-emerald-500 text-3xl font-black shadow-lg hover:scale-110 active:scale-95 transition-all" onClick={() => handleRightsUpdate(String((editingStudent.subjects[selectedSubject]?.rewardRights || 0) + 1))}>+</button>
                    </div>
                </div>
                <button onClick={() => setEditingStudent(null)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-700 text-white py-5 rounded-3xl font-game font-black uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">Update Mission</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};