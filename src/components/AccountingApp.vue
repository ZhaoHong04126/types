<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { customAlert, customConfirm } from '../store'; // ✨ 引入自訂對話框
import type { Transaction } from '../types/Accounting';
import Chart from 'chart.js/auto';

// --- 1. 資料狀態 ---
const transactions = ref<Transaction[]>([]);
const paymentMethods = ref<string[]>(['現金', '悠遊卡', '銀行存款']);
const showModal = ref(false);
const currentTab = ref<'records' | 'accounts' | 'stats'>('records');

// 新增帳戶 Modal 狀態
const showAddAccountModal = ref(false);

// 帳戶頁面的鎖定狀態 (預設為鎖定)
const isAccountLocked = ref(true);

// 圖表相關
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// 表單資料
const form = reactive({
  date: new Date().toISOString().split('T')[0],
  title: '',
  amount: '' as string | number,
  type: 'expense' as 'income' | 'expense' | 'transfer',
  method: '現金',
  to_method: ''
});

const accountForm = reactive({
  name: '',
  initAmount: '' as string | number
});

// --- 2. 資料持久化 ---
const STORAGE_KEY_TX = 'uni_life_acc_tx_v2';
const STORAGE_KEY_METHODS = 'uni_life_acc_methods_v2';

onMounted(() => {
  const savedTx = localStorage.getItem(STORAGE_KEY_TX);
  const savedMethods = localStorage.getItem(STORAGE_KEY_METHODS);
  
  if (savedTx) transactions.value = JSON.parse(savedTx);
  if (savedMethods) paymentMethods.value = JSON.parse(savedMethods);
});

watch(transactions, (val) => {
  localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(val));
  if (currentTab.value === 'stats') renderChart();
}, { deep: true });

watch(paymentMethods, (val) => {
  localStorage.setItem(STORAGE_KEY_METHODS, JSON.stringify(val));
}, { deep: true });

watch(currentTab, (newTab) => {
  if (newTab === 'stats') {
    nextTick(() => {
      renderChart();
    });
  }
});

// --- 3. 核心邏輯：計算統計與餘額 ---
const stats = computed(() => {
  let income = 0;
  let expense = 0;
  transactions.value.forEach(t => {
    if (t.type === 'income') income += Number(t.amount);
    if (t.type === 'expense') expense += Number(t.amount);
  });
  return { income, expense, balance: income - expense };
});

const accountBalances = computed(() => {
  const balances: Record<string, number> = {};
  paymentMethods.value.forEach(m => balances[m] = 0);

  transactions.value.forEach(t => {
    const amt = Number(t.amount);
    if (balances[t.method] === undefined) balances[t.method] = 0;
    
    if (t.type === 'income') balances[t.method] += amt;
    else if (t.type === 'expense') balances[t.method] -= amt;
    else if (t.type === 'transfer') {
      balances[t.method] -= amt;
      if (t.to_method) {
        if (balances[t.to_method] === undefined) balances[t.to_method] = 0;
        balances[t.to_method] += amt;
      }
    }
  });
  return balances;
});

