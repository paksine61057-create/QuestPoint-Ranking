
import { Student, SubjectCode, SpecialStatus, SubjectMetadata } from '../types';
import { calculateTotalScore, calculateMaxRewards } from './gradingLogic';

const API_URL = 'https://script.google.com/macros/s/AKfycbwUe68OYusXDrVufjpeCT9V962PA7v4iBO_ZqI9XAcPgb4QaqZTR3oE_04qDkypYbYd/exec'; 

// Local storage keys for metadata (as fallback/cache)
const META_KEY_PREFIX = 'gradequest_meta_';

export const SheetService = {
  
  getAllStudents: async (): Promise<Student[]> => {
    if (!API_URL) return [];
    try {
      const response = await fetch(`${API_URL}?action=getAllStudents`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  getStudentById: async (id: string): Promise<Student | null> => {
    const students = await SheetService.getAllStudents();
    return students.find(s => s.id === id) || null;
  },

  updateStudentScore: async (
    id: string, 
    subject: SubjectCode, 
    field: 'assignments' | 'midterm' | 'final' | 'status' | 'rewardRights' | 'redeemedCount', 
    value: any,
    index?: number
  ): Promise<boolean> => {
    try {
      const payload = { action: 'updateScore', id, subject, field, value, index };
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error('Error updating score:', error);
      return false;
    }
  },

  redeemReward: async (id: string, subject: SubjectCode): Promise<boolean> => {
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
  },

  // Metadata Management
  getSubjectMetadata: async (subject: SubjectCode): Promise<SubjectMetadata> => {
    // Attempt to fetch from API if supported, or use localStorage as a bridge
    const cached = localStorage.getItem(META_KEY_PREFIX + subject);
    if (cached) return JSON.parse(cached);

    // Default Empty State
    return {
      assignments: Array(6).fill(null).map((_, i) => ({ name: `Assignment ${i+1}`, link: '' }))
    };
  },

  updateSubjectMetadata: async (subject: SubjectCode, meta: SubjectMetadata): Promise<boolean> => {
    localStorage.setItem(META_KEY_PREFIX + subject, JSON.stringify(meta));
    // In a real app, you'd send this to the GAS script too
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateMetadata', subject, meta })
      });
      return true;
    } catch (e) {
      return true; // Return true as we've saved to localStorage at least
    }
  }
};
