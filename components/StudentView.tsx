import React, { useState, useEffect } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES } from '../types';
import { calculateTotalScore, calculateGrade, calculateRank, getRankColor, getNextRankInfo, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { SheetService } from '../services/sheetService';
import { Gift, BookOpen, Star, Zap, TrendingUp, CheckCircle, Lock, AlertCircle, Coins, History } from 'lucide-react';

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
      <header className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-2xl group">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-game-cyan/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-game-purple/10 blur-[80px] rounded-full pointer-events-none"></div>
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none"></div>

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
          let rightsBalance = data.rewardRights;
          
          // Check calculated availability just for sync warnings
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
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none delay-1000"></div>
                
                {/* Rotating Shine Effect behind badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-shine opacity-50"></div>

                <div className="relative z-10 mt-4 scale-110">
                   <RankBadge rank={rank} size="xl" />
                </div>
                
                <div className="mt-8 relative z-10 w-full">
                  <div className="inline-block bg-black/30 backdrop-blur px-4 py-1 rounded-full border border-white/10 mb-2 shadow-lg">
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
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-game-blue relative overflow-hidden group hover:border-game-blueLight transition-all">
                        {/* Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none delay-[2s]"></div>
                        <div className="absolute right-0 top-0 w-24 h-24 bg-game-blue/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-game-blue/20"></div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider relative z-10">Total Score</p>
                        <p className="text-5xl font-mono font-bold text-white mt-2 relative z-10 text-glow">
                             {data.status === 'Normal' ? totalScore : <span className="text-red-400">{data.status}</span>}
                             <span className="text-lg text-slate-500 font-sans ml-2">/ 100</span>
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-game-purple relative overflow-hidden group hover:border-game-purpleLight transition-all">
                         {/* Shimmer */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none delay-[3s]"></div>
                        <div className="absolute right-0 top-0 w-24 h-24 bg-game-purple/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-game-purple/20"></div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider relative z-10">Grade</p>
                        <p className="text-5xl font-mono font-bold text-game-purpleLight mt-2 relative z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                             {grade}
                        </p>
                    </div>
                </div>

                {/* --- SEPARATE REWARD CARDS ZONE --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideIn">
                    
                    {/* CARD 1: REWARD WALLET / DISPLAY */}
                    <div className={`glass-panel relative rounded-2xl p-6 flex flex-col justify-between border transition-all duration-300 group overflow-hidden ${rightsBalance > 0 ? 'border-game-gold/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-slate-700'}`}>
                         {/* Shimmer */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none delay-[4s]"></div>
                         
                         <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none transition-colors ${rightsBalance > 0 ? 'bg-game-gold' : 'bg-slate-600'}`}></div>
                         
                         <div className="flex items-start justify-between relative z-10">
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Coins size={14} className={rightsBalance > 0 ? 'text-game-gold' : 'text-slate-500'} />
                                    Reward Wallet
                                </h3>
                                <p className="text-slate-500 text-[10px] mt-1">Available rights to use</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${rightsBalance > 0 ? 'bg-game-gold/20 text-game-gold shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'bg-slate-800 text-slate-600'}`}>
                                <Gift size={20} />
                            </div>
                         </div>

                         <div className="mt-4 relative z-10">
                            <div className="flex items-baseline gap-2">
                                <span className={`text-5xl font-mono font-bold transition-all ${rightsBalance > 0 ? 'text-game-gold text-glow-gold' : 'text-slate-600'}`}>
                                    {rightsBalance}
                                </span>
                                <span className="text-sm font-bold text-slate-500 uppercase">Rights</span>
                            </div>
                         </div>

                         <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs relative z-10">
                             <div>
                                 <p className="text-slate-500 flex items-center gap-1"><Star size={10}/> Lifetime</p>
                                 <p className="text-white font-mono font-bold text-sm">{maxRewards}</p>
                             </div>
                             <div>
                                 <p className="text-slate-500 flex items-center gap-1"><History size={10}/> Used</p>
                                 <p className="text-white font-mono font-bold text-sm">{redeemed}</p>
                             </div>
                         </div>
                    </div>

                    {/* CARD 2: ACTION / REDEMPTION GATE */}
                    <div className="glass-panel relative rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-white/5 bg-slate-900/30 overflow-hidden group">
                        {/* Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none delay-[5s]"></div>
                        
                        <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Zap size={16} className="text-game-cyan" /> Redemption Gate
                        </h3>

                        <button 
                            onClick={() => handleRedeem(selectedSubject)}
                            disabled={rightsBalance <= 0 || redeeming}
                            className={`w-full py-4 rounded-xl font-bold font-display tracking-widest text-lg shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden flex items-center justify-center gap-2 group/btn ${
                            rightsBalance > 0 
                            ? 'bg-gradient-to-r from-game-gold to-yellow-500 text-slate-900 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-70'
                            }`}
                        >
                            {redeeming ? (
                                <span className="animate-pulse flex items-center gap-2 text-sm"><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> PROCESSING</span>
                            ) : (
                                <>
                                {rightsBalance > 0 ? 'REDEEM NOW' : 'LOCKED'}
                                {rightsBalance > 0 ? <Zap size={20} className="fill-slate-900" /> : <Lock size={18} />}
                                </>
                            )}
                            {rightsBalance > 0 && <div className="absolute inset-0 bg-white/30 animate-shine pointer-events-none"></div>}
                        </button>

                        <div className="mt-4 h-6">
                           {rightsBalance > 0 ? (
                                <span className="text-[10px] text-game-gold font-bold flex items-center justify-center gap-1 animate-pulse">
                                  <CheckCircle size={10} /> Ready to redeem (Cost: 1 Right)
                                </span>
                           ) : (
                                calculatedAvailable > 0 ? (
                                    <span className="text-[10px] text-orange-400 font-mono flex items-center justify-center gap-1 animate-pulse">
                                        <AlertCircle size={10} /> Waiting for Teacher Sync...
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-600 font-mono">Insufficient rights to redeem</span>
                                )
                           )}
                        </div>
                    </div>

                </div>

                {/* Detailed Breakdown */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                    {/* Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none delay-[1.5s]"></div>

                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 relative z-10">
                        <BookOpen className="text-game-blue" size={20} /> Score Breakdown
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        {/* Assignments */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Assignments (6 x 10pts)</span>
                                <span className="text-game-gold font-mono font-bold">{data.scores.assignments.reduce((a,b)=>a+b, 0)}/60</span>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {data.scores.assignments.map((score, i) => (
                                    <div key={i} className="group/item relative">
                                        <div className={`h-12 flex items-center justify-center rounded-lg border ${score >= 8 ? 'bg-game-blue/20 border-game-blue/50 text-game-blueLight shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-slate-800/50 border-slate-700 text-slate-400'} font-mono font-bold text-lg transition-all hover:scale-105 hover:bg-game-blue/30`}>
                                            {score}
                                        </div>
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">
                                            Slot {i+1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center transition-colors hover:border-game-blue/30">
                                 <span className="text-sm text-slate-400">Midterm Exam</span>
                                 <span className="text-xl font-mono font-bold text-white">{data.scores.midterm}<span className="text-xs text-slate-600">/20</span></span>
                             </div>
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center transition-colors hover:border-game-purple/30">
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