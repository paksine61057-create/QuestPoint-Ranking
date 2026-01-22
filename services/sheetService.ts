
import { Student, SubjectCode, SpecialStatus, SubjectMetadata } from '../types';
import { calculateTotalScore, calculateMaxRewards } from './gradingLogic';

// นำ URL ที่ได้จากการ Deploy Google Apps Script (New Deployment) มาวางที่นี่
const API_URL = 'https://script.google.com/macros/s/AKfycbzZ-ApUwAdOCXjUhJb_zg0_N2VBss4cKj0Ek5KRwaSvSRG7Qa0J97PbFlK4oU_zyIc0/exec'; 

// Local storage keys for metadata (as fallback/cache)
const META_KEY_PREFIX = 'gradequest_meta_';

export const SheetService = {
  
  getAllStudents: async (): Promise<Student[]> => {
    if (!API_URL) return [];
    try {
      // เพิ่ม timestamp เพื่อป้องกัน cache ของ browser
      const response = await fetch(`${API_URL}?action=getAllStudents&t=${Date.now()}`);
      if (!response.ok) throw new Error('API request failed');
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
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return response.ok;
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
    try {
      const response = await fetch(`${API_URL}?action=getMetadata&subject=${subject}&t=${Date.now()}`);
      if (response.ok) {
        const remoteData = await response.json();
        if (remoteData && remoteData.assignments) {
          localStorage.setItem(META_KEY_PREFIX + subject, JSON.stringify(remoteData));
          return remoteData;
        }
      }
    } catch (error) {
      console.error('Error fetching remote metadata:', error);
    }

    const cached = localStorage.getItem(META_KEY_PREFIX + subject);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.assignments = parsed.assignments.map((a: any) => ({
        name: a.name,
        links: a.links || (a.link ? [a.link] : [''])
      }));
      return parsed;
    }

    return {
      assignments: Array(6).fill(null).map((_, i) => ({ name: `ภารกิจที่ ${i+1}`, links: [''] }))
    };
  },

  updateSubjectMetadata: async (subject: SubjectCode, meta: SubjectMetadata): Promise<boolean> => {
    localStorage.setItem(META_KEY_PREFIX + subject, JSON.stringify(meta));
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateMetadata', subject, meta })
      });
      return response.ok;
    } catch (e) {
      console.error('Error saving metadata to server:', e);
      return false;
    }
  }
};
