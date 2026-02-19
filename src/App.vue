<script setup lang="ts">
import { ref, computed } from 'vue';
import { currentSemester, semesterList } from './store'; // ✨ 引入全域學期狀態

import CourseTable from './components/CourseTable.vue';
import AccountingApp from './components/AccountingApp.vue';
import LotteryApp from './components/LotteryApp.vue';
import CalendarApp from './components/CalendarApp.vue';
import GradeApp from './components/GradeApp.vue';

const currentPage = ref('home');

const apps = [
  { id: 'schedule', name: '課表', icon: '📅', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'lottery', name: '幸運籤筒', icon: '🎰', bg: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
  { id: 'calendar', name: '行事曆', icon: '🗓️', bg: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' },
  { id: 'grades', name: '成績管理', icon: '💯', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'accounting', name: '記帳', icon: '💰', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'settings', name: '設定', icon: '⚙️', bg: 'linear-gradient(135deg, #505285 0%, #585e92 12%, #65689f 25%, #7474b0 37%, #7e7ebb 50%, #8389c7 62%, #9795d4 75%, #a2a1dc 87%, #b5aee4 100%)' }
];

const openApp = (appId: string) => {
  if (appId === 'schedule') currentPage.value = 'schedule';
  else if (appId === 'accounting') currentPage.value = 'accounting';
  else if (appId === 'lottery') currentPage.value = 'lottery';
  else if (appId === 'calendar') currentPage.value = 'calendar';
  else if (appId === 'grades') currentPage.value = 'grades';
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

// ✨ 新增學期功能
const addSemester = () => {
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
          <div class="semester-info">
            <span class="widget-icon">📅</span>
            <div class="widget-text">
              <span class="widget-label">目前學期</span>
              <select v-model="currentSemester" class="semester-select">
                <option v-for="sem in semesterList" :key="sem" :value="sem">{{ sem }}</option>
              </select>
            </div>
          </div>
          <button class="btn-new-sem" @click="addSemester">+ 新學期</button>
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
    </main>
  </div>
</template>

<style>
/* ✨ 學期 Widget 樣式 */
.semester-widget {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
}
.semester-info { display: flex; align-items: center; gap: 15px; }
.widget-icon { font-size: 2rem; background: #e3f2fd; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
.widget-text { display: flex; flex-direction: column; gap: 4px; }
.widget-label { font-size: 0.85rem; color: #666; font-weight: bold; letter-spacing: 1px; }
.semester-select { font-size: 1.2rem; font-weight: bold; color: #4a90e2; border: none; background: transparent; padding: 0; cursor: pointer; outline: none; }
.btn-new-sem { padding: 8px 16px; border-radius: 10px; background: #2ecc71; color: white; border: none; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); }
</style>