// 課程類別
export type CourseCategory = '必修' | '選修' | '必選修';

// 單筆成績紀錄
export interface CourseGrade {
  id: string;
  semester: string;   // 學期，如 '112-1'
  name: string;       // 課程名稱
  credits: number;    // 學分數
  category: CourseCategory; // 必修/選修/必選修
  score: number;      // 成績
  moduleId: string;   // 歸屬的模組類別 ID (可為空)
}

// 畢業學分模組類別
export interface ModuleCategory {
  id: string;
  name: string;
  type: 'simple' | 'complex'; // 單一總學分 或 細分必/選修
  targetCredits: number;      // 給 simple 用的總目標
  targetReq: number;          // 給 complex 用的必修目標
  targetElec: number;         // 給 complex 用的選修目標
}