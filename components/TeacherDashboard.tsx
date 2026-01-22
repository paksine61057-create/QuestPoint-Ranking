
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, SubjectCode, SUBJECT_NAMES, SpecialStatus, SubjectMetadata } from '../types';
import { SheetService } from '../services/sheetService';
import { calculateTotalScore, calculateGrade, calculateRank, calculateMaxRewards } from '../services/gradingLogic';
import { RankBadge } from './RankBadge';
import { RefreshCw, Search, Trophy, User, Target, Compass, Sparkles, Link as LinkIcon, Settings2, X, Plus, Trash2 } from 'lucide-react';

// รายชื่อนักเรียน ม.1 ตามลำดับที่กำหนด
const M1_ORDER = [
  "ด.ช.เกรียงไกร สืบวงศ์", "ด.ช.จักรกริช จันทะเนตร", "ด.ช.จิรายุ แสงกล้า", "ด.ช.ชุติพันธุ์ พัฒนสาร",
  "ด.ช.ทรัพย์ธนา ศรีชินเลิศ", "ด.ช.ธนบูรณ์ พรมศรีจันทร์", "ด.ช.ธนภัทร ปรอยโคกสูง", "ด.ช.พลาธิป เกษศิริ",
  "ด.ช.พิชญะ ปาตั้น", "ด.ช.พีรภัทร บุญพา", "ด.ช.พีรยุทธ สารภี", "ด.ช.โพธิวัฒน์ พงษ์พรหมมา",
  "ด.ช.ภาฆิณ ม่วงมนตรี", "ด.ช.รชฎ อุทัยเลี้ยง", "ด.ช.สิรวิชญ์ สินทร", "ด.ช.สุภโชค ปาระดี",
  "ด.ช.อิศรานุวัฒน์ แสงแก้ว", "ด.ญ.กัญญรัตน์ ชิณบุตร", "ด.ญ.กัญญ์วราพร โยธาวงค์", "ด.ญ.กัญญารัตน์ แก้วสอนดี",
  "ด.ญ.กัญญาวีร์ วรรณษา", "ด.ญ.กานต์ธิดา พิเนตร", "ด.ญ.ชนัญชิดา ผิวผ่อง", "ด.ญ.พรไพริน มีบุญ",
  "ด.ญ.พิชานันท์ ดอนหนองบัว", "ด.ญ.พิมวรดา พลวาปี", "ด.ญ.พุทธิมา ทองมั่น", "ด.ญ.รจเรศ กัญญารัตน์",
  "ดญ.ศศิมา", "ด.ญ.วราภรณ์ ทองวิเศษ", "ด.ญ.สุภาวิณี วังภูมิใหญ่", "ด.ญ.อภิรดี ลือหาร",
  "ด.ญ.อารยา สุขจิตร", "ด.ช.จักรพรรดิ์ พลวาปี", "ด.ช.เทวา ฉิมงาม", "ด.ช.ธนากร พิชัย",
  "ด.ช.ธีรพล บำรุงภักดี", "ด.ช.ธีรพัฒน์ กลิ่นทอง", "ด.ช.นเดช ไชยวรรณ", "ด.ช.บุณยกร คุณสมบัติ",
  "ด.ช.ปาฎิหารย์ พลวาปี", "ด.ช.ปิยวัฒน์ สิงห์โท", "ด.ช.พรรณเชษฐ์ เบิกบานดี", "ด.ช.พีรพล บุญพา",
  "ด.ช.วรกรณ์ จะตุเทน", "ด.ช.วสันต์ ผ่านจังหาร", "ด.ช.ศรัณยภัทร์ นามอาษา", "ด.ช.อดิเทพ สอนราษ",
  "ด.ญ.กนกอร ชารีงาม", "ด.ญ.กมลชนก แสงแก้ว", "ด.ญ.กมลพัทร ผันทะจักร", "ด.ญ.จันทร์ธิดา ชะรา",
  "ด.ญ.ชลธิชา ชินแสน", "ด.ญ.ทิวรินทร์ ชารีงาม", "ด.ญ.นฤมล พันนิน", "ด.ญ.ปัญญาริสา คงเสรีกุล",
  "ด.ญ.พิชญธิดา หินเทาว์", "ด.ญ.ภัณฑิรา ธรรมอินราช", "ด.ญ.รัตน์ติญา พลแสน", "ด.ญ.ศยามล คงประเสริฐ",
  "ด.ญ.อภิญญา แก้วภูนอก", "ด.ญ.อังสนา พันชัย", "เด็กชายสุวิช โสภากุล", "สุดภาวดี พลวาปี"
];

