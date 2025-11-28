import { Student, SubjectCode, SpecialStatus } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================
// Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbwUe68OYusXDrVufjpeCT9V962PA7v4iBO_ZqI9XAcPgb4QaqZTR3oE_04qDkypYbYd/exec'; 

// Fallback Mock Data (Used only if API_URL is empty or fetch fails completely in dev)
const MOCK_DB: Student[] = [
  {
    id: 'S001',
    name: 'Somchai Jaidee',
    subjects: {
      [SubjectCode.M1_HISTORY]: {
        scores: { assignments: [8, 9, 8, 10, 9, 8], midterm: 16, final: 18 },
        status: 'Normal',
        rewardRights: 2,
        redeemedCount: 0
      },
      [SubjectCode.M1_SOCIAL]: {
        scores: { assignments: [5, 6, 5, 5, 6, 5], midterm: 10, final: 10 },
        status: 'Normal',
        rewardRights: 0,
        redeemedCount: 0
      }
    }
  },
  {
    id: 'S002',
    name: 'Suda Rakrian',
    subjects: {
      [SubjectCode.M5_HISTORY]: {
        scores: { assignments: [10, 10, 10, 10, 10, 10], midterm: 19, final: 20 },
        status: 'Normal',
        rewardRights: 5,
        redeemedCount: 1
      },
      [SubjectCode.M5_SOCIAL]: {
        scores: { assignments: [10, 10, 10, 10, 10, 10], midterm: 20, final: 20 },
        status: 'Normal',
        rewardRights: 10,
        redeemedCount: 2
      }
    }
  },
  {
    id: 'admin', // Virtual Admin User for testing logic if needed, though login handles this separately
    name: 'Admin Teacher',
    subjects: {}
  }
];

export const SheetService = {
  
  // Fetch all students (For Teacher)
  getAllStudents: async (): Promise<Student[]> => {
    if (!API_URL) {
      console.warn('API_URL is empty. Using Mock Data.');
      return new Promise(resolve => setTimeout(() => resolve([...MOCK_DB]), 800));
    }

    try {
      const response = await fetch(`${API_URL}?action=getAllStudents`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  // Fetch single student by ID (For Student login)
  getStudentById: async (id: string): Promise<Student | null> => {
    const students = await SheetService.getAllStudents();
    return students.find(s => s.id === id) || null;
  },

  // Update student scores/status (For Teacher)
  updateStudentScore: async (
    id: string, 
    subject: SubjectCode, 
    field: 'assignments' | 'midterm' | 'final' | 'status' | 'rewardRights' | 'redeemedCount', 
    value: any,
    index?: number
  ): Promise<boolean> => {
    if (!API_URL) {
      // Mock update logic
      console.log('Mock Update:', { id, subject, field, value, index });
      const student = MOCK_DB.find(s => s.id === id);
      if (!student || !student.subjects[subject]) return false;
      const subData = student.subjects[subject]!;
      if (field === 'assignments' && typeof index === 'number') subData.scores.assignments[index] = Number(value);
      else if (field === 'midterm') subData.scores.midterm = Number(value);
      else if (field === 'final') subData.scores.final = Number(value);
      else if (field === 'status') subData.status = value as SpecialStatus;
      else if (field === 'rewardRights') subData.rewardRights = Number(value);
      else if (field === 'redeemedCount') subData.redeemedCount = Number(value);
      return true;
    }

    try {
      const payload = {
        action: 'updateScore',
        id,
        subject,
        field,
        value,
        index
      };

      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 'text/plain' prevents CORS preflight issues in simple GAS requests
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error('Error updating score:', error);
      return false;
    }
  },

  // Student uses a reward right
  redeemReward: async (id: string, subject: SubjectCode): Promise<boolean> => {
    if (!API_URL) {
       // Mock redeem logic
       const student = MOCK_DB.find(s => s.id === id);
       if (!student || !student.subjects[subject]) return false;
       if (student.subjects[subject]!.rewardRights > 0) {
         student.subjects[subject]!.rewardRights--;
         student.subjects[subject]!.redeemedCount++;
         return true;
       }
       return false;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
         headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'redeemReward', id, subject })
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return false;
    }
  }
};