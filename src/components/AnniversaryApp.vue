<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import type { AnniversaryEvent } from '../types/Anniversary';

// --- 1. 資料狀態 ---
const events = ref<AnniversaryEvent[]>([]);
const isLocked = ref(true); // 預設鎖定
const showModal = ref(false);

const form = reactive({
  id: '',
  title: '',
  date: new Date().toISOString().split('T')[0],
  color: '#ec4899' // 預設粉紅色
});

const palette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

// --- 2. 資料持久化 ---
const STORAGE_KEY = 'uni_life_anniversary_v1';

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      events.value = JSON.parse(saved);
    } catch (e) {
      console.error('讀取失敗', e);
    }
  }
});

watch(events, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true });

// --- 3. 核心計算邏輯 ---

// 計算相差天數
const getDaysInfo = (targetDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 歸零時間，只比日期
  
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { type: 'future', days: diffDays, text: '還有' };
  } else if (diffDays < 0) {
    return { type: 'past', days: Math.abs(diffDays), text: '已經' };
  } else {
    return { type: 'today', days: 0, text: '就是今天！' };
  }
};

// 排序：把最近要發生的(倒數)排前面，紀念日排後面
const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB; // 日期早的排前面
  });
});

// --- 4. 操作邏輯 ---
const toggleLock = () => {
  if (isLocked.value) {
    if (confirm('確定要進入編輯模式嗎？（解鎖後可新增或刪除紀念日）')) {
      isLocked.value = false;
    }
  } else {
    isLocked.value = true;
  }
};

const openAddModal = () => {
  if (isLocked.value) return;
  form.id = '';
  form.title = '';
  form.date = new Date().toISOString().split('T')[0];
  form.color = '#ec4899';
  showModal.value = true;
};

const saveEvent = () => {
  if (!form.title.trim()) return alert('請輸入名稱');
  if (!form.date) return alert('請選擇日期');

  events.value.push({
    id: Date.now().toString(),
    title: form.title,
    date: form.date,
    color: form.color
  });

  showModal.value = false;
};

const deleteEvent = (id: string) => {
  if (confirm('確定刪除這個紀念日嗎？')) {
    events.value = events.value.filter(e => e.id !== id);
  }
};
</script>

