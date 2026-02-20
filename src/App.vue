<script setup lang="ts">
import { ref, computed } from 'vue';
import { currentSemester, semesterList } from './store'; 

import CourseTable from './components/CourseTable.vue';
import AccountingApp from './components/AccountingApp.vue';
import LotteryApp from './components/LotteryApp.vue';
import CalendarApp from './components/CalendarApp.vue';
import GradeApp from './components/GradeApp.vue';
import AnniversaryApp from './components/AnniversaryApp.vue';
import SettingsApp from './components/SettingsApp.vue';

const currentPage = ref('home');

// 學期區塊的鎖定狀態 (預設為鎖定)
const isSemesterLocked = ref(true);

const apps = [
  { id: 'schedule', name: '課表', icon: '📅', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'lottery', name: '幸運籤筒', icon: '🎰', bg: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
  { id: 'calendar', name: '行事曆', icon: '🗓️', bg: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' },
  { id: 'grades', name: '成績管理', icon: '💯', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'accounting', name: '記帳', icon: '💰', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'anniversary', name: '紀念日', icon: '⏳', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'settings', name: '設定', icon: '⚙️', bg: 'linear-gradient(135deg, #505285 0%, #585e92 12%, #65689f 25%, #7474b0 37%, #7e7ebb 50%, #8389c7 62%, #9795d4 75%, #a2a1dc 87%, #b5aee4 100%)' }
];

const openApp = (appId: string) => {
  if (appId === 'schedule') currentPage.value = 'schedule';
  else if (appId === 'accounting') currentPage.value = 'accounting';
  else if (appId === 'lottery') currentPage.value = 'lottery';
  else if (appId === 'calendar') currentPage.value = 'calendar';
  else if (appId === 'grades') currentPage.value = 'grades';
  else if (appId === 'anniversary') currentPage.value = 'anniversary';
  else if (appId === 'settings') currentPage.value = 'settings';
  else alert(`「${appId}」功能尚未實作！`);
};

const goHome = () => {
  currentPage.value = 'home';
};

const currentTitle = computed(() => {
  if (currentPage.value === 'home') return '校園王';
  const app = apps.find(a => a.id === currentPage.value);
  return app ? app.name : '校園王';
});

// --- 學期管理邏輯 ---

const toggleSemesterLock = () => {
  if (isSemesterLocked.value) {
    if (confirm('確定要進入編輯模式嗎？（開啟後可修改或刪除學期）')) {
      isSemesterLocked.value = false;
    }
  } else {
    isSemesterLocked.value = true;
  }
};

const addSemester = () => {
  if (isSemesterLocked.value) return;
  const newSem = prompt('請輸入新學期名稱 (例如: 112-2)');
  if (newSem && newSem.trim()) {
    if (!semesterList.value.includes(newSem.trim())) {
      semesterList.value.push(newSem.trim());
      currentSemester.value = newSem.trim();
    } else {
      alert('這個學期已經存在囉！');
      currentSemester.value = newSem.trim();
    }
  }
};

const editCurrentSemester = () => {
  if (isSemesterLocked.value) return;
  const oldName = currentSemester.value;
  const newName = prompt(`請輸入「${oldName}」的新名稱：`, oldName);
  
  if (newName && newName.trim() && newName.trim() !== oldName) {
    const finalName = newName.trim();
    if (semesterList.value.includes(finalName)) {
      return alert('此學期名稱已存在，請換一個名字！');
    }

    // 1. 更新清單與當前選擇
    const index = semesterList.value.indexOf(oldName);
    if (index !== -1) {
      semesterList.value[index] = finalName;
    }
    currentSemester.value = finalName;

    // 2. 自動連動更新 LocalStorage 裡的課表與成績資料
    try {
      const courses = JSON.parse(localStorage.getItem('uni_life_courses_v1') || '[]');
      let coursesChanged = false;
      courses.forEach((c: any) => { if (c.semester === oldName) { c.semester = finalName; coursesChanged = true; } });
      if (coursesChanged) localStorage.setItem('uni_life_courses_v1', JSON.stringify(courses));

      const grades = JSON.parse(localStorage.getItem('uni_life_grades_v1') || '[]');
      let gradesChanged = false;
      grades.forEach((g: any) => { if (g.semester === oldName) { g.semester = finalName; gradesChanged = true; } });
      if (gradesChanged) localStorage.setItem('uni_life_grades_v1', JSON.stringify(grades));
      
      alert(`已成功將學期重新命名為「${finalName}」，課表與成績已自動同步！`);
    } catch (e) {
      console.error('資料同步失敗', e);
    }
  }
};

const deleteCurrentSemester = () => {
  if (isSemesterLocked.value) return;

  // ✨ 加入防呆：如果清單只剩下一個學期，阻擋刪除並提示
  if (semesterList.value.length <= 1) {
    return alert('無法刪除！系統至少需要保留一個學期喔。');
  }

  const target = currentSemester.value;
  
  if (confirm(`⚠️ 警告：確定要刪除「${target}」嗎？\n這將會一併刪除該學期的【所有課表與成績】，且無法復原！`)) {
    // 1. 從清單移除
    semesterList.value = semesterList.value.filter(s => s !== target);
    
    // 將當前學期切換到陣列中的第一個
    currentSemester.value = semesterList.value[0];

    // 2. 自動連動刪除 LocalStorage 裡的關聯資料
    try {
      let courses = JSON.parse(localStorage.getItem('uni_life_courses_v1') || '[]');
      courses = courses.filter((c: any) => c.semester !== target);
      localStorage.setItem('uni_life_courses_v1', JSON.stringify(courses));

      let grades = JSON.parse(localStorage.getItem('uni_life_grades_v1') || '[]');
      grades = grades.filter((g: any) => g.semester !== target);
      localStorage.setItem('uni_life_grades_v1', JSON.stringify(grades));

      alert('學期與相關資料已徹底刪除。');
    } catch (e) {
      console.error('資料刪除失敗', e);
    }
  }
};
</script>

<template>
  <div>
    <nav class="top-bar">
      <button v-if="currentPage !== 'home'" class="back-btn" @click="goHome">⬅</button>
      <h1 class="app-title">{{ currentTitle }}</h1>
    </nav>

    <main class="main-content">
      <div v-if="currentPage === 'home'">
        <div class="semester-widget">
          <div class="semester-header">
            <div class="s-title">📅 目前學期</div>
            <button class="lock-btn-sm" :class="{ 'is-locked': isSemesterLocked }" @click="toggleSemesterLock">
              {{ isSemesterLocked ? '🔒 唯讀' : '🔓 編輯' }}
            </button>
          </div>

          <div class="semester-body">
            <select v-model="currentSemester" class="semester-select">
              <option v-for="sem in semesterList" :key="sem" :value="sem">{{ sem }}</option>
            </select>
            <div class="semester-actions" v-if="!isSemesterLocked">
              <button class="icon-btn-sm edit-btn" @click="editCurrentSemester" title="重新命名">✏️ 修改</button>
              <button class="icon-btn-sm del-btn" @click="deleteCurrentSemester" title="刪除學期">🗑️ 刪除</button>
              <button class="icon-btn-sm add-btn" @click="addSemester">➕ 新增</button>
            </div>
            <div class="semester-hint" v-else>
              💡 點選上方按鈕解鎖，即可新增或管理學期。
            </div>
          </div>
        </div>

        <div class="app-grid">
          <div v-for="app in apps" :key="app.id" class="app-item" @click="openApp(app.id)">
            <div class="app-icon" :style="{ background: app.bg }">{{ app.icon }}</div>
            <div class="app-label">{{ app.name }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="currentPage === 'schedule'"><CourseTable /></div>
      <div v-else-if="currentPage === 'accounting'"><AccountingApp /></div>
      <div v-else-if="currentPage === 'lottery'"><LotteryApp /></div>
      <div v-else-if="currentPage === 'calendar'"><CalendarApp /></div>
      <div v-else-if="currentPage === 'grades'"><GradeApp /></div>
      <div v-else-if="currentPage === 'anniversary'"><AnniversaryApp /></div>
      <div v-else-if="currentPage === 'settings'"><SettingsApp /></div>
    </main>
  </div>
</template>

<style>
/* 學期 Widget 樣式 */
.semester-widget {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  margin-bottom: 25px;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}

.semester-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 10px 15px;
  border-bottom: 1px solid #e2e8f0;
}

.s-title {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: bold;
}

.lock-btn-sm {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s;
}
.lock-btn-sm.is-locked {
  background: #fff3e0;
  color: #f57c00;
  border-color: #f57c00;
}

.semester-body {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.semester-select {
  font-size: 1.5rem;
  font-weight: bold;
  color: #0ea5e9;
  border: 2px solid transparent;
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  transition: 0.2s;
  width: 100%;
  text-align: center;
  /* 隱藏原生箭頭，讓畫面更乾淨 */
  appearance: none; 
}
.semester-select:hover {
  border-color: #bae6fd;
}

.semester-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.icon-btn-sm {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: 0.2s;
}

.edit-btn { background: #f1f5f9; color: #475569; }
.edit-btn:hover { background: #e2e8f0; }

.del-btn { background: #fee2e2; color: #ef4444; }
.del-btn:hover { background: #fca5a5; }

.add-btn { background: #10b981; color: white; flex-grow: 1; justify-content: center; }
.add-btn:hover { background: #059669; }

.semester-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #94a3b8;
  padding: 5px 0;
}
</style>