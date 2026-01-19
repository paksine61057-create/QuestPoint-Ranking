
export type Role = 'teacher' | 'student';

export enum SubjectCode {
  M1_HISTORY = 'M1_History',
  M1_SOCIAL = 'M1_Social',
  M5_HISTORY = 'M5_History',
  M5_SOCIAL = 'M5_Social',
  M6_SOCIAL = 'M6_Social',
}

export enum Rank {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond',
  COMMANDER = 'Commander',
  CONQUEROR = 'Conqueror',
}

export type SpecialStatus = 'Normal' | 'ร' | 'มส.';

export interface AssignmentMeta {
  name: string;
  link: string;
}

export interface SubjectMetadata {
  assignments: AssignmentMeta[];
}

export interface ScoreData {
  assignments: number[]; // Array of 6 scores, max 10 each
  midterm: number; // Max 20
  final: number; // Max 20
}

export interface Student {
  id: string;
  name: string;
  subjects: {
    [key in SubjectCode]?: {
      scores: ScoreData;
      status: SpecialStatus;
      rewardRights: number; 
      redeemedCount: number; 
    }
  };
}

export interface UserContextType {
  role: Role | null;
  currentUser: Student | null;
  login: (role: Role, id?: string) => Promise<boolean>;
  logout: () => void;
}

export const SUBJECT_NAMES: Record<SubjectCode, string> = {
  [SubjectCode.M1_HISTORY]: 'ม.1 ประวัติศาสตร์',
  [SubjectCode.M1_SOCIAL]: 'ม.1 สังคมศึกษา',
  [SubjectCode.M5_HISTORY]: 'ม.5 ประวัติศาสตร์สากล',
  [SubjectCode.M5_SOCIAL]: 'ม.5 สังคมศึกษา',
  [SubjectCode.M6_SOCIAL]: 'ม.6 สังคมศึกษา',
};