<template>
  <div class="anni-container">
    
    <div class="toolbar">
      <button 
        class="lock-btn" 
        :class="{ 'is-locked': isLocked }"
        @click="toggleLock"
      >
        {{ isLocked ? '🔒 唯讀模式' : '🔓 編輯模式' }}
      </button>

      <button 
        class="add-btn" 
        :disabled="isLocked"
        @click="openAddModal"
      >
        ＋ 新增日子
      </button>
    </div>

    <div class="hint-bar locked-hint" v-if="isLocked">
      🔒 列表已鎖定，請點擊上方按鈕解鎖以新增或刪除
    </div>
    <div class="hint-bar" v-else>
      💡 編輯模式已開啟！點擊卡片右上角的 ✕ 即可刪除。
    </div>

    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>目前還沒有任何紀錄，趕快新增一個重要的日子吧！</p>
    </div>

    <div class="events-grid">
      <div 
        v-for="ev in sortedEvents" 
        :key="ev.id" 
        class="event-card"
        :style="{ borderTopColor: ev.color }"
      >
        <button 
          v-if="!isLocked" 
          class="del-btn" 
          @click="deleteEvent(ev.id)"
        >✕</button>

        <div class="e-header">
          <div class="e-title" :style="{ color: ev.color }">{{ ev.title }}</div>
          <div class="e-date">{{ ev.date.replace(/-/g, ' / ') }}</div>
        </div>
        
        <div class="e-body">
          <template v-if="getDaysInfo(ev.date).type === 'today'">
            <div class="e-today-text" :style="{ color: ev.color }">✨ 就是今天 ✨</div>
          </template>
          
          <template v-else>
            <div class="e-prefix">{{ getDaysInfo(ev.date).text }}</div>
            <div class="e-days" :style="{ color: ev.color }">{{ getDaysInfo(ev.date).days }}</div>
            <div class="e-suffix">天</div>
          </template>
        </div>
        
        <div class="e-footer">
          <span class="badge" :style="{ backgroundColor: ev.color + '20', color: ev.color }">
            {{ getDaysInfo(ev.date).type === 'future' ? '🎯 倒數日' : (getDaysInfo(ev.date).type === 'past' ? '💖 紀念日' : '🎉 慶祝日') }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>⏳ 新增日子</h3>
        
        <div class="form-group">
          <label>名稱</label>
          <input type="text" v-model="form.title" placeholder="例如：學測、在一起、生日">
        </div>

        <div class="form-group">
          <label>日期</label>
          <input type="date" v-model="form.date">
        </div>

        <div class="form-group">
          <label>卡片顏色</label>
          <div class="color-palette">
            <div 
              v-for="c in palette" :key="c" 
              class="color-swatch" 
              :style="{ background: c }" 
              :class="{ selected: form.color === c }" 
              @click="form.color = c"
            ></div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="showModal = false">取消</button>
          <button class="save-btn" @click="saveEvent">確定新增</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.anni-container { max-width: 800px; margin: 0 auto; padding: 10px; }

/* Toolbar & Hint */
.toolbar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 15px; }
.lock-btn { background: white; border: 1px solid #ddd; color: #666; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.lock-btn.is-locked { background: #fff3e0; color: #f57c00; border-color: #f57c00; }
.add-btn { background: #ec4899; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2); }
.add-btn:hover:not(:disabled) { background: #db2777; }
.add-btn:disabled { background: #ccc; cursor: not-allowed; box-shadow: none; }

.hint-bar { background: rgba(236, 72, 153, 0.1); color: #ec4899; padding: 10px 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; text-align: center; font-weight: bold; }
.hint-bar.locked-hint { background: #fff3e0; color: #f57c00; }

/* Empty State */
.empty-state { text-align: center; padding: 50px 20px; background: white; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
.empty-icon { font-size: 4rem; margin-bottom: 10px; opacity: 0.5; filter: grayscale(1); }
.empty-state p { color: #94a3b8; font-size: 1rem; }

/* Grid & Cards */
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

.event-card { 
  background: white; border-radius: 16px; padding: 20px; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
  border-top: 6px solid #ccc;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}
.event-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

.del-btn { 
  position: absolute; top: 10px; right: 10px; 
  background: #fee2e2; color: #ef4444; border: none; 
  width: 28px; height: 28px; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; 
  cursor: pointer; font-weight: bold; transition: 0.2s;
}
.del-btn:hover { background: #ef4444; color: white; transform: scale(1.1); }

.e-header { margin-bottom: 15px; }
.e-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 4px; padding-right: 25px; }
.e-date { font-size: 0.85rem; color: #94a3b8; letter-spacing: 1px; }

.e-body { display: flex; align-items: baseline; gap: 8px; justify-content: center; padding: 10px 0 20px 0; }
.e-prefix { font-size: 1rem; color: #64748b; font-weight: bold; }
.e-days { font-size: 3.5rem; font-weight: 900; line-height: 1; text-shadow: 2px 2px 4px rgba(0,0,0,0.05); }
.e-suffix { font-size: 1rem; color: #64748b; font-weight: bold; }

.e-today-text { font-size: 2rem; font-weight: 900; padding: 10px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.05); }

.e-footer { border-top: 1px solid #f1f5f9; padding-top: 15px; display: flex; justify-content: center; }
.badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 25px; border-radius: 16px; width: 90%; max-width: 350px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.2s; }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { margin-top: 0; text-align: center; color: #333; margin-bottom: 20px; }

.form-group { margin-bottom: 15px; }
label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 8px; font-weight: bold; }
input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-size: 1rem; outline: none; }
input:focus { border-color: #ec4899; box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1); }

.color-palette { display: flex; gap: 10px; justify-content: space-between; }
.color-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: 0.1s; border: 2px solid transparent; }
.color-swatch.selected { transform: scale(1.15); border-color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; transition: 0.2s; }
.save-btn { background: #ec4899; color: white; }
.save-btn:hover { background: #db2777; }
</style>