export interface CalendarEvent {
  id: string;
  date: string;      // 日期 (格式: YYYY-MM-DD)
  title: string;     // 事件名稱
  time: string;      // 時間 (格式: HH:mm)
  color: string;     // 標記顏色
}