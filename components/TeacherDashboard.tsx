import React, { useState, useEffect } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES, SpecialStatus } from '../types';
import { SheetService } from '../services/sheetService';
import { calculateTotalScore, calculateGrade, calculateRank, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, X, Search, Trophy, User, Filter, Save, Activity } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode>(SubjectCode.M1_HISTORY);
  const [filterText, setFilterText] = useState('');
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchData = async () => {
    // Only set loading true on first load to prevent flickering on poll
    if(students.length === 0) setLoading(true);
    
    const data = await SheetService.getAllStudents();
    
    // Merge Strategy: If we are editing, we don't want to overwrite active inputs.
    // However, for this requirements ("Real-time updates"), we assume 'Read-heavy' dashboard.
    // We will update state. The input fields in the table use values from state.
    // React's reconciliation usually preserves focus if keys match, but typing might jitter.
    // For now, we update the whole list to ensure 'Redeemed' counts are live.
    setStudents(data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Real-time Polling every 5 seconds to check for new Redemptions
    const interval = setInterval(() => {
        // Only fetch if not currently editing a specific modal to avoid state jumps
        // Actually, let's fetch always to show live data in the table
        fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter Logic
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
    });
    const validScores = scores.filter(s => s > 0); 
    if (validScores.length === 0) return { avg: 0, max: 0, min: 0 };

    return {
      avg: (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1),
      max: Math.max(...validScores),
      min: Math.min(...validScores)
    };
  };

  const stats = getStats();

  const handleInlineUpdate = async (studentId: string, type: 'assignment' | 'midterm' | 'final' | 'status', value: string, index?: number) => {
    let numVal = Number(value);
    const statusVal = value as SpecialStatus;

    // Strict Validation
    if (type === 'assignment') {
        if (numVal > 10) numVal = 10;
        if (numVal < 0) numVal = 0;
    } else if (type === 'midterm' || type === 'final') {
        if (numVal > 20) numVal = 20;
        if (numVal < 0) numVal = 0;
    }

    // Variable to track if we need to update rights
    let rightsToUpdate: number | null = null;

    setStudents(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        const newS = JSON.parse(JSON.stringify(s)); 
        const sub = newS.subjects[selectedSubject];
        if (!sub) return s;

        // 1. Update the Score/Status Locally
        if (type === 'assignment' && typeof index === 'number') {
            sub.scores.assignments[index] = numVal;
        } else if (type === 'midterm') {
            sub.scores.midterm = numVal;
        } else if (type === 'final') {
            sub.scores.final = numVal;
        } else if (type === 'status') {
            sub.status = statusVal;
        }

        // 2. Auto-Calculate Reward Rights (Automatic System)
        // Logic: Balance = MaxAllowed(based on Score) - Redeemed(History)
        if (sub.status === 'Normal') {
            // Recalculate based on the updated scores immediately
            const newTotal = calculateTotalScore(sub.scores);
            const maxRewards = calculateMaxRewards(newTotal);
            const currentRedeemed = sub.redeemedCount || 0;
            
            // Calculate what the balance SHOULD be
            const newBalance = Math.max(0, maxRewards - currentRedeemed);
            
            // Update local state if different
            if (sub.rewardRights !== newBalance) {
                sub.rewardRights = newBalance;
                rightsToUpdate = newBalance;
            }
        }

        return newS;
    }));

    // 3. Sync to Backend
    // First, save the score change
    const apiField = type === 'assignment' ? 'assignments' : type;
    const valToSend = type === 'status' ? statusVal : numVal;
    await SheetService.updateStudentScore(studentId, selectedSubject, apiField as any, valToSend, index);

    // Second, if rights were recalculated, save the new balance to Sheet (Column L)
    // This ensures that when a student views their dashboard, they see the rights derived from the latest score
    if (rightsToUpdate !== null) {
        await SheetService.updateStudentScore(studentId, selectedSubject, 'rewardRights', rightsToUpdate);
    }
  };

  const handleRightsUpdate = async (val: string) => {
     if(!editingStudent) return;
     const num = Number(val);
     setStudents(prev => prev.map(s => {
        if (s.id !== editingStudent.id) return s;
        const newS = { ...s };
        if(newS.subjects[selectedSubject]) {
             newS.subjects[selectedSubject]!.rewardRights = num;
        }
        return newS;
     }));
     setEditingStudent(prev => {
         if(!prev) return null;
         const newS = { ...prev };
         if(newS.subjects[selectedSubject]) {
            newS.subjects[selectedSubject]!.rewardRights = num;
         }
         return newS;
     });
     await SheetService.updateStudentScore(editingStudent.id, selectedSubject, 'rewardRights', num);
  };

  const chartData = filteredStudents.map(s => {
      const sub = s.subjects[selectedSubject]!;
      return {
          name: s.name.split(' ')[0],
          score: sub.status === 'Normal' ? calculateTotalScore(sub.scores) : 0,
      }
  });


  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Header Controls */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-game-gold/20 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-game-gold to-orange-500"></div>
        
        <div>
           <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
             <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-game-gold shadow-inner border border-slate-600">
               <User />
             </div>
             ศูนย์ควบคุม (COMMAND CENTER)
           </h1>
           <p className="text-slate-400 text-sm mt-1 ml-14 flex items-center gap-2">
              จัดการคะแนนและสิทธิ์ของนักเรียน 
              <span className="flex items-center gap-1 bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full text-[10px] border border-green-800 animate-pulse">
                <Activity size={10} /> LIVE
              </span>
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto bg-slate-900/50 p-2 rounded-xl border border-slate-700">
          <select 
            className="bg-slate-800 text-white p-3 rounded-lg border border-slate-600 outline-none focus:ring-1 focus:ring-game-gold cursor-pointer hover:bg-slate-700 transition-colors"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
          >
            {Object.values(SubjectCode).map(code => (
              <option key={code} value={code}>{SUBJECT_NAMES[code]}</option>
            ))}
          </select>
          
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="ค้นหารหัสหรือชื่อ..." 
              className="bg-slate-800 text-white pl-10 p-3 rounded-lg border border-slate-600 outline-none w-full focus:ring-1 focus:ring-game-gold transition-all"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          
          <button onClick={fetchData} className="bg-game-blue hover:bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'คะแนนเฉลี่ย', value: stats.avg, color: 'text-game-gold', border: 'border-game-gold' },
          { label: 'คะแนนสูงสุด', value: stats.max, color: 'text-game-diamond', border: 'border-game-diamond' },
          { label: 'คะแนนต่ำสุด', value: stats.min, color: 'text-game-red', border: 'border-game-red' },
        ].map((stat, idx) => (
          <div key={idx} className={`glass-panel p-5 rounded-2xl border-l-4 ${stat.border} relative overflow-hidden`}>
             <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6"></div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
             <p className={`text-4xl font-mono font-bold ${stat.color} mt-2 drop-shadow-sm`}>{stat.value}</p>
          </div>
        ))}
        
        <div className="glass-panel p-4 rounded-2xl h-32 relative group">
           <p className="absolute top-2 left-4 text-[10px] text-slate-500 uppercase font-bold z-10">การกระจายคะแนน</p>
           <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#fbbf24' : '#3b82f6'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Main Scoring Table */}
      <div className="glass-panel rounded-2xl overflow-hidden overflow-x-auto shadow-2xl border border-white/5">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-bold">
              <th className="p-4 w-12 text-center text-slate-600">#</th>
              <th className="p-4 w-16 text-center text-slate-500">แรงค์</th>
              <th className="p-4 w-24">รหัสนักเรียน</th>
              <th className="p-4 min-w-[180px]">ชื่อ-สกุล</th>
              <th className="p-0" colSpan={6}>
                 <div className="flex">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex-1 p-2 text-center border-l border-slate-800 text-game-gold bg-slate-900/50">
                            A{i} <span className="block text-[8px] opacity-50">/10</span>
                        </div>
                    ))}
                 </div>
              </th>
              <th className="p-2 text-center w-20 bg-slate-900/30 border-l border-slate-800 text-game-blue">กลาง <span className="block text-[8px] opacity-50">/20</span></th>
              <th className="p-2 text-center w-20 bg-slate-900/30 border-r border-slate-800 text-game-purple">ปลาย <span className="block text-[8px] opacity-50">/20</span></th>
              <th className="p-4 text-center w-20 font-bold text-white bg-slate-900/80">รวม</th>
              <th className="p-4 text-center w-20 bg-slate-900/80">เกรด</th>
              <th className="p-4 text-center w-24">สถานะ</th>
              <th className="p-4 text-center w-16">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={17} className="p-12 text-center text-slate-500 animate-pulse">กำลังโหลดข้อมูลจากระบบ...</td></tr>
            ) : filteredStudents.map((student, index) => {
              const sub = student.subjects[selectedSubject]!;
              const total = calculateTotalScore(sub.scores);
              const rank = calculateRank(total, sub.status);
              
              return (
                <tr key={student.id} className="hover:bg-white/5 transition-colors text-slate-300 group">
                  {/* Index */}
                  <td className="p-4 text-center text-xs text-slate-600 font-mono">{index + 1}</td>

                  {/* Rank */}
                  <td className="p-2 text-center">
                     <div className="w-8 h-8 mx-auto transform transition-transform group-hover:scale-110"><RankBadge rank={rank} size="sm" showLabel={false} /></div>
                  </td>
                  
                  {/* Info */}
                  <td className="p-4 font-mono text-xs text-game-cyan">{student.id}</td>
                  <td className="p-4 text-sm font-medium text-white">{student.name}</td>

                  {/* Assignments 1-6 */}
                  {sub.scores.assignments.map((score, idx) => (
                      <td key={idx} className="p-1 border-l border-slate-800/30 relative">
                          <input 
                              type="number" max={10} min={0}
                              className={`w-full h-full min-h-[40px] bg-transparent text-center text-sm font-mono focus:bg-slate-800 focus:ring-1 focus:ring-game-gold outline-none transition-all ${score === 10 ? 'text-game-gold font-bold' : ''}`}
                              value={score}
                              onChange={(e) => handleInlineUpdate(student.id, 'assignment', e.target.value, idx)}
                          />
                      </td>
                  ))}

                  {/* Exams */}
                  <td className="p-1 border-l border-slate-800/50">
                      <input 
                          type="number" max={20} min={0}
                          className="w-full h-full min-h-[40px] bg-transparent text-center text-sm font-bold text-game-blueLight focus:bg-slate-800 focus:ring-1 focus:ring-game-blue outline-none transition-all"
                          value={sub.scores.midterm}
                          onChange={(e) => handleInlineUpdate(student.id, 'midterm', e.target.value)}
                      />
                  </td>
                  <td className="p-1 border-r border-slate-800/50">
                      <input 
                          type="number" max={20} min={0}
                          className="w-full h-full min-h-[40px] bg-transparent text-center text-sm font-bold text-game-purpleLight focus:bg-slate-800 focus:ring-1 focus:ring-game-purple outline-none transition-all"
                          value={sub.scores.final}
                          onChange={(e) => handleInlineUpdate(student.id, 'final', e.target.value)}
                      />
                  </td>

                  {/* Results */}
                  <td className="p-4 text-center font-bold text-white text-lg bg-slate-900/20">
                      {sub.status === 'Normal' ? total : '-'}
                  </td>
                  <td className={`p-4 text-center font-mono font-bold bg-slate-900/20 ${calculateGrade(total, sub.status) === '4' ? 'text-game-gold' : ''}`}>
                      {calculateGrade(total, sub.status)}
                  </td>
                  
                  {/* Status Dropdown */}
                  <td className="p-2 text-center">
                    <select 
                        className={`bg-transparent text-xs text-center border rounded px-1 py-1 outline-none cursor-pointer w-full font-bold ${
                            sub.status === 'Normal' ? 'border-slate-700 text-slate-500' : 'border-red-500 bg-red-900/20 text-red-400'
                        }`}
                        value={sub.status}
                        onChange={(e) => handleInlineUpdate(student.id, 'status', e.target.value)}
                    >
                        <option value="Normal">OK</option>
                        <option value="ร">ร</option>
                        <option value="มส.">มส.</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => setEditingStudent(student)}
                      className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-game-gold transition-all"
                      title="Manage Rewards"
                    >
                      <Trophy size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rewards Management Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
              <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy size={20} className="text-game-gold"/> 
                    จัดการรางวัล
                 </h2>
                 <p className="text-slate-400 text-sm">{editingStudent.name}</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="flex items-center justify-between bg-slate-950/80 p-6 rounded-xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-game-gold"></div>
                    <div>
                        <p className="text-sm text-game-gold font-bold uppercase tracking-wider mb-1">สิทธิ์คงเหลือ</p>
                        <p className="text-xs text-slate-500">ยอดคงเหลือปัจจุบัน</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button 
                            className="w-8 h-8 rounded bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-white flex items-center justify-center transition-colors font-bold"
                            onClick={() => handleRightsUpdate(String((editingStudent.subjects[selectedSubject]?.rewardRights || 0) - 1))}
                        >
                            -
                        </button>
                        <input 
                            type="number" 
                            className="w-12 bg-transparent text-center text-white font-mono font-bold text-lg outline-none"
                            value={editingStudent.subjects[selectedSubject]?.rewardRights || 0}
                            onChange={(e) => handleRightsUpdate(e.target.value)}
                        />
                         <button 
                            className="w-8 h-8 rounded bg-slate-800 hover:bg-green-500/20 hover:text-green-400 text-white flex items-center justify-center transition-colors font-bold"
                            onClick={() => handleRightsUpdate(String((editingStudent.subjects[selectedSubject]?.rewardRights || 0) + 1))}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/30 p-4 rounded-xl text-center border border-dashed border-slate-700">
                    <p className="text-xs text-slate-500 uppercase">ประวัติการแลกทั้งหมด</p>
                    <p className="text-2xl font-mono text-white font-bold mt-1 animate-pulse">{editingStudent.subjects[selectedSubject]?.redeemedCount || 0}</p>
                </div>
                
                <p className="text-center text-xs text-slate-600 italic">
                  * สิทธิ์ถูกคำนวณอัตโนมัติจากแรงค์ แก้ไขเฉพาะกรณีจำเป็นเท่านั้น
                </p>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end bg-slate-900">
                <button onClick={() => setEditingStudent(null)} className="bg-white text-slate-900 hover:bg-slate-200 px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                    เสร็จสิ้น
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};