import React from 'react';
import { Rank } from '../types';
import { getRankColor } from '../services/gradingLogic';
import { Crown, Shield, Hexagon, Gem, Star, Trophy, Swords, Zap, Flame, Target, Disc, Sparkles } from 'lucide-react';

interface Props {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const RankBadge: React.FC<Props> = ({ rank, size = 'md', showLabel = true }) => {
  const colorClass = getRankColor(rank);

  const getIcon = () => {
    switch (rank) {
      case Rank.CONQUEROR:
        return (
           <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse-slow"></div>
              <Flame className="absolute w-[120%] h-[120%] text-orange-500/50 animate-pulse -bottom-1" />
              <Trophy className="relative z-10 w-full h-full text-red-100 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]" strokeWidth={1.5} />
              <Sparkles className="absolute -top-2 -right-2 w-1/2 h-1/2 text-yellow-200 animate-spin-slow" />
           </div>
        );
      case Rank.COMMANDER:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
             <Star className="absolute w-[130%] h-[130%] text-purple-600/30 animate-spin-slow opacity-70" />
             <Crown className="relative z-10 w-full h-full text-purple-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]" strokeWidth={1.5} />
          </div>
        );
      case Rank.DIAMOND:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full"></div>
             <Gem className="relative z-10 w-full h-full text-cyan-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" strokeWidth={1.5} />
             <Sparkles className="absolute top-0 left-0 w-1/3 h-1/3 text-white animate-pulse" />
          </div>
        );
      case Rank.PLATINUM:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <Hexagon className="absolute w-full h-full text-slate-500/30 rotate-90" strokeWidth={1} />
             <Zap className="relative z-10 w-[70%] h-[70%] text-slate-100 drop-shadow-[0_0_10px_rgba(241,245,249,0.8)] fill-slate-100" />
          </div>
        );
      case Rank.GOLD:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <Target className="relative z-10 w-full h-full text-yellow-200 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" strokeWidth={1.5} />
             <div className="absolute w-[40%] h-[40%] bg-yellow-400 rounded-full blur-[2px] animate-pulse"></div>
          </div>
        );
      case Rank.SILVER:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <Swords className="relative z-10 w-full h-full text-slate-200 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" strokeWidth={1.5} />
          </div>
        );
      case Rank.BRONZE:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <Shield className="relative z-10 w-full h-full text-orange-200 drop-shadow-[0_0_5px_rgba(234,88,12,0.5)]" strokeWidth={1.5} />
          </div>
        );
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40'
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${colorClass} relative group`}>
      <div className={`${sizeClasses[size]} relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2`}>
        {getIcon()}
      </div>

      {showLabel && (
        <div className="relative mt-2">
           <span className={`block ${textSizes[size]} font-game font-black uppercase tracking-[0.2em] text-center relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 group-hover:to-white transition-all`}>
            {rank}
           </span>
           <span className={`block ${textSizes[size]} font-game font-black uppercase tracking-[0.2em] text-center absolute inset-0 blur-sm opacity-50 ${colorClass}`}>
             {rank}
           </span>
        </div>
      )}
    </div>
  );
};
