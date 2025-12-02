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

  // Gamified Rank System (Strict 15-point increments)
  // Bronze: 0-19
  // Silver: 20-34
  // Gold: 35-49
  // Platinum: 50-64
  // Diamond: 65-79
  // Commander: 80-94
  // Conqueror: 95+
  
  if (total >= 95) return Rank.CONQUEROR;
  if (total >= 80) return Rank.COMMANDER;
  if (total >= 65) return Rank.DIAMOND;
  if (total >= 50) return Rank.PLATINUM;
  if (total >= 35) return Rank.GOLD;
  if (total >= 20) return Rank.SILVER;
  return Rank.BRONZE;
};

export const calculateMaxRewards = (total: number): number => {
  // Grant 2 rights per rank level
  if (total >= 95) return 12; // Conqueror (6th rank * 2)
  if (total >= 80) return 10; // Commander (5th rank * 2)
  if (total >= 65) return 8; // Diamond (4th rank * 2)
  if (total >= 50) return 6; // Platinum (3rd rank * 2)
  if (total >= 35) return 4; // Gold (2nd rank * 2)
  if (total >= 20) return 2; // Silver (1st rank * 2)
  return 0; // Bronze
};

export const getNextRankInfo = (total: number): { nextRank: Rank | null; pointsNeeded: number; threshold: number } => {
  if (total >= 95) return { nextRank: null, pointsNeeded: 0, threshold: 100 };
  
  if (total >= 80) return { nextRank: Rank.CONQUEROR, pointsNeeded: 95 - total, threshold: 95 };
  if (total >= 65) return { nextRank: Rank.COMMANDER, pointsNeeded: 80 - total, threshold: 80 };
  if (total >= 50) return { nextRank: Rank.DIAMOND, pointsNeeded: 65 - total, threshold: 65 };
  if (total >= 35) return { nextRank: Rank.PLATINUM, pointsNeeded: 50 - total, threshold: 50 };
  if (total >= 20) return { nextRank: Rank.GOLD, pointsNeeded: 35 - total, threshold: 35 };
  
  return { nextRank: Rank.SILVER, pointsNeeded: 20 - total, threshold: 20 };
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