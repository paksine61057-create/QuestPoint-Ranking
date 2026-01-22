
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
    try {
      // ดึงข้อมูลจาก API จริง (Google Sheets)
      const response = await fetch(`${API_URL}?action=getMetadata&subject=${subject}`);
      if (response.ok) {
        const remoteData = await response.json();
        if (remoteData && remoteData.assignments) {
          // เก็บลง cache ไว้ด้วย
          localStorage.setItem(META_KEY_PREFIX + subject, JSON.stringify(remoteData));
          return remoteData;
        }
      }
    } catch (error) {
      console.error('Error fetching remote metadata:', error);
    }

    // หากดึงจาก API ไม่สำเร็จ ให้ลองดึงจาก Cache
    const cached = localStorage.getItem(META_KEY_PREFIX + subject);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.assignments = parsed.assignments.map((a: any) => ({
        name: a.name,
        links: a.links || (a.link ? [a.link] : [''])
      }));
      return parsed;
    }

    // Default Empty State หากไม่มีข้อมูลเลย
    return {
      assignments: Array(6).fill(null).map((_, i) => ({ name: `ภารกิจที่ ${i+1}`, links: [''] }))
    };
  },

  updateSubjectMetadata: async (subject: SubjectCode, meta: SubjectMetadata): Promise<boolean> => {
    // บันทึกที่ Local ก่อนเพื่อความรวดเร็วในการแสดงผลที่เครื่องตัวเอง
    localStorage.setItem(META_KEY_PREFIX + subject, JSON.stringify(meta));
    try {
      // ส่งไปบันทึกที่ Server จริง
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
