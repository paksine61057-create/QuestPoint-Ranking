
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
      type: Math.random() > 0.5 ? 'leaf' : 'petal'
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
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
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
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#134e4a] via-[#0f172a] to-[#1e3a8a]">
        <NatureParticles />
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 text-yellow-400/20 animate-float"><Sun size={120} /></div>
        <div className="absolute bottom-20 left-10 text-rose-400/10 animate-float-delayed"><Flower size={100} /></div>
        <div className="absolute top-1/2 right-20 text-emerald-400/5 animate-twinkle"><Leaf size={60} /></div>

        <div className="bg-white/5 backdrop-blur-2xl max-w-lg w-full p-10 rounded-[3.5rem] shadow-[0_0_100px_rgba(20,184,166,0.3)] relative border border-white/10 z-10 group overflow-hidden">
          {/* Top light effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          
          <div className="text-center mb-10">
            <h2 className="font-festive text-2xl text-cyan-200 mb-2 drop-shadow-md">ฤดูกาลแห่งการเรียนรู้</h2>
            <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-emerald-400 tracking-wider italic drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              GRADE
            </h1>
            <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 tracking-wider italic -mt-2">
              QUEST
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-[1px] w-12 bg-white/20"></div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">ฉบับตามฤดูกาล</span>
              <div className="h-[1px] w-12 bg-white/20"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group/input">
              <label className="block text-cyan-300 text-[10px] mb-2 uppercase tracking-[0.2em] font-bold ml-1 flex items-center gap-2">
                 <User size={12} className="text-amber-400" /> เข้าสู่ระบบนักรบแห่งการเรียนรู้
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="กรอกรหัสนักเรียน..."
                className="w-full bg-black/40 border border-white/10 text-white p-5 pl-6 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-game text-xl shadow-inner placeholder:text-white/10 tracking-widest"
              />
            </div>
            
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 text-rose-100 p-4 rounded-xl text-sm flex items-center justify-center gap-3 animate-shake font-bold">
                <AlertIcon /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => handleLogin('student')}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 text-white py-4 rounded-2xl font-bold border border-emerald-400/20 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1 group/btn"
              >
                <Wind size={20} className="group-hover/btn:translate-x-4 transition-transform duration-500" />
                <span className="font-game text-[10px] uppercase">นักเรียน</span>
              </button>
              
              <button 
                onClick={() => handleLogin('teacher')}
                className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 text-white py-4 rounded-2xl font-bold border border-blue-400/20 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Crown size={20} className="text-amber-300" />
                <span className="font-game text-[10px] uppercase">ครูอาจารย์</span>
              </button>
            </div>
            
            <div className="mt-8 text-center text-[10px] text-white/20 font-mono">
               <p>V.1.2.2 SEASONAL EDITION • {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[#0f172a] text-slate-200">
      <NatureParticles />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-cyan-900/10 to-transparent z-0"></div>
      
      <nav className="sticky top-0 z-[70] bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] group-hover:rotate-12 transition-all">
              <Compass size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-game font-black text-2xl text-white tracking-widest leading-none italic">
                GRADE
              </span>
              <span className="font-game font-black text-2xl text-cyan-400 tracking-widest leading-none -mt-1 italic">
                QUEST
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">กำลังสำรวจโดย</span>
                <span className="text-white font-game font-bold text-lg flex items-center gap-2">
                   {role === 'teacher' ? <><Crown size={16} className="text-amber-400" /> ระบบจัดการภารกิจ</> : <><User size={16} className="text-emerald-400"/> {currentStudent?.name}</>}
                </span>
             </div>
             <button 
               onClick={handleLogout}
               className="p-2.5 text-white/50 hover:text-rose-400 transition-colors bg-white/5 rounded-2xl hover:bg-white/10"
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
