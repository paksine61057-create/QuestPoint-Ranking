import React, { useState, useEffect } from 'react';
import { Role, Student } from './types';
import { SheetService } from './services/sheetService';
import { StudentView } from './components/StudentView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { Sparkles, LogOut, Gift, Star, Snowflake, Zap, User, Crown, Bell } from 'lucide-react';

// Snowfall Component
const Snowfall = () => {
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; size: string; delay: string; duration: string }[]>([]);
  
  useEffect(() => {
    const flakes = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 6 + 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 10}s`
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {snowflakes.map(flake => (
        <div 
          key={flake.id}
          className="snow-particle animate-snow"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            opacity: Math.random()
          }}
        />
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
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#1a2e1c] via-[#450a0a] to-[#1a2e1c]">
        <Snowfall />
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 text-white/10 animate-float"><Gift size={80} /></div>
        <div className="absolute bottom-20 right-10 text-white/10 animate-float-delayed"><Star size={100} /></div>
        <div className="absolute top-1/2 left-20 text-white/5 animate-twinkle"><Snowflake size={60} /></div>

        <div className="bg-[#1a2e1c]/80 backdrop-blur-xl max-w-lg w-full p-10 rounded-[3rem] shadow-[0_0_100px_rgba(153,27,27,0.4)] relative border border-white/10 z-10 group overflow-hidden">
          {/* Garland top effect */}
          <div className="absolute top-0 left-0 w-full h-2 flex justify-around">
            {Array.from({length: 10}).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full shadow-lg ${i % 2 === 0 ? 'bg-red-500 shadow-red-500/50' : 'bg-yellow-400 shadow-yellow-400/50'} animate-twinkle`} style={{animationDelay: `${i*0.3}s`}}></div>
            ))}
          </div>
          
          <div className="text-center mb-10">
            <h2 className="font-festive text-3xl text-yellow-200 mb-2 drop-shadow-md">Merry Learning & Happy New Year</h2>
            <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-yellow-500 tracking-wider italic drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
              GRADE
            </h1>
            <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-600 to-red-800 tracking-wider italic -mt-2">
              QUEST
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-[1px] w-12 bg-white/20"></div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60 font-bold">Festive Edition</span>
              <div className="h-[1px] w-12 bg-white/20"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group/input">
              <label className="block text-yellow-300 text-[10px] mb-2 uppercase tracking-[0.2em] font-bold ml-1 flex items-center gap-2">
                 <User size={12} className="text-red-400" /> เข้าสู่ระบบนักรบแห่งการเรียนรู้
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="รหัสนักเรียน 4 หลัก..."
                className="w-full bg-black/40 border border-white/10 text-white p-5 pl-6 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500/50 outline-none transition-all font-game text-xl shadow-inner placeholder:text-white/20 tracking-widest"
              />
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-xl text-sm flex items-center justify-center gap-3 animate-shake font-bold">
                <AlertIcon /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => handleLogin('student')}
                className="relative overflow-hidden bg-gradient-to-b from-green-700 to-green-900 text-white py-4 rounded-2xl font-bold border border-green-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1 group/btn"
              >
                <Snowflake size={20} className="group-hover/btn:rotate-180 transition-transform duration-1000" />
                <span className="font-game text-xs uppercase">นักเรียน</span>
              </button>
              
              <button 
                onClick={() => handleLogin('teacher')}
                className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-900 text-white py-4 rounded-2xl font-bold border border-red-400/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Crown size={20} className="text-yellow-400" />
                <span className="font-game text-xs uppercase tracking-wider">ครูอาจารย์</span>
              </button>
            </div>
            
            <div className="mt-8 text-center text-[10px] text-white/30 font-mono">
               <p>V.1.2.1 FESTIVE EDITION • 2024-2025</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[#052e16] text-slate-200">
      <Snowfall />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/20 to-transparent z-0"></div>
      
      <nav className="sticky top-0 z-[70] bg-game-dark/80 backdrop-blur-md border-b border-white/5 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover:scale-110 transition-transform">
              <Gift size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-game font-black text-2xl text-white tracking-widest leading-none italic">
                GRADE
              </span>
              <span className="font-game font-black text-2xl text-yellow-400 tracking-widest leading-none -mt-1 italic">
                QUEST
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Logged in as</span>
                <span className="text-white font-game font-bold text-lg flex items-center gap-2">
                   {role === 'teacher' ? <><Crown size={16} className="text-yellow-400" /> TEACHER MODE</> : <><User size={16} className="text-green-400"/> {currentStudent?.name}</>}
                </span>
             </div>
             <button 
               onClick={handleLogout}
               className="p-2 text-white/50 hover:text-red-400 transition-colors bg-white/5 rounded-full hover:bg-white/10"
               title="Logout"
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