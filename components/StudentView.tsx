import React, { useState, useEffect } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES } from '../types';
import { calculateTotalScore, calculateGrade, calculateRank, getRankColor, getNextRankInfo, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { SheetService } from '../services/sheetService';
import { Gift, BookOpen, Star, Snowflake, TrendingUp, CheckCircle, Lock, Coins, History, Bell } from 'lucide-react';

interface Props {
  student: Student;
  onRefresh: () => void;
}

export const StudentView: React.FC<Props> = ({ student, onRefresh }) => {
  const enrolledSubjects = (Object.keys(student.subjects) as SubjectCode[]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode | ''>(
    enrolledSubjects.length > 0 ? enrolledSubjects[0] : ''
  );
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (enrolledSubjects.length > 0 && !enrolledSubjects.includes(selectedSubject as SubjectCode)) {
      setSelectedSubject(enrolledSubjects[0]);
    }
  }, [student]);

  const handleRedeem = async (subject: SubjectCode) => {
    if (!window.confirm('ยืนยันการใช้สิทธิ์? สิทธิ์ของคุณจะลดลง 1 แต้ม')) return;
    setRedeeming(true);
    
    const subData = student.subjects[subject]!;
    const totalScore = calculateTotalScore(subData.scores);
    const maxRewards = calculateMaxRewards(totalScore);
    const redeemed = subData.redeemedCount || 0;
    const calculatedAvailable = Math.max(0, maxRewards - redeemed);

    if (subData.rewardRights < calculatedAvailable) {
        await SheetService.updateStudentScore(student.id, subject, 'rewardRights', calculatedAvailable);
    }

    const success = await SheetService.redeemReward(student.id, subject);
    
    if (success) {
      setTimeout(() => {
        alert('🎄 สุขสันต์วันเทศกาล! ใช้สิทธิ์แลกรางวัลสำเร็จ');
        onRefresh();
        setRedeeming(false);
      }, 800);
    } else {
      alert('⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Festive Header */}
      <header className="bg-game-red/40 backdrop-blur-xl p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 text-center md:text-left">
          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
            <Bell size={16} className="text-yellow-400 animate-bounce" />
            <h2 className="text-yellow-200 text-sm font-bold tracking-[0.2em] uppercase font-festive">Happy Holidays</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-wide">
             <span className="text-yellow-400">ยินดีต้อนรับ,</span> {student.name}
          </h1>
          <div className="mt-3 flex items-center justify-center md:justify-start gap-3">
             <span className="bg-black/30 px-3 py-1 rounded text-white/50 text-xs font-mono">Student ID: {student.id}</span>
          </div>
        </div>
        
        <div className="relative z-10 w-full md:w-auto">
           <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 text-yellow-400 w-5 h-5" />
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
                className="appearance-none bg-black/40 border border-white/10 text-white rounded-2xl pl-12 pr-12 py-3 w-full md:w-80 focus:ring-2 focus:ring-yellow-500 shadow-lg outline-none cursor-pointer hover:bg-black/60 transition-all font-medium"
              >
                <option value="">-- เลือกวิชาภารกิจ --</option>
                {enrolledSubjects.map(sub => (
                  <option key={sub} value={sub}>{SUBJECT_NAMES[sub]}</option>
                ))}
              </select>
           </div>
        </div>
      </header>

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
          const rightsBalance = Math.max(0, maxRewards - redeemed);
          const progressPercent = Math.min((totalScore / nextRankData.threshold) * 100, 100);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Rank Card */}
              <div className="bg-game-panel/60 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/5 shadow-2xl h-fit">
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${rankColor}`}></div>
                <div className="absolute -top-10 -right-10 text-white/5"><Snowflake size={120} /></div>

                <div className="relative z-10 mt-4 scale-125">
                   <RankBadge rank={rank} size="xl" />
                </div>
                
                <div className="mt-10 relative z-10 w-full">
                  <p className={`text-4xl font-display font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b ${rankColor.replace('text-', 'from-').replace(' ', ' to-white ')}`}>
                    {rank}
                  </p>
                  
                  <div className="mt-6 bg-black/40 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                    {nextRankData.nextRank ? (
                      <>
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] text-white/40 font-bold uppercase">Progress to {nextRankData.nextRank}</span>
                           <span className="text-sm font-mono font-bold text-yellow-400">-{nextRankData.pointsNeeded} PTS</span>
                        </div>
                        <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden p-[2px]">
                           <div 
                              className={`h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full transition-all duration-1000`}
                              style={{ width: `${progressPercent}%` }}
                           ></div>
                        </div>
                      </>
                    ) : (
                      <div className="text-yellow-400 font-bold flex items-center justify-center gap-2">
                         <Star size={16} className="fill-current animate-pulse" /> Ultimate Achievement <Star size={16} className="fill-current animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-900/20 p-6 rounded-3xl border border-red-500/10 flex flex-col justify-center">
                        <p className="text-red-300/60 text-xs font-bold uppercase tracking-wider">Total Score</p>
                        <p className="text-5xl font-mono font-bold text-white mt-2">
                             {data.status === 'Normal' ? totalScore : data.status}
                             <span className="text-lg text-white/20 ml-2">/100</span>
                        </p>
                    </div>
                    <div className="bg-green-900/20 p-6 rounded-3xl border border-green-500/10 flex flex-col justify-center">
                        <p className="text-green-300/60 text-xs font-bold uppercase tracking-wider">Academic Grade</p>
                        <p className="text-5xl font-mono font-bold text-green-400 mt-2">{grade}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Reward Bag */}
                    <div className={`p-6 rounded-3xl flex flex-col justify-between border transition-all relative overflow-hidden ${rightsBalance > 0 ? 'bg-yellow-900/10 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}>
                         <div className="flex items-start justify-between relative z-10">
                            <div>
                                <h3 className="text-yellow-200/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Gift size={14} /> ถุงของขวัญ
                                </h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${rightsBalance > 0 ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/20'}`}>
                                <Gift size={24} />
                            </div>
                         </div>
                         <div className="mt-4">
                            <span className={`text-6xl font-mono font-bold ${rightsBalance > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{rightsBalance}</span>
                            <span className="text-sm font-bold ml-2 text-white/40">Rights Left</span>
                         </div>
                         <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-white/40 uppercase font-bold">
                             <div>Total Earned: {maxRewards}</div>
                             <div className="text-right">Redeemed: {redeemed}</div>
                         </div>
                    </div>

                    {/* Redeem Button Area */}
                    <div className="bg-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center border border-white/5">
                        <button 
                            onClick={() => handleRedeem(selectedSubject)}
                            disabled={rightsBalance <= 0 || redeeming}
                            className={`w-full py-5 rounded-2xl font-bold tracking-widest text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            rightsBalance > 0 
                            ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                        >
                            {redeeming ? 'กำลังแลก...' : rightsBalance > 0 ? 'แลกของขวัญ!' : 'สิทธิ์หมดแล้ว'}
                            {rightsBalance > 0 && !redeeming && <Star size={20} className="fill-white" />}
                        </button>
                        <p className="mt-4 text-[10px] text-white/30 uppercase tracking-tighter">Merry Christmas & Happy New Year!</p>
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="bg-black/30 rounded-3xl p-8 border border-white/5 relative">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <BookOpen className="text-yellow-400" size={20} /> Score Breakdown
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-3 text-xs uppercase font-bold text-white/40">
                                <span>Assignments (6 x 10)</span>
                                <span className="text-white">{data.scores.assignments.reduce((a,b)=>a+b, 0)}/60</span>
                            </div>
                            <div className="grid grid-cols-6 gap-3">
                                {data.scores.assignments.map((score, i) => (
                                    <div key={i} className={`h-12 flex items-center justify-center rounded-xl border ${score >= 8 ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/5 text-white/30'} font-mono font-bold`}>
                                        {score}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                 <span className="text-xs text-white/40 font-bold uppercase">Midterm</span>
                                 <span className="text-xl font-mono font-bold text-white">{data.scores.midterm}</span>
                             </div>
                             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                 <span className="text-xs text-white/40 font-bold uppercase">Final</span>
                                 <span className="text-xl font-mono font-bold text-white">{data.scores.final}</span>
                             </div>
                        </div>
                    </div>
                </div>

              </div>
            </div>
          );
        })()
      ) : (
        <div className="h-80 flex flex-col items-center justify-center text-white/20 rounded-[3rem] border-2 border-dashed border-white/5">
          <Star size={48} className="mb-4" />
          <p className="text-lg font-festive">Please Select a Mission Subject</p>
        </div>
      )}
    </div>
  );
};