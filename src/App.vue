<script setup lang="ts">
import { ref, computed } from 'vue';
// ✨ 引入我們剛剛寫的自訂對話框控制器
import { currentSemester, semesterList, userName, customAlert, customConfirm, customPrompt, dialogState, closeDialog } from './store'; 

import CourseTable from './components/CourseTable.vue';
import AccountingApp from './components/AccountingApp.vue';
import LotteryApp from './components/LotteryApp.vue';
import CalendarApp from './components/CalendarApp.vue';
import GradeApp from './components/GradeApp.vue';
import SettingsApp from './components/SettingsApp.vue';
import AnniversaryApp from './components/AnniversaryApp.vue';

const currentPage = ref('home');
const isSemesterLocked = ref(true);

const apps = [
  { id: 'schedule', name: '課表', icon: '📅', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'lottery', name: '幸運籤筒', icon: '🎰', bg: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
  { id: 'calendar', name: '行事曆', icon: '🗓️', bg: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' },
  { id: 'anniversary', name: '紀念日', icon: '⏳', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
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
  else if (appId === 'settings') currentPage.value = 'settings';
  else if (appId === 'anniversary') currentPage.value = 'anniversary';
  else customAlert(`「${appId}」功能尚未實作！`);
};

const goHome = () => {
  currentPage.value = 'home';
};

const currentTitle = computed(() => {
  if (currentPage.value === 'home') return '校園王';
  const app = apps.find(a => a.id === currentPage.value);
  return app ? app.name : '校園王';
});

// --- ✨ 學期管理邏輯 (全面改用內建跳窗，並加上 async/await) ---

const toggleSemesterLock = async () => {
  if (isSemesterLocked.value) {
    const isConfirmed = await customConfirm('確定要進入編輯模式嗎？\n（開啟後可修改或刪除學期）', '🔓 解鎖確認');
    if (isConfirmed) {
      isSemesterLocked.value = false;
    }
  } else {
    isSemesterLocked.value = true;
  }
};

const addSemester = async () => {
  if (isSemesterLocked.value) return;
  const newSem = await customPrompt('請輸入新學期名稱：', '', '例如: 112-2', '➕ 新增學期');
  
  if (newSem && newSem.trim()) {
    if (!semesterList.value.includes(newSem.trim())) {
      semesterList.value.push(newSem.trim());
      currentSemester.value = newSem.trim();
    } else {
      await customAlert('這個學期已經存在囉！', '⚠️ 注意');
      currentSemester.value = newSem.trim();
    }
  }
};

const editCurrentSemester = async () => {
  if (isSemesterLocked.value) return;
  const oldName = currentSemester.value;
  const newName = await customPrompt(`請為「${oldName}」輸入新名稱：`, oldName, '例如: 大二上', '✏️ 重新命名');
  
  if (newName && newName.trim() && newName.trim() !== oldName) {
    const finalName = newName.trim();
    if (semesterList.value.includes(finalName)) {
      return await customAlert('此學期名稱已存在，請換一個名字！', '⚠️ 注意');
    }

    const index = semesterList.value.indexOf(oldName);
    if (index !== -1) semesterList.value[index] = finalName;
    currentSemester.value = finalName;

    try {
      const courses = JSON.parse(localStorage.getItem('uni_life_courses_v1') || '[]');
      let coursesChanged = false;
      courses.forEach((c: any) => { if (c.semester === oldName) { c.semester = finalName; coursesChanged = true; } });
      if (coursesChanged) localStorage.setItem('uni_life_courses_v1', JSON.stringify(courses));

      const grades = JSON.parse(localStorage.getItem('uni_life_grades_v1') || '[]');
      let gradesChanged = false;
      grades.forEach((g: any) => { if (g.semester === oldName) { g.semester = finalName; gradesChanged = true; } });
      if (gradesChanged) localStorage.setItem('uni_life_grades_v1', JSON.stringify(grades));
      
      await customAlert(`已成功將學期重新命名為「${finalName}」！\n課表與成績已自動同步。`, '✅ 修改成功');
    } catch (e) {
      console.error('資料同步失敗', e);
    }
  }
};

const deleteCurrentSemester = async () => {
  if (isSemesterLocked.value) return;

  if (semesterList.value.length <= 1) {
    return await customAlert('無法刪除！系統至少需要保留一個學期喔。', '🛑 刪除失敗');
  }

  const target = currentSemester.value;
  const isConfirmed = await customConfirm(`確定要刪除「${target}」嗎？\n\n這將會一併刪除該學期的【所有課表與成績】，且無法復原！`, '🚨 嚴重警告');
  
  if (isConfirmed) {
    semesterList.value = semesterList.value.filter(s => s !== target);
    currentSemester.value = semesterList.value[0];

    try {
      let courses = JSON.parse(localStorage.getItem('uni_life_courses_v1') || '[]');
      courses = courses.filter((c: any) => c.semester !== target);
      localStorage.setItem('uni_life_courses_v1', JSON.stringify(courses));

      let grades = JSON.parse(localStorage.getItem('uni_life_grades_v1') || '[]');
      grades = grades.filter((g: any) => g.semester !== target);
      localStorage.setItem('uni_life_grades_v1', JSON.stringify(grades));

      await customAlert('學期與相關資料已徹底刪除。', '🗑️ 刪除成功');
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
        
        <h2 style="margin: 0 0 15px 5px; color: #334155; font-size: 1.4rem;">
          👋 嗨，{{ userName }}！
        </h2>

        <div class="semester-widget">
          <div class="semester-header">
            <div class="s-title">📅 目前學期</div>
            <button 
              class="lock-btn-sm" 
              :class="{ 'is-locked': isSemesterLocked }" 
              @click="toggleSemesterLock"
            >
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
      <div v-else-if="currentPage === 'settings'"><SettingsApp /></div>
      <div v-else-if="currentPage === 'anniversary'"><AnniversaryApp /></div>
    </main>

    <div v-if="dialogState.isOpen" class="global-dialog-overlay">
      <div class="global-dialog-card">
        <h3 class="gd-title">{{ dialogState.title }}</h3>
        <p class="gd-message">{{ dialogState.message }}</p>
        
        <div v-if="dialogState.type === 'prompt'" class="gd-input-wrapper">
          <input 
            type="text" 
            v-model="dialogState.inputValue" 
            :placeholder="dialogState.inputPlaceholder"
            class="gd-input"
            @keyup.enter="closeDialog(dialogState.inputValue)"
            autofocus
          />
        </div>

        <div class="gd-actions">
          <button 
            v-if="dialogState.type === 'confirm' || dialogState.type === 'prompt'" 
            class="gd-btn gd-cancel" 
            @click="closeDialog(dialogState.type === 'prompt' ? null : false)"
          >
            取消
          </button>
          
          <button 
            class="gd-btn gd-confirm" 
            @click="closeDialog(dialogState.type === 'prompt' ? dialogState.inputValue : (dialogState.type === 'confirm' ? true : undefined))"
          >
            確定
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* 學期 Widget 樣式 (維持不變) */
.semester-widget { background: white; border-radius: 16px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04); margin-bottom: 25px; overflow: hidden; border: 1px solid #f1f5f9; }
.semester-header { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
.s-title { font-size: 0.9rem; color: #64748b; font-weight: bold; }
.lock-btn-sm { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: all 0.2s; }
.lock-btn-sm.is-locked { background: #fff3e0; color: #f57c00; border-color: #f57c00; }
.semester-body { padding: 15px; display: flex; flex-direction: column; gap: 12px; }
.semester-select { font-size: 1.5rem; font-weight: bold; color: #0ea5e9; border: 2px solid transparent; background: #f0f9ff; padding: 8px 12px; border-radius: 10px; cursor: pointer; outline: none; transition: 0.2s; width: 100%; text-align: center; appearance: none; }
.semester-select:hover { border-color: #bae6fd; }
.semester-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.icon-btn-sm { padding: 8px 12px; border: none; border-radius: 8px; font-weight: bold; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
.edit-btn { background: #f1f5f9; color: #475569; } .edit-btn:hover { background: #e2e8f0; }
.del-btn { background: #fee2e2; color: #ef4444; } .del-btn:hover { background: #fca5a5; }
.add-btn { background: #10b981; color: white; flex-grow: 1; justify-content: center; } .add-btn:hover { background: #059669; }
.semester-hint { text-align: center; font-size: 0.85rem; color: #94a3b8; padding: 5px 0; }

/* ================================================= */
/* ✨ 全域自訂跳窗 (Global Dialog) 樣式 */
/* ================================================= */
.global-dialog-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(3px);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999; /* 確保它在最上層 */
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.global-dialog-card {
  background: white; border-radius: 16px; padding: 25px;
  width: 85%; max-width: 320px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: popUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popUp { from { transform: scale(0.9); } to { transform: scale(1); } }

.gd-title { margin-top: 0; margin-bottom: 10px; color: #334155; font-size: 1.15rem; font-weight: bold; }
.gd-message { color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px; white-space: pre-wrap; }

.gd-input-wrapper { margin-bottom: 20px; }
.gd-input { 
  width: 100%; padding: 12px; border: 1px solid #cbd5e1; 
  border-radius: 8px; box-sizing: border-box; font-size: 1rem; 
  outline: none; transition: 0.2s; background: #f8fafc;
}
.gd-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); background: white; }

.gd-actions { display: flex; gap: 10px; justify-content: flex-end; }
.gd-btn { padding: 10px 16px; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.1s; flex: 1; }
.gd-btn:active { transform: scale(0.95); }
.gd-cancel { background: #f1f5f9; color: #64748b; }
.gd-cancel:hover { background: #e2e8f0; }
.gd-confirm { background: #3b82f6; color: white; }
.gd-confirm:hover { background: #2563eb; }
</style>