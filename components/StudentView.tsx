
import React, { useState, useEffect } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES, SubjectMetadata } from '../types';
import { calculateTotalScore, calculateGrade, calculateRank, getRankColor, getNextRankInfo, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { SheetService } from '../services/sheetService';
import { Compass, Sun, Flower, Trophy, Sparkles, Link as LinkIcon, ExternalLink, CheckCircle2, Info } from 'lucide-react';

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
  const [metaData, setMetaData] = useState<SubjectMetadata | null>(null);

  useEffect(() => {
    if (selectedSubject) {
        SheetService.getSubjectMetadata(selectedSubject as SubjectCode).then(setMetaData);
    }
  }, [selectedSubject]);

  const handleRedeem = async (subject: SubjectCode) => {
    if (!window.confirm('ยืนยันการใช้สิทธิ์? สิทธิ์ของคุณจะลดลง 1 แต้ม')) return;
    setRedeeming(true);
    const success = await SheetService.redeemReward(student.id, subject);
    if (success) {
        alert('🌿 ยินดีด้วย! ใช้สิทธิ์แลกรางวัลสำเร็จ');
        onRefresh();
    } else {
        alert('⚠️ สิทธิ์ไม่เพียงพอ หรือเกิดข้อผิดพลาด');
    }
    setRedeeming(false);
  };

  const isLink = (str: string) => {
    const trimmed = str.trim().toLowerCase();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 backdrop-blur-2xl p-8 rounded-[3rem] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-2xl">
        <div className="relative z-10 text-center md:text-left">
          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
            <Sun size={18} className="text-amber-400 animate-spin-slow" />
            <h2 className="text-cyan-200 text-xs font-bold tracking-[0.3em] uppercase">ฤดูกาลแห่งการเรียนรู้</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-wide">
             <span className="text-emerald-400">ยินดีต้อนรับกลับมา,</span> {student.name}
          </h1>
        </div>
        
        <div className="relative z-10 w-full md:w-auto">
           <div className="relative group">
              <Compass className="absolute left-4 top-3.5 text-cyan-400 w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
                className="appearance-none bg-black/60 border border-white/10 text-white rounded-[1.5rem] pl-12 pr-12 py-4 w-full md:w-80 focus:ring-2 focus:ring-emerald-500 shadow-2xl outline-none cursor-pointer hover:bg-black/80 transition-all font-display font-bold text-sm tracking-widest"
              >
                <option value="">-- เลือกวิชาภารกิจ --</option>
                {enrolledSubjects.map(sub => (
                  <option key={sub} value={sub}>{SUBJECT_NAMES[sub].toUpperCase()}</option>
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
              <div className="bg-[#134e4a]/40 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/5 shadow-2xl h-fit">
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${rankColor}`}></div>
                <div className="relative z-10 scale-150 my-10"><RankBadge rank={rank} size="xl" /></div>
                <div className="relative z-10 w-full mt-6">
                  <p className={`text-5xl font-display font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b ${rankColor.replace('text-', 'from-').replace(' ', ' to-white ')} drop-shadow-lg`}>{rank}</p>
                  <div className="mt-8 bg-black/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                    {nextRankData.nextRank ? (
                      <>
                        <div className="flex justify-between items-end mb-3">
                           <span className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">การเติบโตสู่แรงค์ {nextRankData.nextRank}</span>
                           <span className="text-sm font-mono font-bold text-amber-400">+{nextRankData.pointsNeeded} แต้ม</span>
                        </div>
                        <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden p-[2px]">
                           <div className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                      </>
                    ) : (
                      <div className="text-amber-400 font-bold flex items-center justify-center gap-2 py-2"><Sparkles size={18} /> ระดับสูงสุด (Ultimate Master) <Sparkles size={18} /></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyan-900/20 p-8 rounded-[2.5rem] border border-cyan-500/10 flex flex-col justify-center backdrop-blur-sm">
                        <p className="text-cyan-400/60 text-[10px] font-black uppercase tracking-widest">คะแนนรวมสะสม</p>
                        <p className="text-6xl font-display font-black text-white mt-2">{data.status === 'Normal' ? totalScore : data.status}<span className="text-xl text-white/20 ml-2 font-mono">/100</span></p>
                    </div>
                    <div className="bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-500/10 flex flex-col justify-center backdrop-blur-sm">
                        <p className="text-emerald-400/60 text-[10px] font-black uppercase tracking-widest">ผลการเรียนระดับวิชา</p>
                        <p className="text-6xl font-display font-black text-emerald-400 mt-2">{grade}</p>
                    </div>
                </div>

                {/* Score Breakdown with Links */}
                <div className="bg-black/40 rounded-[2.5rem] p-10 border border-white/5 relative">
                    <h3 className="text-xl font-display font-black text-white flex items-center gap-3 mb-8 tracking-widest">
                        <Compass className="text-emerald-400" size={24} /> บันทึกภารกิจ (Mission Logs)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.scores.assignments.map((score, i) => {
                            const meta = metaData?.assignments[i];
                            const isDone = score > 0;
                            return (
                                <div key={i} className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-3 ${isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isDone ? 'text-emerald-400' : 'text-white/20'}`}>งานที่ {i+1}</span>
                                            <h4 className={`font-bold text-sm ${isDone ? 'text-white' : 'text-white/40'}`}>{meta?.name || `ภารกิจที่ #${i+1}`}</h4>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl font-mono font-black text-lg ${isDone ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/40 text-white/20 border border-white/5'}`}>
                                            {score}<span className="text-[10px] ml-1 opacity-50">/10</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {meta?.links && meta.links.length > 0 && meta.links.map((url, lIdx) => {
                                            if (!url) return null;
                                            const validUrl = isLink(url);
                                            
                                            // Determine display text based on link validity and status
                                            // หากเป็นลิงก์จริง และนักเรียนทำแล้ว ให้โชว์ "ดูงานเดิม"
                                            // หากเป็นลิงก์จริง และยังไม่ทำ ให้โชว์ URL (ถ้าสั้น) หรือ "เริ่มทำภารกิจ" (ถ้า URL ยาว)
                                            // หากไม่ใช่ลิงก์ ให้โชว์ข้อความตามที่พิมพ์ไว้เลย
                                            let displayText = url;
                                            if (validUrl) {
                                              if (isDone) {
                                                displayText = 'ดูงานเดิม';
                                              } else if (url.length > 25) {
                                                displayText = 'เริ่มทำภารกิจ';
                                              }
                                            }

                                            if (validUrl) {
                                              return (
                                                <a 
                                                    key={lIdx}
                                                    href={url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all text-center ${
                                                        isDone 
                                                        ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20' 
                                                        : 'bg-amber-500 text-black hover:scale-[1.02] shadow-xl animate-pulse'
                                                    }`}
                                                >
                                                    {isDone ? <CheckCircle2 size={14}/> : <ExternalLink size={14}/>}
                                                    {displayText}
                                                    {meta.links.length > 1 && !isDone && url.length > 25 ? ` (ชิ้นที่ ${lIdx + 1})` : ''}
                                                </a>
                                              );
                                            } else {
                                              return (
                                                <div 
                                                    key={lIdx}
                                                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border text-center ${
                                                        isDone 
                                                        ? 'bg-emerald-900/10 text-emerald-400/70 border-emerald-500/10' 
                                                        : 'bg-white/5 text-white/60 border-white/10'
                                                    }`}
                                                >
                                                    {isDone ? <CheckCircle2 size={14} className="shrink-0"/> : <Info size={14} className="shrink-0"/>}
                                                    <span className="line-clamp-2">{displayText}</span>
                                                </div>
                                              );
                                            }
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                         <div className="bg-rose-900/10 p-6 rounded-[2rem] border border-rose-500/10 flex flex-col">
                             <span className="text-[10px] text-rose-400/60 font-black uppercase tracking-widest mb-2">คะแนนสอบกลางภาค</span>
                             <div className="flex items-center justify-between">
                                 <span className="text-3xl font-display font-black text-white">{data.scores.midterm}</span>
                                 <span className="text-xs text-white/20">เต็ม 20</span>
                             </div>
                         </div>
                         <div className="bg-rose-900/10 p-6 rounded-[2rem] border border-rose-500/10 flex flex-col">
                             <span className="text-[10px] text-rose-400/60 font-black uppercase tracking-widest mb-2">คะแนนสอบปลายภาค</span>
                             <div className="flex items-center justify-between">
                                 <span className="text-3xl font-display font-black text-white">{data.scores.final}</span>
                                 <span className="text-xs text-white/20">เต็ม 20</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Reward Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-8 rounded-[2.5rem] flex flex-col justify-between border transition-all relative overflow-hidden ${rightsBalance > 0 ? 'bg-amber-900/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                         <div className="flex items-start justify-between relative z-10">
                            <h3 className="text-amber-400/60 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2"><Trophy size={14} /> คลังแลกรางวัล (Harvest)</h3>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${rightsBalance > 0 ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-white/20'}`}><Trophy size={28} /></div>
                         </div>
                         <div className="mt-4"><span className={`text-7xl font-display font-black ${rightsBalance > 0 ? 'text-amber-400' : 'text-white/20'}`}>{rightsBalance}</span><span className="text-xs font-bold ml-2 text-white/30 uppercase tracking-widest">สิทธิ์ที่มี</span></div>
                    </div>
                    <div className="bg-black/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center border border-white/5">
                        <button 
                            onClick={() => handleRedeem(selectedSubject)}
                            disabled={rightsBalance <= 0 || redeeming}
                            className={`w-full py-6 rounded-2xl font-game font-black tracking-[0.2em] text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                            rightsBalance > 0 ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            {redeeming ? 'กำลังตรวจสอบ...' : rightsBalance > 0 ? 'ใช้สิทธิ์แลกรางวัล' : 'สิทธิ์แลกหมดแล้ว'}{rightsBalance > 0 && !redeeming && <Sparkles size={20} className="animate-pulse" />}
                        </button>
                    </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-white/10 rounded-[3.5rem] border-2 border-dashed border-white/5">
          <Compass size={64} className="mb-6 animate-pulse" /><p className="text-xl tracking-widest uppercase">เริ่มต้นการสำรวจโดยการเลือกวิชา</p>
        </div>
      )}
    </div>
  );
};
