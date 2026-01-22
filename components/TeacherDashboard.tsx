
import React, { useState, useEffect, useRef } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES, SpecialStatus, SubjectMetadata } from '../types';
import { SheetService } from '../services/sheetService';
import { calculateTotalScore, calculateGrade, calculateRank, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { RefreshCw, Search, Trophy, User, Target, Compass, Sparkles, Link as LinkIcon, Settings2, X, Plus, Trash2 } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode>(SubjectCode.M1_HISTORY);
  const [filterText, setFilterText] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaData, setMetaData] = useState<SubjectMetadata | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async (isPolling = false) => {
    if (!isPolling && students.length === 0) setLoading(true);
    try {
        const data = await SheetService.getAllStudents();
        const meta = await SheetService.getSubjectMetadata(selectedSubject);
        if (isMounted.current) {
            setStudents(prev => JSON.stringify(data) !== JSON.stringify(prev) ? data : prev);
            setMetaData(meta);
            setLoading(false);
        }
    } catch (error) {
        console.error("Failed to fetch data", error);
        if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoRefresh) {
        interval = setInterval(() => fetchData(true), 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isAutoRefresh, selectedSubject]);

  const filteredStudents = students
    .filter(s => !!s.subjects[selectedSubject]) // กรองเฉพาะนักเรียนในวิชานี้
    .sort((a, b) => { // จัดเรียงตาม rowIndex ของวิชาที่เลือกอยู่
      const rowA = a.subjects[selectedSubject]?.rowIndex ?? 9999;
      const rowB = b.subjects[selectedSubject]?.rowIndex ?? 9999;
      return rowA - rowB;
    })
    .filter(s => { // กรองตามคำค้นหา (ถ้ามี)
      const matchesSearch = s.name.toLowerCase().includes(filterText.toLowerCase()) || 
                           s.id.toLowerCase().includes(filterText.toLowerCase());
      return matchesSearch;
    });

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

  const handleMetaSave = async () => {
    if (metaData) {
        await SheetService.updateSubjectMetadata(selectedSubject, metaData);
        setShowMetaModal(false);
        alert('บันทึกข้อมูลภารกิจเรียบร้อยแล้ว!');
    }
  };

  const updateMetaName = (index: number, value: string) => {
    if (!metaData) return;
    const newAssignments = [...metaData.assignments];
    newAssignments[index] = { ...newAssignments[index], name: value };
    setMetaData({ ...metaData, assignments: newAssignments });
  };

  const updateMetaLink = (assignmentIdx: number, linkIdx: number, value: string) => {
    if (!metaData) return;
    const newAssignments = [...metaData.assignments];
    const newLinks = [...newAssignments[assignmentIdx].links];
    newLinks[linkIdx] = value;
    newAssignments[assignmentIdx] = { ...newAssignments[assignmentIdx], links: newLinks };
    setMetaData({ ...metaData, assignments: newAssignments });
  };

  const addMetaLink = (assignmentIdx: number) => {
    if (!metaData) return;
    const newAssignments = [...metaData.assignments];
    const newLinks = [...newAssignments[assignmentIdx].links, ''];
    newAssignments[assignmentIdx] = { ...newAssignments[assignmentIdx], links: newLinks };
    setMetaData({ ...metaData, assignments: newAssignments });
  };

  const removeMetaLink = (assignmentIdx: number, linkIdx: number) => {
    if (!metaData) return;
    const newAssignments = [...metaData.assignments];
    const newLinks = newAssignments[assignmentIdx].links.filter((_, i) => i !== linkIdx);
    if (newLinks.length === 0) newLinks.push('');
    newAssignments[assignmentIdx] = { ...newAssignments[assignmentIdx], links: newLinks };
    setMetaData({ ...metaData, assignments: newAssignments });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fadeIn pb-20">
      {/* Teacher Dashboard Header */}
      <div className="bg-[#134e4a]/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent"></div>
        <div className="relative z-10">
           <h1 className="text-3xl font-display font-black text-white flex items-center gap-4 tracking-widest uppercase">
             <Compass className="text-cyan-400" /> ศูนย์จัดการการสำรวจ
           </h1>
           <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest">แผงควบคุมระดับวิชา</span>
              <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter border transition-all ${isAutoRefresh ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/30 border-white/10'}`}
              >
                LIVE: {isAutoRefresh ? 'เชื่อมต่อแล้ว' : 'หยุดชั่วคราว'}
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
          <button 
            onClick={() => setShowMetaModal(true)}
            className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 px-6 py-4 rounded-[1.5rem] border border-amber-500/20 transition-all font-bold text-sm flex items-center gap-2"
          >
            <Settings2 size={18} /> จัดการภารกิจ
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-4 text-white/20 w-5 h-5" />
            <input 
              type="text" placeholder="ค้นหานักเรียน..." 
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

      {/* Data Table */}
      <div className="bg-white/5 rounded-[3rem] overflow-hidden overflow-x-auto border border-white/5 shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-black/60 text-white/30 text-[9px] uppercase font-black tracking-widest">
              <th className="p-6 text-center">ลำดับ</th>
              <th className="p-6 text-center">แรงค์</th>
              <th className="p-6">รหัสนักเรียน</th>
              <th className="p-6">ชื่อ-นามสกุล</th>
              {[1, 2, 3, 4, 5, 6].map(i => <th key={i} className="p-2 text-center bg-emerald-900/10 text-emerald-400/80">งาน {i}</th>)}
              <th className="p-6 text-center bg-rose-900/10 text-rose-400/80">กลางภาค</th>
              <th className="p-6 text-center bg-rose-900/10 text-rose-400/80">ปลายภาค</th>
              <th className="p-6 text-center text-white font-black bg-white/5">รวม</th>
              <th className="p-6 text-center text-cyan-400 bg-white/5">เกรด</th>
              <th className="p-6 text-center text-amber-500 bg-amber-900/10">สิทธิ์แลก</th>
              <th className="p-6 text-center">สถานะ</th>
              <th className="p-6 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-display">
            {loading ? (
              <tr><td colSpan={19} className="p-32 text-center font-festive text-3xl text-white/10 animate-pulse tracking-widest">กำลังดึงข้อมูลนักสำรวจ...</td></tr>
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
                              value={score || ''} 
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleInlineUpdate(student.id, 'assignment', e.target.value, idx)}
                          />
                      </td>
                  ))}
                  <td className="p-1 border-x border-white/5 bg-rose-900/5">
                      <input 
                        type="number" 
                        className="w-full bg-transparent text-center font-mono text-sm text-rose-300 font-bold py-2" 
                        value={sub.scores.midterm || ''} 
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleInlineUpdate(student.id, 'midterm', e.target.value)}
                      />
                  </td>
                  <td className="p-1 border-x border-white/5 bg-rose-900/5">
                      <input 
                        type="number" 
                        className="w-full bg-transparent text-center font-mono text-sm text-rose-300 font-bold py-2" 
                        value={sub.scores.final || ''} 
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleInlineUpdate(student.id, 'final', e.target.value)}
                      />
                  </td>
                  <td className="p-5 text-center font-black text-white text-xl">{sub.status === 'Normal' ? total : '-'}</td>
                  <td className="p-5 text-center font-black text-cyan-400 text-xl">{calculateGrade(total, sub.status)}</td>
                  <td className="p-5 text-center font-black text-2xl text-amber-500 bg-amber-900/5">{calculatedRights}</td>
                  <td className="p-2 text-center">
                    <select className="bg-black/60 text-[10px] border border-white/10 rounded-xl px-2 py-1.5 font-black tracking-widest text-emerald-400" value={sub.status} onChange={(e) => handleInlineUpdate(student.id, 'status', e.target.value)}>
                        <option value="Normal">ปกติ</option>
                        <option value="ร">ร</option>
                        <option value="มส.">มส.</option>
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

      {/* Mission Metadata Modal */}
      {showMetaModal && metaData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-[#0f2a28] border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 md:p-12 relative animate-fadeIn">
                <button onClick={() => setShowMetaModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"><X size={32} /></button>
                
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-display font-black text-white flex items-center justify-center gap-4">
                        <Settings2 className="text-amber-400" /> ตั้งค่าภารกิจการเรียนรู้
                    </h2>
                    <p className="text-white/40 text-xs mt-2 uppercase tracking-[0.3em] font-bold">กำหนดชื่อและลิงก์ภารกิจสำหรับวิชา {SUBJECT_NAMES[selectedSubject]}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metaData.assignments.map((assign, aIdx) => (
                        <div key={aIdx} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="bg-emerald-500 text-black text-[10px] px-3 py-1 rounded-full font-black">ภารกิจที่ {aIdx + 1}</span>
                            </div>
                            <div>
                                <label className="text-[10px] text-white/30 uppercase font-black block mb-1 ml-2">ชื่อภารกิจ</label>
                                <input 
                                    type="text" 
                                    value={assign.name}
                                    placeholder="เช่น ใบงานที่ 1: ประวัติศาสตร์..."
                                    onChange={(e) => updateMetaName(aIdx, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] text-white/30 uppercase font-black block mb-1 ml-2">ลิงก์ใบงาน/ชิ้นงาน (เพิ่มได้มากกว่า 1 ลิงก์)</label>
                                {assign.links.map((link, lIdx) => (
                                    <div key={lIdx} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                            <input 
                                                type="text" 
                                                value={link}
                                                placeholder="วางลิงก์ชิ้นงานที่นี่..."
                                                onChange={(e) => updateMetaLink(aIdx, lIdx, e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-cyan-400 outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => removeMetaLink(aIdx, lIdx)}
                                            className="p-4 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors border border-rose-500/20"
                                            title="ลบลิงก์นี้"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => addMetaLink(aIdx)}
                                    className="w-full py-3 border-2 border-dashed border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 hover:border-emerald-400/40 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                >
                                    <Plus size={16} /> เพิ่มลิงก์ชิ้นงานอื่น
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex gap-4">
                    <button onClick={() => setShowMetaModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-3xl font-bold transition-all">ยกเลิก</button>
                    <button onClick={handleMetaSave} className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-700 text-white py-5 rounded-3xl font-game font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">ยืนยันการบันทึกข้อมูล</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
