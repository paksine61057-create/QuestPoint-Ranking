import React, { useState, useEffect } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES } from '../types';
import { calculateTotalScore, calculateGrade, calculateRank, getRankColor, getNextRankInfo, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { SheetService } from '../services/sheetService';
import { Gift, BookOpen, Star, Zap, TrendingUp, CheckCircle, Lock, AlertCircle } from 'lucide-react';

interface Props {
  student: Student;
  onRefresh: () => void;
}

export const StudentView: React.FC<Props> = ({ student, onRefresh }) => {
  const enrolledSubjects = (Object.keys(student.subjects) as SubjectCode[]);
  // Auto-select the first subject if available
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode | ''>(
    enrolledSubjects.length > 0 ? enrolledSubjects[0] : ''
  );
  const [redeeming, setRedeeming] = useState(false);

  // If student data updates (e.g. switching users), reset selection to first subject
  useEffect(() => {
    if (enrolledSubjects.length > 0 && !enrolledSubjects.includes(selectedSubject as SubjectCode)) {
      setSelectedSubject(enrolledSubjects[0]);
    }
  }, [student]);

  const handleRedeem = async (subject: SubjectCode) => {
    if (!window.confirm('ยืนยันการใช้สิทธิ์? สิทธิ์ของคุณจะลดลง 1 แต้ม')) return;
    setRedeeming(true);
    
    // Call API to deduct right and increment redeemed count in Sheet
    const success = await SheetService.redeemReward(student.id, subject);
    
    if (success) {
      // Simulate delay for effect then refresh data from sheet to show new balance
      setTimeout(() => {
        alert('🎉 ใช้สิทธิ์แลกรางวัลสำเร็จ! (Redeem Success)');
        onRefresh(); // Critical: Fetch new balance from Sheet
        setRedeeming(false);
      }, 800);
    } else {
      alert('⚠️ ไม่สามารถแลกรางวัลได้\n\nระบบตรวจพบว่าข้อมูลคะแนนในฐานข้อมูลยังไม่อัปเดต หรือสิทธิ์ไม่เพียงพอ\n\n👉 กรุณาแจ้งอาจารย์ประจำวิชาให้กด "บันทึก" คะแนนเพื่ออัปเดตสิทธิ์ล่าสุด');
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Header Panel */}
      <header className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-game-cyan/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-game-purple/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-game-blueLight text-sm font-bold tracking-[0.2em] uppercase mb-1">Student Dashboard</h2>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-wide drop-shadow-lg">
            WELCOME, <span className="text-transparent bg-clip-text bg-gradient-to-r from-game-gold via-yellow-200 to-yellow-500">{student.name}</span>
          </h1>
          <div className="mt-3 flex items-center justify-center md:justify-start gap-3">
             <span className="bg-slate-800/80 px-3 py-1 rounded text-slate-300 text-xs font-mono border border-slate-700">ID: {student.id}</span>
             <span className="bg-slate-800/80 px-3 py-1 rounded text-game-cyan text-xs font-mono border border-slate-700 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-game-cyan animate-pulse"></div> Online
             </span>
          </div>
        </div>
        
        <div className="relative z-10 w-full md:w-auto">
           <label className="block text-slate-400 text-xs uppercase mb-2 ml-1 font-bold">Select Mission Subject</label>
           <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 text-game-gold w-5 h-5" />
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
                className="appearance-none bg-slate-900/80 backdrop-blur-md border border-slate-600 text-white rounded-xl pl-12 pr-12 py-3 w-full md:w-80 focus:ring-2 focus:ring-game-gold focus:border-game-gold shadow-lg outline-none cursor-pointer hover:bg-slate-800 transition-colors font-medium"
              >
                <option value="">-- Choose Subject --</option>
                {enrolledSubjects.map(sub => (
                  <option key={sub} value={sub}>{SUBJECT_NAMES[sub]}</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-400 pointer-events-none"></div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      {selectedSubject && student.subjects[selectedSubject] ? (
        (() => {
          const data = student.subjects[selectedSubject]!;
          const totalScore = calculateTotalScore(data.scores);
          const grade = calculateGrade(totalScore, data.status);
          const rank = calculateRank(totalScore, data.status);
          const rankColor = getRankColor(rank);
          
          const nextRankData = getNextRankInfo(totalScore);
          const maxRewards = calculateMaxRewards(totalScore);
          const redeemed = data.redeemedCount || 0;
          
          // Use stored rewardRights directly from Sheet as Primary Truth
          // Fallback to calculation only if data looks completely desynced (e.g. rights > max)
          let rightsBalance = data.rewardRights;
          
          // Safety: If Teacher hasn't synced yet, we can show a calculated prediction
          // But to strictly follow "record remaining rights to sheets", we prioritize the sheet value `data.rewardRights`
          // calculatedAvailable is used just to check consistency
          const calculatedAvailable = Math.max(0, maxRewards - redeemed);

          // Progress Calculation (Current tier logic)
          const currentRankThreshold = nextRankData.threshold - nextRankData.pointsNeeded - (totalScore - (nextRankData.threshold - nextRankData.pointsNeeded)); 
          const progressPercent = Math.min((totalScore / nextRankData.threshold) * 100, 100);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COL: Rank Card */}
              <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group border border-white/5 hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] h-fit">
                {/* Dynamic Background Gradient */}
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${rankColor} transition-opacity duration-500 group-hover:opacity-30`}></div>
                
                {/* Rotating Shine Effect behind badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-shine opacity-50"></div>

                <div className="relative z-10 mt-4 scale-110">
                   <RankBadge rank={rank} size="xl" />
                </div>
                
                <div className="mt-8 relative z-10 w-full">
                  <div className="inline-block bg-black/30 backdrop-blur px-4 py-1 rounded-full border border-white/10 mb-2">
                     <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Current Rank</p>
                  </div>
                  <p className={`text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b ${rankColor.replace('text-', 'from-').replace(' ', ' to-white ')} drop-shadow-md`}>
                    {rank}
                  </p>
                  
                  {/* XP Progress Bar to Next Level */}
                  <div className="mt-6 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    {nextRankData.nextRank ? (
                      <>
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
                             <TrendingUp size={12} className="text-game-gold" /> To {nextRankData.nextRank}
                           </span>
                           <span className="text-sm font-mono font-bold text-white">
                             <span className="text-game-gold">{nextRankData.pointsNeeded}</span> PTS NEEDED
                           </span>
                        </div>
                        {/* Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                           {/* Total Progress */}
                           <div 
                              className={`h-full bg-gradient-to-r ${rankColor} absolute left-0 top-0 transition-all duration-1000`}
                              style={{ width: `${progressPercent}%`, opacity: 0.5 }}
                           ></div>
                           <div 
                              className={`h-full bg-gradient-to-r ${rankColor} absolute left-0 top-0 transition-all duration-1000 blur-[2px]`}
                              style={{ width: `${progressPercent}%` }}
                           ></div>
                        </div>
                         <div className="flex justify-between mt-1 text-[10px] text-slate-600 font-mono">
                            <span>0</span>
                            <span>{nextRankData.threshold} PTS</span>
                         </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-game-gold font-bold">
                         <Star className="fill-current animate-pulse" size={16} />
                         MAX RANK ACHIEVED
                         <Star className="fill-current animate-pulse" size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COL: Stats & Data */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Total Score & Grade Big Display */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-game-blue relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-game-blue/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-game-blue/20"></div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider relative z-10">Total Score</p>
                        <p className="text-5xl font-mono font-bold text-white mt-2 relative z-10 text-glow">
                             {data.status === 'Normal' ? totalScore : <span className="text-red-400">{data.status}</span>}
                             <span className="text-lg text-slate-500 font-sans ml-2">/ 100</span>
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-game-purple relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-game-purple/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-game-purple/20"></div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider relative z-10">Grade</p>
                        <p className="text-5xl font-mono font-bold text-game-purpleLight mt-2 relative z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                             {grade}
                        </p>
                    </div>
                </div>

                {/* Reward Zone (Moved Up for better visibility) */}
                <div className="relative group animate-slideIn">
                    <div className={`absolute inset-0 bg-gradient-to-r ${rightsBalance > 0 ? 'from-game-gold via-orange-500 to-yellow-500' : 'from-slate-800 to-slate-700'} rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                    <div className={`glass-panel relative rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 border ${rightsBalance > 0 ? 'border-game-gold/30' : 'border-slate-700'}`}>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform relative overflow-hidden ${rightsBalance > 0 ? 'bg-gradient-to-br from-game-gold to-orange-600' : 'bg-slate-800'}`}>
                                {rightsBalance > 0 && <div className="absolute inset-0 bg-white/20 animate-shine"></div>}
                                {rightsBalance > 0 ? <Gift className="text-slate-900 w-8 h-8 relative z-10" /> : <Lock className="text-slate-500 w-8 h-8" />}
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${rightsBalance > 0 ? 'text-game-gold' : 'text-slate-400'}`}>
                                  REWARD CENTER
                                </h3>
                                <p className="text-slate-400 text-xs sm:text-sm mb-1">Redeem rights for special rewards.</p>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className="bg-slate-900/50 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">Lifetime Earned: {maxRewards}</span>
                                   <span className="bg-slate-900/50 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">Used: {redeemed}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                           <button 
                               onClick={() => handleRedeem(selectedSubject)}
                               disabled={rightsBalance <= 0 || redeeming}
                               className={`w-full sm:w-48 py-4 rounded-xl font-bold font-display tracking-widest text-sm shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden flex items-center justify-center gap-2 ${
                               rightsBalance > 0 
                               ? 'bg-gradient-to-r from-game-gold to-yellow-500 text-slate-900 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer' 
                               : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-70'
                               }`}
                           >
                               {redeeming ? (
                                 <span className="animate-pulse">PROCESSING...</span>
                               ) : (
                                 <>
                                   {rightsBalance > 0 ? 'REDEEM REWARD' : 'NO RIGHTS'}
                                   {rightsBalance > 0 && <Zap size={16} className="fill-slate-900" />}
                                 </>
                               )}
                               {rightsBalance > 0 && <div className="absolute inset-0 bg-white/30 animate-shine pointer-events-none"></div>}
                           </button>
                           
                           {/* Show Realtime Balance from Sheet */}
                           {rightsBalance > 0 ? (
                             <span className="text-xs text-game-gold font-bold animate-pulse flex items-center gap-1">
                               <CheckCircle size={12} /> {rightsBalance} Rights Available
                             </span>
                           ) : (
                             calculatedAvailable > 0 ? (
                                <span className="text-[10px] text-orange-400 font-mono animate-pulse flex items-center gap-1">
                                   <AlertCircle size={10} /> Syncing Score... ({calculatedAvailable} Pending)
                                </span>
                             ) : (
                                <span className="text-[10px] text-slate-600 font-mono">Rank up to earn more rights</span>
                             )
                           )}
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Zap className="text-game-gold" size={20} /> Score Breakdown
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Assignments */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Assignments (6 x 10pts)</span>
                                <span className="text-game-gold font-mono font-bold">{data.scores.assignments.reduce((a,b)=>a+b, 0)}/60</span>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {data.scores.assignments.map((score, i) => (
                                    <div key={i} className="group relative">
                                        <div className={`h-12 flex items-center justify-center rounded-lg border ${score >= 8 ? 'bg-game-blue/20 border-game-blue/50 text-game-blueLight' : 'bg-slate-800/50 border-slate-700 text-slate-400'} font-mono font-bold text-lg transition-all hover:scale-105 hover:bg-game-blue/30`}>
                                            {score}
                                        </div>
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Slot {i+1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                 <span className="text-sm text-slate-400">Midterm Exam</span>
                                 <span className="text-xl font-mono font-bold text-white">{data.scores.midterm}<span className="text-xs text-slate-600">/20</span></span>
                             </div>
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                 <span className="text-sm text-slate-400">Final Exam</span>
                                 <span className="text-xl font-mono font-bold text-white">{data.scores.final}<span className="text-xs text-slate-600">/20</span></span>
                             </div>
                        </div>
                    </div>
                </div>

              </div>
            </div>
          );
        })()
      ) : (
        <div className="glass-panel h-80 flex flex-col items-center justify-center text-slate-500 rounded-3xl border border-dashed border-slate-700">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Star className="text-slate-600" size={32} />
          </div>
          <p className="text-lg font-medium">Select a subject to load your stats</p>
          <p className="text-sm opacity-50">Choose from the dropdown above</p>
        </div>
      )}
    </div>
  );
};