// รายชื่อนักเรียน ม.5 ตามลำดับที่กำหนด
const M5_ORDER = [
  "นายกลทีป์ ใจอ่อน", "นายจิระพงศ์ กองหล้า", "นายญาณพัฒน์ โคตรพัฒน์", "นายตะวัน มีสา",
  "นายนภดล ศรีประเสริฐ", "นายภูริภัทร จันทยุทธ", "นายวิริยะ ภาสะฐิติ", "นายศุกลวัฒน์ ปลัดศรีช่วย",
  "นายเสกสรร โสภากุล", "นายอดิศักดิ์ แสนสุข", "นางสาวกัญจน์จิรา สิทธนู", "นางสาวกัญญาวีร์ จันทรเสนา",
  "นางสาวจิรภัทร์ อุดรเขต", "นางสาวชนัญญา โสภากุล", "นางสาวชนิญญา โบแบน", "นางสาวฐานิกา มูลทอง",
  "นางสาวณัฐณิชา คำเคลือ", "นางสาวตรีทิพย์ แดงบัณฑิต", "นางสาวทิพานัน สระเกษ", "นางสาวนิติพร จันทะแพน",
  "นางสาวปราญชลี ดวงแก้ว", "นางสาวปรารีญา ชินฝั่น", "นางสาวปาริฉัตร นิติธรรม", "นางสาวเปรมมิกา เหมี้ยงหอม",
  "นางสาววรกานต์ โพธิ์นวลศรี", "นางสาววรัญญา ชัยบุญตา", "ธราธิป วระชินา", "นันทวัฒน์ บุญพา",
  "พงศธร แย้มยิ้ม", "ศุภเวท บำรุงภักดี", "สุทธิโชค คำมีภักดิ์", "ภัทรจาริน คำยก",
  "วิภาพร โสดาจันทร์", "ศิริชัย จันทรเสนา", "พนิดา คำวงศ์", "สุภาวดี แก้วอินทร์ศรี",
  "ธนากร น้อยเขียว", "อนุวัฒน์ ศิริขันธ์", "อดิศักดิ์ สิทธา", "สุรศักดิ์ จันทะเนตร",
  "ประกายพลอย บรรณสาร", "ประกายเพชร บรรณสาร", "ปพัศรา ศรีอุ้ย", "ธีรโชติ พันชัย",
  "พิพัตรา นาหนองตุม", "นายชลกร พานพิมาย", "นายณัฐพล  มาลา"
];

