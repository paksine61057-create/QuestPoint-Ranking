import { Rank, ScoreData, SpecialStatus } from '../types';

export const calculateTotalScore = (scores: ScoreData): number => {
  const assignmentTotal = scores.assignments.reduce((a, b) => a + b, 0);
  return assignmentTotal + scores.midterm + scores.final;
};

export const calculateGrade = (total: number, status: SpecialStatus): string => {
  if (status !== 'Normal') return status; // Returns 'ร' or 'มส.'

  // Academic Grade follows standard rules
  if (total >= 80) return '4';
  if (total >= 75) return '3.5';
  if (total >= 70) return '3';
  if (total >= 65) return '2.5';
  if (total >= 60) return '2';
  if (total >= 55) return '1.5';
  if (total >= 50) return '1';
  return '0';
};

export const calculateRank = (total: number, status: SpecialStatus): Rank => {
  if (status !== 'Normal') return Rank.BRONZE;

  // Gamified Rank System (Easier progression)
  if (total >= 96) return Rank.CONQUEROR;
  if (total >= 90) return Rank.COMMANDER;
  if (total >= 75) return Rank.DIAMOND;
  if (total >= 60) return Rank.PLATINUM;
  if (total >= 45) return Rank.GOLD;
  if (total >= 30) return Rank.SILVER;
  return Rank.BRONZE;
};

export const calculateMaxRewards = (total: number): number => {
  if (total >= 96) return 6; // Conqueror
  if (total >= 90) return 5; // Commander
  if (total >= 75) return 4; // Diamond
  if (total >= 60) return 3; // Platinum
  if (total >= 45) return 2; // Gold
  if (total >= 30) return 1; // Silver
  return 0; // Bronze
};

export const getNextRankInfo = (total: number): { nextRank: Rank | null; pointsNeeded: number; threshold: number } => {
  if (total >= 96) return { nextRank: null, pointsNeeded: 0, threshold: 100 };
  
  if (total >= 90) return { nextRank: Rank.CONQUEROR, pointsNeeded: 96 - total, threshold: 96 };
  if (total >= 75) return { nextRank: Rank.COMMANDER, pointsNeeded: 90 - total, threshold: 90 };
  if (total >= 60) return { nextRank: Rank.DIAMOND, pointsNeeded: 75 - total, threshold: 75 };
  if (total >= 45) return { nextRank: Rank.PLATINUM, pointsNeeded: 60 - total, threshold: 60 };
  if (total >= 30) return { nextRank: Rank.GOLD, pointsNeeded: 45 - total, threshold: 45 };
  
  return { nextRank: Rank.SILVER, pointsNeeded: 30 - total, threshold: 30 };
};

export const getRankColor = (rank: Rank | null): string => {
  if (!rank) return 'text-slate-500'; // Fallback
  switch (rank) {
    case Rank.CONQUEROR: return 'text-red-500 from-red-500 to-orange-600';
    case Rank.COMMANDER: return 'text-purple-400 from-purple-500 to-indigo-600';
    case Rank.DIAMOND: return 'text-cyan-400 from-cyan-400 to-blue-500';
    case Rank.PLATINUM: return 'text-slate-200 from-slate-200 to-slate-400';
    case Rank.GOLD: return 'text-yellow-400 from-yellow-300 to-yellow-600';
    case Rank.SILVER: return 'text-gray-400 from-gray-400 to-gray-500';
    case Rank.BRONZE: return 'text-orange-700 from-orange-700 to-amber-900';
    default: return 'text-gray-500';
  }
};