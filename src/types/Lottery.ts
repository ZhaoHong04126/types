export interface LotteryCategory {
  id: string;
  name: string;      // 籤筒名稱 (例如: 午餐吃什麼)
  items: string[];   // 籤的選項 (例如: ['麥當勞', '八方雲集', '學餐'])
}