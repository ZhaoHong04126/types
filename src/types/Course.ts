// src/types/Course.ts
export interface Course {
  id: string;
  name: string;      // 課程名稱
  location: string;  // 教室
  teacher: string;   // 老師
  day: number;       // 星期 (1-7)
  period: number;    // 節次
  color: string;     // 顏色 (舊版的核心功能)
}

export interface TimeSlot {
  period: number;
  label: string;
  time: string;
}