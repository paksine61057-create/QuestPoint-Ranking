import React, { useState, useEffect, useRef } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES, SpecialStatus } from '../types';
import { SheetService } from '../services/sheetService';
import { calculateTotalScore, calculateGrade, calculateRank, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, X, Search, Trophy, User, Gift, Activity, Star } from 'lucide-react';

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
      {/* Teacher Navbar */}
      <div className="bg-game-panel/80 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
        <div>
           <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
             <Trophy className="text-yellow-400" /> MISSION CONTROL
           </h1>
           <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase font-bold text-red-400">Festive Teacher Mode</span>
              <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isAutoRefresh ? 'bg-green-500/20 text-green-400 border-green-500 animate-pulse' : 'bg-white/5 text-white/30 border-white/10'}`}
              >
                LIVE: {isAutoRefresh ? 'ON' : 'OFF'}
              </button>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <select 
            className="bg-black/40 text-white p-3 rounded-2xl border border-white/10 outline-none focus:ring-1 focus:ring-red-500 transition-all"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
          >
            {Object.values(SubjectCode).map(code => (
              <option key={code} value={code} className="bg-slate-900">{SUBJECT_NAMES[code]}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-white/30 w-4 h-4" />
            <input 
              type="text" placeholder="Search students..." 
              className="bg-black/40 text-white pl-12 p-3 rounded-2xl border border-white/10 outline-none w-full focus:ring-1 focus:ring-red-500"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <button onClick={() => fetchData(false)} className="bg-red-700 hover:bg-red-600 text-white p-3 rounded-2xl transition-all shadow-lg active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg Score', value: stats.avg, color: 'text-yellow-400', bg: 'bg-yellow-400/5' },
          { label: 'Max Score', value: stats.max, color: 'text-green-400', bg: 'bg-green-400/5' },
          { label: 'Min Score', value: stats.min, color: 'text-red-400', bg: 'bg-red-400/5' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} p-6 rounded-3xl border border-white/5 flex flex-col justify-center`}>
             <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
             <p className={`text-4xl font-mono font-bold ${stat.color} mt-2`}>{stat.value}</p>
          </div>
        ))}
        <div className="bg-white/5 p-4 rounded-3xl h-28">
           <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <Bar dataKey="score">
                      {chartData.map((e, i) => (
                        <Cell key={i} fill={e.score >= 80 ? '#facc15' : '#ef4444'} fillOpacity={0.5} />
                      ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-game-panel/40 rounded-[2.5rem] overflow-hidden overflow-x-auto border border-white/5 shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-black/40 text-white/40 text-[10px] uppercase font-bold tracking-tighter">
              <th className="p-5 text-center">No.</th>
              <th className="p-5 text-center">Rank</th>
              <th className="p-5">ID</th>
              <th className="p-5">Student Name</th>
              {[1, 2, 3, 4, 5, 6].map(i => <th key={i} className="p-2 text-center bg-green-900/10 text-green-400 border-x border-white/5">A{i}</th>)}
              <th className="p-5 text-center bg-red-900/10 text-red-400 border-x border-white/5">Mid</th>
              <th className="p-5 text-center bg-red-900/10 text-red-400 border-x border-white/5">Fin</th>
              <th className="p-5 text-center text-white font-black bg-white/5">Total</th>
              <th className="p-5 text-center text-yellow-400 bg-white/5">Grade</th>
              <th className="p-5 text-center text-yellow-500 bg-yellow-900/10">Rights</th>
              <th className="p-5 text-center">Status</th>
              <th className="p-5 text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={19} className="p-20 text-center font-festive text-2xl text-white/20 animate-pulse">Merry Christmas... Loading Data</td></tr>
            ) : filteredStudents.map((student, index) => {
              const sub = student.subjects[selectedSubject]!;
              const total = calculateTotalScore(sub.scores);
              const max = calculateMaxRewards(total);
              const calculatedRights = Math.max(0, max - (sub.redeemedCount || 0));
              return (
                <tr key={student.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-4 text-center text-xs text-white/20 font-mono">{index + 1}</td>
                  <td className="p-2 text-center"><div className="w-10 h-10 mx-auto"><RankBadge rank={calculateRank(total, sub.status)} size="sm" showLabel={false} /></div></td>
                  <td className="p-4 font-mono text-xs text-green-400">{student.id}</td>
                  <td className="p-4 text-sm font-bold text-white">{student.name}</td>
                  {sub.scores.assignments.map((score, idx) => (
                      <td key={idx} className="p-1 border-x border-white/5">
                          <input 
                              type="number" className="w-full bg-transparent text-center font-mono text-sm focus:bg-white/10 outline-none"
                              value={score} onChange={(e) => handleInlineUpdate(student.id, 'assignment', e.target.value, idx)}
                          />
                      </td>
                  ))}
                  <td className="p-1 border-x border-white/5">
                      <input type="number" className="w-full bg-transparent text-center font-mono text-sm text-red-400" value={sub.scores.midterm} onChange={(e) => handleInlineUpdate(student.id, 'midterm', e.target.value)}/>
                  </td>
                  <td className="p-1 border-x border-white/5">
                      <input type="number" className="w-full bg-transparent text-center font-mono text-sm text-red-400" value={sub.scores.final} onChange={(e) => handleInlineUpdate(student.id, 'final', e.target.value)}/>
                  </td>
                  <td className="p-4 text-center font-black text-white text-lg">{sub.status === 'Normal' ? total : '-'}</td>
                  <td className="p-4 text-center font-mono font-bold text-yellow-400">{calculateGrade(total, sub.status)}</td>
                  <td className="p-4 text-center font-bold text-xl text-yellow-500 bg-yellow-900/5">{calculatedRights}</td>
                  <td className="p-2 text-center">
                    <select className="bg-black/30 text-[10px] border border-white/10 rounded px-1 py-1" value={sub.status} onChange={(e) => handleInlineUpdate(student.id, 'status', e.target.value)}>
                        <option value="Normal">NORMAL</option>
                        <option value="ร">ร (RE)</option>
                        <option value="มส.">มส. (NA)</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => setEditingStudent(student)} className="text-white/20 hover:text-yellow-400"><Gift size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reward Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-game-panel border border-white/10 rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            <div className="p-8 text-center space-y-6">
                <Gift size={48} className="mx-auto text-red-500" />
                <h2 className="text-2xl font-bold text-white uppercase">{editingStudent.name}</h2>
                <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                    <p className="text-xs uppercase text-white/40 font-bold mb-2">Available Rights</p>
                    <div className="flex items-center justify-center gap-6">
                        <button className="w-12 h-12 rounded-full bg-red-900/30 text-red-500 text-2xl font-bold" onClick={() => handleRightsUpdate(String((editingStudent.subjects[selectedSubject]?.rewardRights || 0) - 1))}>-</button>
                        <span className="text-5xl font-mono font-bold text-yellow-400">{editingStudent.subjects[selectedSubject]?.rewardRights || 0}</span>
                        <button className="w-12 h-12 rounded-full bg-green-900/30 text-green-500 text-2xl font-bold" onClick={() => handleRightsUpdate(String((editingStudent.subjects[selectedSubject]?.rewardRights || 0) + 1))}>+</button>
                    </div>
                </div>
                <button onClick={() => setEditingStudent(null)} className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};