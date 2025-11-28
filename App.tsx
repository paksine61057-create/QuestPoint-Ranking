import React, { useState, useEffect } from 'react';
import { Role, Student } from './types';
import { SheetService } from './services/sheetService';
import { StudentView } from './components/StudentView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { Layout, Sparkles, LogOut, Gamepad2, Sword, Shield, Crown, Zap, Scroll, User } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loginId, setLoginId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (selectedRole: Role) => {
    setError('');
    if (selectedRole === 'teacher') {
      // Simple teacher check (In real app, use proper auth)
      if (loginId === 'admin') {
        setRole('teacher');
      } else {
        setError('Invalid Admin ID (Try "admin")');
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

  // --- Login Screen ---
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050b14]">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>
        
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-game-purple/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-game-blue/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-game-gold/5 rounded-full blur-[100px] animate-pulse"></div>

        {/* Floating Game Icons Background */}
        <div className="absolute top-20 left-20 text-white/5 animate-float"><Gamepad2 size={64} /></div>
        <div className="absolute bottom-40 left-10 text-white/5 animate-float-delayed"><Sword size={80} /></div>
        <div className="absolute top-40 right-20 text-white/5 animate-float"><Shield size={72} /></div>
        <div className="absolute bottom-20 right-32 text-white/5 animate-float-delayed"><Crown size={64} /></div>
        
        {/* Login Card */}
        <div className="glass-panel max-w-lg w-full p-10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] relative border border-white/10 backdrop-blur-2xl z-10 group overflow-hidden">
          
          {/* Top Border Laser Effect */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-game-gold to-transparent opacity-80 shadow-[0_0_20px_#fbbf24] animate-pulse"></div>
          
          {/* Title Section */}
          <div className="text-center mb-12 relative">
            <div className="relative inline-block">
               {/* Sparkles around title */}
               <Sparkles className="absolute -top-8 -right-8 text-game-gold animate-bounce w-8 h-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
               <Zap className="absolute -bottom-4 -left-8 text-game-cyan animate-pulse w-6 h-6 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
               
               <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 tracking-wider drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] italic">
                GRADE
              </h1>
              <h1 className="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-r from-game-gold via-yellow-300 to-yellow-600 tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] -mt-2 italic">
                QUEST
              </h1>
            </div>
            <p className="text-game-blueLight mt-4 text-xs font-bold tracking-[0.3em] uppercase opacity-80 border-t border-b border-white/10 py-2 mx-10">
              Education RPG System
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative group/input">
              <label className="block text-game-gold text-[10px] mb-2 uppercase tracking-[0.2em] font-bold ml-1 flex items-center gap-2">
                 <User size={12} /> Identify Your Character
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="รหัสนักเรียน 4 หลัก..."
                  className="w-full bg-slate-950/60 border border-slate-700/80 text-white p-5 pl-6 rounded-2xl focus:ring-2 focus:ring-game-gold focus:border-game-gold/50 outline-none transition-all font-game text-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-slate-600 placeholder:font-display group-hover/input:border-slate-500 tracking-widest"
                />
                <div className="absolute right-4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-game-gold rounded-full animate-pulse shadow-[0_0_10px_#fbbf24]"></div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm flex items-center justify-center gap-3 animate-shake shadow-[0_0_20px_rgba(239,68,68,0.2)] font-bold">
                <AlertIcon /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              {/* Student Button */}
              <button 
                onClick={() => handleLogin('student')}
                className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 hover:to-slate-800 text-white py-4 rounded-2xl font-bold border border-slate-600 hover:border-game-blue transition-all group/btn shadow-lg active:scale-95"
              >
                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <Sword size={24} className="text-slate-400 group-hover/btn:text-game-blue transition-colors mb-1" />
                  <span className="font-game text-sm uppercase tracking-wider">Student</span>
                </div>
                <div className="absolute inset-0 bg-game-blue/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                {/* Shine effect */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover/btn:animate-shine" />
              </button>
              
              {/* Teacher Button */}
              <button 
                onClick={() => handleLogin('teacher')}
                className="relative overflow-hidden bg-gradient-to-br from-game-gold to-yellow-700 hover:to-yellow-600 text-slate-900 py-4 rounded-2xl font-bold border border-yellow-500/50 hover:border-yellow-300 transition-all group/btn shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] active:scale-95"
              >
                 <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <Crown size={24} className="text-slate-900 mb-1" />
                  <span className="font-game text-sm uppercase tracking-wider">Teacher</span>
                </div>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              </button>
            </div>
            
            <div className="mt-10 flex items-center justify-center gap-6 opacity-60">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                 <span className="text-[10px] text-slate-500 font-mono uppercase">V.1.0.5 System Online</span>
               </div>
            </div>
            
            <div className="mt-4 text-center text-[10px] text-slate-600 border-t border-slate-800/50 pt-4 font-mono">
               <p className="text-slate-500">กรุณากรอกรหัสนักเรียน 4 หลักเพื่อเข้าสู่ระบบ</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Layout ---
  return (
    <div className="min-h-screen flex flex-col relative bg-[#020617]">
      <div className="fixed inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
      
      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-40 border-b border-white/5 shadow-lg backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-gradient-to-br from-game-gold via-orange-400 to-yellow-600 rounded-xl flex items-center justify-center font-bold text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.4)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.7)] transition-all transform group-hover:rotate-6 group-hover:scale-110">
              <Sparkles size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-game font-black text-2xl text-white tracking-widest leading-none group-hover:text-game-gold transition-colors italic">
                GRADE
              </span>
              <span className="font-game font-black text-2xl text-game-gold tracking-widest leading-none -mt-1 italic">
                QUEST
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-game-blueLight uppercase tracking-[0.2em] font-bold mb-0.5">Logged in as</span>
                <span className="text-white font-game font-bold text-lg text-glow-gold tracking-wide flex items-center gap-2">
                   {role === 'teacher' ? <><Crown size={16} className="text-game-gold" /> COMMANDER</> : <><User size={16} className="text-game-cyan"/> {currentStudent?.name}</>}
                </span>
             </div>
             <div className="h-10 w-[1px] bg-slate-700 hidden md:block"></div>
             <button 
               onClick={handleLogout}
               className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-all text-sm font-bold border border-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-800 hover:border-red-500/50 group bg-slate-900/50"
             >
               <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
               <span className="font-game text-xs tracking-wider">LOGOUT</span>
             </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto z-10 p-4 md:p-6">
        {role === 'student' && currentStudent ? (
          <StudentView student={currentStudent} onRefresh={refreshStudentData} />
        ) : (
          <TeacherDashboard />
        )}
      </main>
    </div>
  );
};

// Helper component for error icon
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
)

export default App;