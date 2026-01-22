
import React, { useState, useEffect } from 'react';
import { Role, Student } from './types';
import { SheetService } from './services/sheetService';
import { StudentView } from './components/StudentView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { LogOut, Sun, Flower, Leaf, Wind, User, Crown, Compass, CloudSun } from 'lucide-react';

// Nature Particles Component (Leaves/Petals)
const NatureParticles = () => {
  const [particles, setParticles] = useState<{ id: number; left: string; size: string; delay: string; duration: string; color: string; type: 'leaf' | 'petal' }[]>([]);
  
  useEffect(() => {
    const colors = ['#f87171', '#fbbf24', '#34d399', '#f472b6', '#60a5fa'];
    const p = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 10 + 10}px`,
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 12 + 8}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: (Math.random() > 0.5 ? 'leaf' : 'petal') as 'leaf' | 'petal'
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map(p => (
        <div 
          key={p.id}
          className="nature-particle animate-falling"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.type === 'leaf' ? (
            <Leaf size={parseInt(p.size)} style={{ color: p.color, opacity: 0.6 }} />
          ) : (
            <Flower size={parseInt(p.size)} style={{ color: p.color, opacity: 0.6 }} />
          )}
        </div>
      ))}
    </div>
  );
};

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12 y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
);

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loginId, setLoginId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (selectedRole: Role) => {
    setError('');
    if (selectedRole === 'teacher') {
      if (loginId === 'admin4444') { 
        setRole('teacher');
      } else {
        setError('รหัสผ่านครูไม่ถูกต้อง');
      }
    } else {
      const student = await SheetService.getStudentById(loginId);
      if (student) {
        setCurrentStudent(student);
        setRole('student');
      } else {
        setError('ไม่พบรหัสนักเรียนนี้ในระบบ');
      }
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentStudent(null);
    setLoginId('');
    setError('');
  };

  const refreshStudentData = async () => {
     if(currentStudent) {
         const updated = await SheetService.getStudentById(currentStudent.id);
         if(updated) setCurrentStudent(updated);
     }
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-cyan-100 via-white to-emerald-100">
        <NatureParticles />
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 text-amber-400/30 animate-float"><Sun size={120} /></div>
        <div className="absolute bottom-20 left-10 text-rose-400/20 animate-float-delayed"><Flower size={100} /></div>
        <div className="absolute top-1/2 right-20 text-emerald-400/10 animate-twinkle"><Leaf size={60} /></div>

        <div className="bg-white/80 backdrop-blur-3xl max-w-lg w-full p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(20,184,166,0.2)] relative border border-white/50 z-10 group overflow-hidden">
          {/* Top light effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          
          <div className="text-center mb-10">
            <h2 className="font-festive text-2xl text-cyan-600 mb-2 drop-shadow-sm">ฤดูกาลแห่งการเรียนรู้</h2>
            <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-800 via-cyan-700 to-emerald-600 tracking-wider italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
              GRADE
            </h1>
            <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 tracking-wider italic -mt-2">
              QUEST
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-[1px] w-12 bg-slate-200"></div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">ฉบับตามฤดูกาล</span>
              <div className="h-[1px] w-12 bg-slate-200"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group/input">
              <label className="block text-cyan-700 text-[10px] mb-2 uppercase tracking-[0.2em] font-bold ml-1 flex items-center gap-2">
                 <User size={12} className="text-amber-500" /> เข้าสู่ระบบนักรบแห่งการเรียนรู้
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="กรอกรหัสนักเรียน..."
                className="w-full bg-white/50 border border-slate-200 text-slate-800 p-5 pl-6 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-game text-xl shadow-sm placeholder:text-slate-300 tracking-widest"
              />
            </div>
            
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm flex items-center justify-center gap-3 animate-shake font-bold">
                <AlertIcon /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => handleLogin('student')}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white py-4 rounded-2xl font-bold hover:shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1 group/btn shadow-lg"
              >
                <Wind size={20} className="group-hover/btn:translate-x-4 transition-transform duration-500" />
                <span className="font-game text-[10px] uppercase">นักเรียน</span>
              </button>
              
              <button 
                onClick={() => handleLogin('teacher')}
                className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-700 text-white py-4 rounded-2xl font-bold hover:shadow-[0_10px_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1 shadow-lg"
              >
                <Crown size={20} className="text-amber-300" />
                <span className="font-game text-[10px] uppercase">ครูอาจารย์</span>
              </button>
            </div>
            
            <div className="mt-8 text-center text-[10px] text-slate-400 font-mono">
               <p>V.1.2.2 SPRING EDITION • {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-sky-50 text-slate-700 font-sans">
      <NatureParticles />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-white to-sky-100/50 z-0"></div>
      
      <nav className="sticky top-0 z-[70] bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)] group-hover:rotate-12 transition-all">
              <Compass size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-game font-black text-2xl text-slate-800 tracking-widest leading-none italic">
                GRADE
              </span>
              <span className="font-game font-black text-2xl text-cyan-600 tracking-widest leading-none -mt-1 italic">
                QUEST
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-cyan-600 uppercase tracking-widest font-bold">กำลังสำรวจโดย</span>
                <span className="text-slate-800 font-game font-bold text-lg flex items-center gap-2">
                   {role === 'teacher' ? <><Crown size={16} className="text-amber-500" /> ระบบจัดการภารกิจ</> : <><User size={16} className="text-emerald-500"/> {currentStudent?.name}</>}
                </span>
             </div>
             <button 
               onClick={handleLogout}
               className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-2xl hover:bg-rose-50 border border-slate-200"
               title="ออกจากระบบ"
             >
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto z-10 p-4 md:p-8">
        {role === 'student' && currentStudent ? (
          <StudentView student={currentStudent} onRefresh={refreshStudentData} />
        ) : (
          <TeacherDashboard />
        )}
      </main>
    </div>
  );
};

export default App;
