export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer'; // 收入 或 支出 或 轉出轉入(帳內)
  method: string;                          // 支付方式 (或轉出帳號)
  to_method: string;                       // 轉入帳戶 (僅轉帳用)
}