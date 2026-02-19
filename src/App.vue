<script setup lang="ts">
import { ref, computed } from 'vue';
import CourseTable from './components/CourseTable.vue';

// 1. 定義頁面狀態 ('home' | 'schedule' | 'settings' ...)
const currentPage = ref('home');

// 2. 定義 APP 列表 (還原源專案的樣式與漸層)
const apps = [
  { 
    id: 'schedule', 
    name: '課表', 
    icon: '📅', 
    bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
  },
  { 
    id: 'lottery', 
    name: '幸運籤筒', 
    icon: '🎰', 
    bg: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' 
  },
  { 
    id: 'calendar', 
    name: '行事曆', 
    icon: '🗓️', 
    bg: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' 
  },
  { 
    id: 'grades', 
    name: '成績管理', 
    icon: '💯', 
    bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
  },
  { 
    id: 'accounting', 
    name: '記帳', 
    icon: '💰', 
    bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' 
  },
  { 
    id: 'settings', 
    name: '設定', 
    icon: '⚙️', 
    bg: 'linear-gradient(135deg, #505285 0%, #585e92 12%, #65689f 25%, #7474b0 37%, #7e7ebb 50%, #8389c7 62%, #9795d4 75%, #a2a1dc 87%, #b5aee4 100%)' 
  }
];

// 3. 切換頁面函式
const openApp = (appId: string) => {
  if (appId === 'schedule') {
    currentPage.value = 'schedule';
  } else {
    alert(`「${appId}」功能尚未實作，請先測試課表！`);
  }
};

const goHome = () => {
  currentPage.value = 'home';
};

// 4. 動態標題
const currentTitle = computed(() => {
  if (currentPage.value === 'home') return '校園王';
  const app = apps.find(a => a.id === currentPage.value);
  return app ? app.name : '校園王';
});
</script>

<template>
  <div>
    <nav class="top-bar">
      <button v-if="currentPage !== 'home'" class="back-btn" @click="goHome">
        ⬅
      </button>
      <h1 class="app-title">{{ currentTitle }}</h1>
    </nav>

    <main class="main-content">
      <div v-if="currentPage === 'home'" class="app-grid">
        <div 
          v-for="app in apps" 
          :key="app.id" 
          class="app-item" 
          @click="openApp(app.id)"
        >
          <div class="app-icon" :style="{ background: app.bg }">
            {{ app.icon }}
          </div>
          <div class="app-label">{{ app.name }}</div>
        </div>
      </div>

      <div v-else-if="currentPage === 'schedule'">
        <CourseTable />
      </div>

      <div v-else>
        <p style="text-align: center; color: #999;">功能開發中...</p>
      </div>
    </main>
  </div>
</template>

<style>
/* 這裡不需要寫樣式，因為已經移到 style.css 統一管理 */
</style>