// รายชื่อนักเรียน ม.6 ตามลำดับที่กำหนด
const M6_SOCIAL_ORDER = [
  "นายกฤษดา ปัญญาวงค์", "นายจักรดุลย์ จันทรเสนา", "นายธนวรรธน์ จิตรโสภา", "นายธนาธิป เจียรวาปี",
  "นายมงคล ศิริเลี้ยง", "นายรัชชานนท์ สาธุการ", "นายรุ่งเรืองจิต อินธิแสน", "นายสิรวิชญ์ ปาตั้น",
  "นายอลงกรณ์ พุ่มชะอุ่ม", "นางสาวกัญญารัตน์ แสนพันนา", "นางสาวชลธิชา อาจแสง", "นางสาวณัฐริกา บำรุงภักดี",
  "นางสาวณัฐฤดี พานิพัตร์", "นางสาวดวงภรณ์ เบิกบานดี", "นางสาวทิพย์สุดา แคนจันทร์", "นางสาวธัญวรัตน์ ศิริภักดิ์",
  "นางสาวปาณิศา เทียงแก้ว", "ปาริตา ศรีวงศ์ราช", "นางสาวภัททรา ลาวะดี", "นางสาวมัลลิกา บุญพา",
  "นางสาวรัฐษฎาพร บุญพา", "นางสาววณิดา แสนขวา", "นางสาววริศรา วังภูมิใหญ่", "นางสาววิชญาพร หมั่นเก็บ",
  "นางสาววิไลลักษณ์ บุบผาลัง", "นางสาวศิรินทิพย์ รามโคตร", "นางสาวศุกรรณิกา ทมถา", "นางสาวศุภานัน ปัญญาใส",
  "นางสาวสรีรันย์ บำรุงภักดี", "นางสาวสิริรัตน์ ปาระดี", "นางสาวสุภารัตน์ คำเฮือง", "นางสาวอนัญญา เทือกตาทอง",
  "นายกรสกุลศักดิ์ ชัยชาญพันธ์", "นายจันทกร ทำผง", "นายโชคชัย ศรีอาษา", "นายเด่นพงษ์ เถาโคตสี",
  "นายธราเทพ ยมหล้า", "นายธีรภัทร บัณฑิตย์", "นายธีระเดช วังภูมิใหญ่", "นายภาณุวัฒน์ ทาริวิก",
  "นายภูมิรัตน์ หีบแก้ว", "นายภูมิรัตน์ หีบแก้ว", "นายภูริพัฒน์ หมีกุล", "นายศักดินนท์ กกเปือย",
  "นายศิรายุทธ ศรีวงราช", "นายศิวัช ภักสงศรี", "นายอนุชิต สัตยากุม", "นายอรรถพล ชินวงค์",
  "นายอัษฏายุทธ แช่มเกด", "นายเอกสิทธิ์ เค้าแคน", "นางสาวจิตรานุช ท้าวสุวรรณกุล", "นางสาวเจนจิรา พานนนท์",
  "นางสาวชุติมน ศิริขันธ์", "นางสาวณฐกมล แก้รัมย์", "นางสาวณัชชา แสนทอง", "นางสาวธนัญญา สีเหลือง",
  "นางสาวพรพิพัฒน์ อ่อนมาก", "นางสาวพัชริภา สุนทอง", "นางสาวภัคพร แจ่มแจ้ง", "นางสาวอรชพร สินทร",
  "นางสาวอรัญญา กุลาพัง", "นางสาวอริสรา พันแสน"
];

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

  const filteredStudents = useMemo(() => {
    const search = filterText.toLowerCase().trim();
    
    return students
      .filter(s => s.subjects && !!s.subjects[selectedSubject])
      .map(s => ({ ...s }))
      .sort((a, b) => {
        if (selectedSubject === SubjectCode.M1_HISTORY || selectedSubject === SubjectCode.M1_SOCIAL) {
          const idxA = M1_ORDER.findIndex(name => a.name.includes(name) || name.includes(a.name));
          const idxB = M1_ORDER.findIndex(name => b.name.includes(name) || name.includes(b.name));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        if (selectedSubject === SubjectCode.M5_HISTORY || selectedSubject === SubjectCode.M5_SOCIAL) {
          const idxA = M5_ORDER.findIndex(name => a.name.includes(name) || name.includes(a.name));
          const idxB = M5_ORDER.findIndex(name => b.name.includes(name) || name.includes(b.name));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        if (selectedSubject === SubjectCode.M6_SOCIAL) {
          const idxA = M6_SOCIAL_ORDER.indexOf(a.name);
          const idxB = M6_SOCIAL_ORDER.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        const rowA = Number(a.subjects[selectedSubject]?.rowIndex) || 99999;
        const rowB = Number(b.subjects[selectedSubject]?.rowIndex) || 99999;
        if (rowA !== rowB) return rowA - rowB;
        return (a.name || "").localeCompare(b.name || "", 'th');
      })
      .filter(s => {
        if (!search) return true;
        return (s.name || "").toLowerCase().includes(search) || 
               (s.id || "").toLowerCase().includes(search);
      });
  }, [students, selectedSubject, filterText]);

  const handleInlineUpdate = async (studentId: string, type: 'assignment' | 'midterm' | 'final' | 'status', value: string, index?: number) => {
    let numVal = Number(value);
    const statusVal = value as SpecialStatus;
    if (type === 'assignment') numVal = Math.min(10, Math.max(0, numVal));
    else if (type === 'midterm' || type === 'final') numVal = Math.min(20, Math.max(0, numVal));

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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-3xl p-8 rounded-[3rem] border border-white shadow-xl flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-100/50 to-transparent"></div>
        <div className="relative z-10">
           <h1 className="text-3xl font-display font-black text-slate-800 flex items-center gap-4 tracking-widest uppercase">
             <Compass className="text-cyan-600" /> ศูนย์จัดการการสำรวจ
           </h1>
           <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] uppercase font-black text-emerald-600 tracking-widest">แผงควบคุมระดับวิชา</span>
              <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter border transition-all ${isAutoRefresh ? 'bg-cyan-100 text-cyan-600 border-cyan-400 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
              >
                LIVE: {isAutoRefresh ? 'เชื่อมต่อแล้ว' : 'หยุดชั่วคราว'}
              </button>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto relative z-10">
          <select 
            className="bg-white text-slate-700 p-4 rounded-[1.5rem] border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold text-sm shadow-sm"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as SubjectCode)}
          >
            {Object.values(SubjectCode).map(code => (
              <option key={code} value={code}>{SUBJECT_NAMES[code]}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowMetaModal(true)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-6 py-4 rounded-[1.5rem] border border-amber-200 transition-all font-bold text-sm flex items-center gap-2"
          >
            <Settings2 size={18} /> จัดการภารกิจ
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-4 text-slate-300 w-5 h-5" />
            <input 
              type="text" placeholder="ค้นหานักเรียน..." 
              className="bg-white text-slate-800 pl-12 p-4 rounded-[1.5rem] border border-slate-200 outline-none w-full focus:ring-2 focus:ring-cyan-500 font-bold shadow-sm"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <button onClick={() => fetchData(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-[1.5rem] transition-all shadow-lg active:scale-95 group">
            <RefreshCw size={24} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-[3rem] overflow-hidden overflow-x-auto border border-white shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100">
              <th className="p-6 text-center">ลำดับ</th>
              <th className="p-6 text-center">แรงค์</th>
              <th className="p-6">รหัสนักเรียน</th>
              <th className="p-6">ชื่อ-นามสกุล</th>
              {[1, 2, 3, 4, 5, 6].map(i => <th key={i} className="p-2 text-center bg-emerald-50 text-emerald-600">งาน {i}</th>)}
              <th className="p-6 text-center bg-rose-50 text-rose-600">กลางภาค</th>
              <th className="p-6 text-center bg-rose-50 text-rose-600">ปลายภาค</th>
              <th className="p-6 text-center text-slate-800 font-black bg-slate-50/50">รวม</th>
              <th className="p-6 text-center text-cyan-600 bg-slate-50/50">เกรด</th>
              <th className="p-6 text-center text-amber-600 bg-amber-50">สิทธิ์แลก</th>
              <th className="p-6 text-center">สถานะ</th>
              <th className="p-6 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-display">
            {loading ? (
              <tr><td colSpan={19} className="p-32 text-center font-festive text-3xl text-slate-300 animate-pulse tracking-widest">กำลังดึงข้อมูลนักสำรวจ...</td></tr>
            ) : filteredStudents.map((student, index) => {
              const sub = student.subjects[selectedSubject]!;
              const total = calculateTotalScore(sub.scores);
              const max = calculateMaxRewards(total);
              const calculatedRights = Math.max(0, max - (sub.redeemedCount || 0));
              return (
                <tr key={student.id} className="hover:bg-cyan-50 transition-all group">
                  <td className="p-5 text-center text-xs text-slate-300 font-mono">{index + 1}</td>
                  <td className="p-2 text-center"><div className="w-12 h-12 mx-auto hover:scale-125 transition-transform"><RankBadge rank={calculateRank(total, sub.status)} size="sm" showLabel={false} /></div></td>
                  <td className="p-5 font-mono text-xs text-cyan-600 font-bold">{student.id}</td>
                  <td className="p-5 text-sm font-black text-slate-700 tracking-wide">{student.name}</td>
                  {sub.scores.assignments.map((score, idx) => (
                      <td key={idx} className="p-1 border-x border-slate-50 bg-emerald-50/30">
                          <input 
                              type="number" className="w-full bg-transparent text-center font-mono text-sm focus:bg-emerald-100 outline-none text-emerald-700 font-bold py-2"
                              value={score || ''} placeholder="0" onFocus={(e) => e.target.select()}
                              onChange={(e) => handleInlineUpdate(student.id, 'assignment', e.target.value, idx)}
                          />
                      </td>
                  ))}
                  <td className="p-1 border-x border-slate-50 bg-rose-50/30">
                      <input 
                        type="number" className="w-full bg-transparent text-center font-mono text-sm text-rose-600 font-bold py-2" 
                        value={sub.scores.midterm || ''} placeholder="0" onFocus={(e) => e.target.select()}
                        onChange={(e) => handleInlineUpdate(student.id, 'midterm', e.target.value)}
                      />
                  </td>
                  <td className="p-1 border-x border-slate-50 bg-rose-50/30">
                      <input 
                        type="number" className="w-full bg-transparent text-center font-mono text-sm text-rose-600 font-bold py-2" 
                        value={sub.scores.final || ''} placeholder="0" onFocus={(e) => e.target.select()}
                        onChange={(e) => handleInlineUpdate(student.id, 'final', e.target.value)}
                      />
                  </td>
                  <td className="p-5 text-center font-black text-slate-800 text-xl">{sub.status === 'Normal' ? total : '-'}</td>
                  <td className="p-5 text-center font-black text-cyan-600 text-xl">{calculateGrade(total, sub.status)}</td>
                  <td className="p-5 text-center font-black text-2xl text-amber-500 bg-amber-50/50">{calculatedRights}</td>
                  <td className="p-2 text-center">
                    <select className="bg-white text-[10px] border border-slate-200 rounded-xl px-2 py-1.5 font-black tracking-widest text-emerald-600" value={sub.status} onChange={(e) => handleInlineUpdate(student.id, 'status', e.target.value)}>
                        <option value="Normal">ปกติ</option>
                        <option value="ร">ร</option>
                        <option value="มส.">มส.</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => setEditingStudent(student)} className="text-slate-300 hover:text-amber-500 transition-colors p-3 bg-slate-50 rounded-2xl border border-slate-100"><Trophy size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showMetaModal && metaData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 md:p-12 relative animate-fadeIn">
                <button onClick={() => setShowMetaModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"><X size={32} /></button>
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-display font-black text-slate-800 flex items-center justify-center gap-4">
                        <Settings2 className="text-amber-500" /> ตั้งค่าภารกิจการเรียนรู้
                    </h2>
                    <p className="text-slate-400 text-xs mt-2 uppercase tracking-[0.3em] font-bold">กำหนดชื่อและลิงก์ภารกิจสำหรับวิชา {SUBJECT_NAMES[selectedSubject]}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metaData.assignments.map((assign, aIdx) => (
                        <div key={aIdx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-black">ภารกิจที่ {aIdx + 1}</span>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-black block mb-1 ml-2">ชื่อภารกิจ</label>
                                <input 
                                    type="text" value={assign.name} onChange={(e) => updateMetaName(aIdx, e.target.value)}
                                    className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-3">
                                {assign.links.map((link, lIdx) => (
                                    <div key={lIdx} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input 
                                                type="text" value={link} onChange={(e) => updateMetaLink(aIdx, lIdx, e.target.value)}
                                                className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl text-cyan-600 outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
                                            />
                                        </div>
                                        <button onClick={() => removeMetaLink(aIdx, lIdx)} className="p-4 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button onClick={() => addMetaLink(aIdx)} className="w-full py-3 border-2 border-dashed border-emerald-200 text-emerald-500 hover:text-emerald-600 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold">
                                    <Plus size={16} /> เพิ่มลิงก์ชิ้นงานอื่น
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-12 flex gap-4">
                    <button onClick={() => setShowMetaModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-5 rounded-3xl font-bold transition-all">ยกเลิก</button>
                    <button onClick={handleMetaSave} className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-700 text-white py-5 rounded-3xl font-game font-black uppercase tracking-widest shadow-lg transition-all hover:shadow-xl">ยืนยันการบันทึกข้อมูล</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
