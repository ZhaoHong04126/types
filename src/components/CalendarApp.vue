<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { customAlert, customConfirm } from '../store'; // ✨ 引入自訂彈窗
import type { CalendarEvent } from '../types/Calendar';

const events = ref<CalendarEvent[]>([]);
const currentDate = ref(new Date()); 
const selectedDate = ref('');        
const showModal = ref(false);

const form = reactive({ id: '', title: '', time: '12:00', color: '#3b82f6' });
const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

const STORAGE_KEY = 'uni_life_calendar_v1';

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { try { events.value = JSON.parse(saved); } catch (e) { console.error(e); } }
  selectedDate.value = formatDate(new Date());
});

watch(events, (newVal) => localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal)), { deep: true });

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const formatDate = (d: Date) => {
  const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const currentMonthText = computed(() => `${currentDate.value.getFullYear()} 年 ${currentDate.value.getMonth() + 1} 月`);

const calendarGrid = computed(() => {
  const year = currentDate.value.getFullYear(); const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(formatDate(new Date(year, month, i)));
  return grid;
});

const prevMonth = () => { const d = new Date(currentDate.value); d.setMonth(d.getMonth() - 1); currentDate.value = d; };
const nextMonth = () => { const d = new Date(currentDate.value); d.setMonth(d.getMonth() + 1); currentDate.value = d; };
const selectDate = (dateStr: string | null) => { if (dateStr) selectedDate.value = dateStr; };

const getEventsForDate = (dateStr: string) => events.value.filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
const selectedDateEvents = computed(() => { if (!selectedDate.value) return []; return getEventsForDate(selectedDate.value); });
const hasEvents = (dateStr: string) => getEventsForDate(dateStr).length > 0;

// ✨ 改用自訂彈窗
const openAddModal = async () => {
  if (!selectedDate.value) return await customAlert('請先選擇日期喔！', '💡 提示');
  form.id = ''; form.title = ''; form.time = '12:00'; form.color = '#3b82f6';
  showModal.value = true;
};

// ✨ 改用自訂彈窗
const saveEvent = async () => {
  if (!form.title.trim()) return await customAlert('請輸入行程內容喔！', '💡 提示');
  events.value.push({ id: Date.now().toString(), date: selectedDate.value, title: form.title, time: form.time, color: form.color });
  showModal.value = false;
};

// ✨ 改用自訂彈窗
const deleteEvent = async (id: string) => {
  if (await customConfirm('確定刪除這個行程嗎？', '🗑️ 刪除確認')) {
    events.value = events.value.filter(e => e.id !== id);
  }
};
</script>

<template>
  <div class="calendar-container">
    <div class="calendar-card">
      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth">◀</button><h2 class="month-title">{{ currentMonthText }}</h2><button class="nav-btn" @click="nextMonth">▶</button>
      </div>
      <div class="calendar-grid">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        <div v-for="(dateStr, index) in calendarGrid" :key="index" class="day-cell" :class="{ 'is-empty': !dateStr, 'is-selected': dateStr === selectedDate, 'is-today': dateStr === formatDate(new Date()) }" @click="selectDate(dateStr)">
          <span v-if="dateStr" class="day-num">{{ parseInt(dateStr.split('-')[2]) }}</span>
          <div v-if="dateStr && hasEvents(dateStr)" class="event-dots"><div v-for="(ev, idx) in getEventsForDate(dateStr).slice(0, 3)" :key="idx" class="dot" :style="{ backgroundColor: ev.color }"></div></div>
        </div>
      </div>
    </div>

    <div class="events-card">
      <div class="events-header">
        <h3 class="selected-date-title">{{ selectedDate ? selectedDate.replace(/-/g, '/') + ' 行程' : '請選擇日期' }}</h3>
        <button class="add-event-btn" :disabled="!selectedDate" @click="openAddModal">＋ 新增</button>
      </div>
      <div v-if="selectedDateEvents.length === 0" class="empty-state">這天沒有安排行程喔！🌴</div>
      <div v-else class="event-list">
        <div v-for="ev in selectedDateEvents" :key="ev.id" class="event-item">
          <div class="event-color-bar" :style="{ backgroundColor: ev.color }"></div><div class="event-time">{{ ev.time }}</div><div class="event-title">{{ ev.title }}</div>
          <button class="del-btn" @click="deleteEvent(ev.id)">×</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>📅 新增行程</h3>
        <div class="form-group"><label>日期</label><input type="text" :value="selectedDate" disabled class="disabled-input"></div>
        <div class="form-group"><label>時間</label><input type="time" v-model="form.time"></div>
        <div class="form-group"><label>行程內容</label><input type="text" v-model="form.title" placeholder="例如：開會、交作業"></div>
        <div class="form-group">
          <label>標記顏色</label>
          <div class="color-palette"><div v-for="c in palette" :key="c" class="color-swatch" :style="{ background: c }" :class="{ selected: form.color === c }" @click="form.color = c"></div></div>
        </div>
        <div class="modal-actions"><button @click="showModal = false">取消</button><button class="save-btn" @click="saveEvent">確定</button></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 樣式與原版相同 */
.calendar-container { max-width: 600px; margin: 0 auto; padding: 10px; }
.calendar-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.month-title { margin: 0; font-size: 1.2rem; color: #333; }
.nav-btn { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: #64748b; font-weight: bold; transition: 0.2s; }
.nav-btn:hover { background: #e2e8f0; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.weekday { text-align: center; font-size: 0.8rem; font-weight: bold; color: #94a3b8; margin-bottom: 5px; }
.day-cell { aspect-ratio: 1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 5px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; position: relative; }
.day-cell:not(.is-empty):hover { background: #f8fafc; }
.day-num { font-size: 0.9rem; font-weight: 500; color: #333; }
.is-empty { cursor: default; }
.is-today .day-num { background: #e0f2fe; color: #0284c7; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.is-selected { background: #3b82f6 !important; border-color: #3b82f6; }
.is-selected .day-num { color: white; }
.event-dots { display: flex; gap: 2px; margin-top: 3px; }
.dot { width: 5px; height: 5px; border-radius: 50%; }
.is-selected .dot { border: 1px solid white; }
.events-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.events-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 15px; }
.selected-date-title { margin: 0; font-size: 1.1rem; color: #333; }
.add-event-btn { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.add-event-btn:hover { background: #059669; } .add-event-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
.empty-state { text-align: center; color: #94a3b8; padding: 20px 0; font-size: 0.9rem; }
.event-item { display: flex; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px; position: relative; overflow: hidden; }
.event-color-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
.event-time { font-size: 0.85rem; color: #64748b; width: 50px; margin-left: 10px; }
.event-title { flex: 1; font-weight: bold; color: #333; }
.del-btn { background: transparent; border: none; color: #cbd5e1; font-size: 1.2rem; cursor: pointer; padding: 0 5px; }
.del-btn:hover { color: #ef4444; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 25px; border-radius: 16px; width: 90%; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.2s; }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { margin-top: 0; text-align: center; color: #333; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 5px; font-weight: bold; }
input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 1rem; }
.disabled-input { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
.color-palette { display: flex; gap: 10px; justify-content: flex-start; }
.color-swatch { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; transition: 0.1s; border: 2px solid transparent; }
.color-swatch.selected { transform: scale(1.1); border-color: #333; }
.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; }
.save-btn { background: #3b82f6; color: white; }
</style>