const sortedTransactions = computed(() => {
  return [...transactions.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

// --- 4. 圖表繪製邏輯 ---
const renderChart = () => {
  if (!chartCanvas.value) return;
  const monthlyData: Record<string, { income: number, expense: number }> = {};
  
  transactions.value.forEach(t => {
    const month = t.date.slice(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    
    const amt = Number(t.amount);
    if (t.type === 'income') monthlyData[month].income += amt;
    else if (t.type === 'expense') monthlyData[month].expense += amt;
  });

  const labels = Object.keys(monthlyData).sort();
  const dataIncome = labels.map(m => monthlyData[m].income);
  const dataExpense = labels.map(m => monthlyData[m].expense);
  const dataBalance = labels.map(m => monthlyData[m].income - monthlyData[m].expense);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { type: 'line', label: '結餘', data: dataBalance, borderColor: '#f1c40f', borderWidth: 2, tension: 0.1, order: 0 },
        { label: '收入', data: dataIncome, backgroundColor: 'rgba(46, 204, 113, 0.6)', borderColor: '#2ecc71', borderWidth: 1, order: 1 },
        { label: '支出', data: dataExpense, backgroundColor: 'rgba(231, 76, 60, 0.6)', borderColor: '#e74c3c', borderWidth: 1, order: 2 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
};

// --- 5. 操作邏輯 (記帳) ---
const openModal = () => {
  form.date = new Date().toISOString().split('T')[0];
  form.title = '';
  form.amount = '';
  form.type = 'expense';
  form.method = paymentMethods.value[0] || '';
  form.to_method = '';
  showModal.value = true;
};

// ✨ 改用 customAlert
const addTransaction = async () => {
  if (!form.amount) return await customAlert('請輸入金額喔！', '💡 提示');
  if (form.type === 'transfer') {
    if (form.method === form.to_method) return await customAlert('轉出與轉入帳戶不能相同喔！', '💡 提示');
    if (!form.to_method) return await customAlert('請選擇轉入帳戶！', '💡 提示');
    if (!form.title) form.title = '轉帳';
  } else {
    if (!form.title) return await customAlert('請輸入項目說明喔！', '💡 提示');
  }

  transactions.value.push({
    id: Date.now().toString(),
    date: form.date,
    title: form.title,
    amount: Number(form.amount),
    type: form.type,
    method: form.method,
    to_method: form.type === 'transfer' ? form.to_method : undefined
  });

  showModal.value = false;
};

// ✨ 改用 customConfirm
const deleteTransaction = async (id: string) => {
  if (await customConfirm('確定要刪除這筆紀錄嗎？', '🗑️ 刪除確認')) {
    transactions.value = transactions.value.filter(t => t.id !== id);
  }
};

// --- 6. 操作邏輯 (帳戶管理) ---

// ✨ 改用 customConfirm
const toggleAccountLock = async () => {
  if (isAccountLocked.value) {
    if (await customConfirm('確定要進入編輯模式嗎？\n（開啟後可新增或刪除帳戶）', '🔓 解鎖確認')) {
      isAccountLocked.value = false;
    }
  } else {
    isAccountLocked.value = true;
  }
};

const openAddAccount = () => {
  if (isAccountLocked.value) return; 
  accountForm.name = '';
  accountForm.initAmount = '';
  showAddAccountModal.value = true;
};

// ✨ 改用 customAlert
const confirmAddAccount = async () => {
  const name = accountForm.name.trim();
  const initAmount = Number(accountForm.initAmount) || 0;

  if (!name) return await customAlert('請輸入帳戶名稱喔！', '💡 提示');
  if (paymentMethods.value.includes(name)) return await customAlert('此帳戶名稱已存在！', '⚠️ 提示');

  paymentMethods.value.push(name);

  if (initAmount > 0) {
    transactions.value.push({
      id: Date.now().toString(), 
      date: new Date().toISOString().split('T')[0],
      title: '初始餘額', 
      amount: initAmount, 
      type: 'income', 
      method: name
    });
  }

  showAddAccountModal.value = false;
};

// ✨ 改用 customConfirm
const deletePaymentMethod = async (name: string) => {
  if (await customConfirm(`確定刪除「${name}」？\n(這不會刪除歷史紀錄，但以後無法再選)`, '🗑️ 刪除確認')) {
    paymentMethods.value = paymentMethods.value.filter(m => m !== name);
  }
};
</script>

<template>
  <div class="acc-container">
    
    <div class="tabs">
      <button :class="{ active: currentTab === 'records' }" @click="currentTab = 'records'">📝 收支紀錄</button>
      <button :class="{ active: currentTab === 'accounts' }" @click="currentTab = 'accounts'">💳 帳戶餘額</button>
      <button :class="{ active: currentTab === 'stats' }" @click="currentTab = 'stats'">📊 統計圖表</button>
    </div>

    <div v-if="currentTab === 'records'">
      <div class="summary-card">
        <div class="summary-grid">
          <div class="stat-item"><div class="stat-label">總收入</div><div class="stat-value income">+${{ stats.income }}</div></div>
          <div class="stat-item border-sides"><div class="stat-label">總支出</div><div class="stat-value expense">-${{ stats.expense }}</div></div>
          <div class="stat-item"><div class="stat-label">淨資產</div><div class="stat-value" :class="stats.balance >= 0 ? 'income' : 'expense'">${{ stats.balance }}</div></div>
        </div>
        <button class="add-btn-large" @click="openModal">＋ 記一筆</button>
      </div>

      <div class="list-card">
        <div v-if="transactions.length === 0" class="empty-state">尚無紀錄</div>
        <div class="transaction-list">
          <div v-for="item in sortedTransactions" :key="item.id" class="t-item">
            <div class="t-date">{{ item.date.slice(5) }}</div>
            <div class="t-info">
              <div class="t-title">
                <span v-if="item.type === 'transfer'" class="badge transfer">轉帳</span>
                <span v-else-if="item.type === 'income'" class="badge income">收入</span>
                <span v-else class="badge expense">支出</span>
                {{ item.title }}
              </div>
              <div class="t-method">
                <span v-if="item.type === 'transfer'">{{ item.method }} ➝ {{ item.to_method }}</span>
                <span v-else>{{ item.method }}</span>
              </div>
            </div>
            <div class="t-amount" :class="item.type">
              {{ item.type === 'expense' ? '-' : (item.type === 'income' ? '+' : '') }}${{ item.amount }}
            </div>
            <button class="del-btn" @click="deleteTransaction(item.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentTab === 'accounts'" class="list-card">
      
      <div class="toolbar">
        <button 
          class="lock-btn" 
          :class="{ 'is-locked': isAccountLocked }"
          @click="toggleAccountLock"
        >
          {{ isAccountLocked ? '🔒 唯讀模式' : '🔓 編輯模式' }}
        </button>
      </div>

      <div class="hint-bar locked-hint" v-if="isAccountLocked">
        🔒 帳戶已鎖定，請點擊上方按鈕解鎖以編輯
      </div>
      <div class="hint-bar" v-else>
        💡 編輯模式已開啟，可新增或刪除帳戶
      </div>

      <h3 class="list-title">💳 資產帳戶</h3>
      <div class="account-list">
        <div v-for="method in paymentMethods" :key="method" class="acc-item">
          <div class="acc-info"><div class="acc-name">{{ method }}</div><div class="acc-label">當前餘額</div></div>
          <div class="acc-balance" :class="accountBalances[method] >= 0 ? 'income' : 'expense'">${{ accountBalances[method] }}</div>
          
          <button v-if="!isAccountLocked" class="del-btn-sm" @click="deletePaymentMethod(method)">🗑️</button>
        </div>
      </div>
      
      <button class="add-btn-large" :disabled="isAccountLocked" @click="openAddAccount" style="margin-top: 20px;">＋ 新增帳戶</button>
    </div>

    <div v-else-if="currentTab === 'stats'" class="list-card">
      <h3 class="list-title">📊 每月收支趨勢</h3>
      <div class="chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
      <p style="text-align: center; color: #999; font-size: 0.8rem; margin-top: 10px;">(柱狀圖：收支 | 線圖：結餘)</p>
    </div>

    <div v-if="showAddAccountModal" class="modal-overlay">
      <div class="modal-card">
        <h3>💳 新增帳戶</h3>
        <div class="form-group">
          <label>帳戶名稱</label>
          <input type="text" v-model="accountForm.name" placeholder="例如：LINE Pay, 錢包">
        </div>
        <div class="form-group">
          <label>初始餘額 (選填)</label>
          <input type="number" v-model="accountForm.initAmount" placeholder="例如：1000">
        </div>
        <div class="modal-actions">
          <button @click="showAddAccountModal = false">取消</button>
          <button class="save-btn" @click="confirmAddAccount">確定新增</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>💰 新增紀錄</h3>
        <div class="form-group">
          <label>類型</label>
          <div class="type-switch">
            <button :class="{ active: form.type === 'expense' }" @click="form.type = 'expense'" class="type-btn expense">💸 支出</button>
            <button :class="{ active: form.type === 'income' }" @click="form.type = 'income'" class="type-btn income">💰 收入</button>
            <button :class="{ active: form.type === 'transfer' }" @click="form.type = 'transfer'" class="type-btn transfer">🔁 轉帳</button>
          </div>
        </div>
        <div class="form-group"><label>日期</label><input type="date" v-model="form.date"></div>
        <div class="form-group" v-if="form.type !== 'transfer'"><label>項目</label><input v-model="form.title" placeholder="例如：午餐"></div>
        <div class="form-group"><label>金額</label><input type="number" v-model="form.amount" placeholder="100"></div>
        <div class="form-group">
          <label>{{ form.type === 'transfer' ? '轉出帳戶' : '支付方式' }}</label>
          <select v-model="form.method"><option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option></select>
        </div>
        <div class="form-group" v-if="form.type === 'transfer'">
          <label>轉入帳戶</label>
          <select v-model="form.to_method"><option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option></select>
        </div>
        <div class="modal-actions">
          <button @click="showModal = false">取消</button>
          <button class="save-btn" @click="addTransaction">確定</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 樣式保持原樣不變 */
.acc-container { max-width: 800px; margin: 0 auto; }
.tabs { display: flex; margin-bottom: 15px; background: #eef2f5; padding: 5px; border-radius: 8px; }
.tabs button { flex: 1; padding: 10px; border: none; background: transparent; color: #666; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.2s; }
.tabs button.active { background: #4a90e2; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.summary-card, .list-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.summary-grid { display: flex; justify-content: space-around; margin-bottom: 20px; }
.stat-item { text-align: center; flex: 1; }
.border-sides { border-left: 1px solid #eee; border-right: 1px solid #eee; }
.stat-label { font-size: 0.8rem; color: #888; margin-bottom: 5px; }
.stat-value { font-size: 1.4rem; font-weight: bold; }
.income { color: #2ecc71; } .expense { color: #e74c3c; } .transfer { color: #3498db; }
.t-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.t-date { font-size: 0.8rem; color: #888; width: 50px; }
.t-info { flex: 1; display: flex; flex-direction: column; }
.t-title { font-weight: bold; font-size: 0.95rem; color: #333; }
.t-method { font-size: 0.8rem; color: #aaa; }
.t-amount { font-weight: bold; width: 80px; text-align: right; margin-right: 10px; }
.acc-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f5f5f5; }
.acc-name { font-weight: bold; font-size: 1rem; color: #333; }
.acc-balance { font-size: 1.2rem; font-weight: bold; margin-right: 10px; }
.badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-weight: normal; }
.badge.income { background: #e8f5e9; color: #2ecc71; } .badge.expense { background: #ffebee; color: #e74c3c; } .badge.transfer { background: #e3f2fd; color: #3498db; }

.toolbar { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.lock-btn { background: white; border: 1px solid #ddd; color: #666; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
.lock-btn.is-locked { background: #fff3e0; color: #f57c00; border-color: #f57c00; }
.hint-bar { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; text-align: center; }
.hint-bar.locked-hint { background: #fff3e0; color: #f57c00; }

.add-btn-large { width: 100%; background: #333; color: white; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.add-btn-large:disabled { background: #ccc; cursor: not-allowed; } 
.del-btn { background: transparent; border: none; color: #ddd; font-size: 1.2rem; cursor: pointer; }
.del-btn-sm { background: transparent; border: 1px solid #eee; border-radius: 4px; padding: 4px 8px; cursor: pointer; }

.chart-container { position: relative; height: 300px; width: 100%; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 25px; border-radius: 16px; width: 85%; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.type-switch { display: flex; gap: 5px; }
.type-btn { flex: 1; padding: 8px; border: 1px solid #eee; background: white; border-radius: 6px; cursor: pointer; color: #999; font-weight: bold; font-size: 0.9rem; }
.type-btn.active.expense { background: #ffebee; color: #e74c3c; border-color: #e74c3c; }
.type-btn.active.income { background: #e8f5e9; color: #2ecc71; border-color: #2ecc71; }
.type-btn.active.transfer { background: #e3f2fd; color: #3498db; border-color: #3498db; }
.form-group { margin-bottom: 12px; }
label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 4px; }
input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 1rem; background: #fff; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; }
.save-btn { background: #333; color: white; font-weight: bold; }
</style>