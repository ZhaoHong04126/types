<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { Course, TimeSlot } from '../types/Course';

// 1. 設定時間表 (模擬舊版結構)
const days = ['一', '二', '三', '四', '五', '六', '日'];
const timeSlots: TimeSlot[] = [
  { period: 1, label: '1', time: '08:10' },
  { period: 2, label: '2', time: '09:10' },
  { period: 3, label: '3', time: '10:10' },
  { period: 4, label: '4', time: '11:10' },
  { period: 5, label: '午', time: '12:10' },
  { period: 6, label: '5', time: '13:10' },
  { period: 7, label: '6', time: '14:10' },
  { period: 8, label: '7', time: '15:10' },
  { period: 9, label: '8', time: '16:10' },
  { period: 10, label: '9', time: '17:10' },
];

// 2. 舊版的經典色票
const palette = [
  '#ffffff', // 白 (預設)
  '#ffcdd2', // 紅
  '#ffe0b2', // 橘
  '#fff9c4', // 黃
  '#c8e6c9', // 綠
  '#bbdefb', // 藍
  '#e1bee7', // 紫
];

// 3. 課程資料 (使用 ref)
const courses = ref<Course[]>([
  // 預設給一個連堂範例
  { id: '1', name: '微積分', location: 'A101', teacher: '陳教授', day: 1, period: 1, color: '#e1bee7' },
  { id: '2', name: '微積分', location: 'A101', teacher: '陳教授', day: 1, period: 2, color: '#e1bee7' },
]);

// 4. 控制 Modal
const showModal = ref(false);
const form = reactive({
  name: '', location: '', teacher: '',
  day: 1,
  startPeriod: 1, // 起始節次
  endPeriod: 1,   // 結束節次
  color: '#ffffff'
});

// --- 核心邏輯：計算顯示網格 (處理 Rowspan) ---
// 這段是從舊版 renderWeeklyTable 邏輯轉譯過來的
const gridMatrix = computed(() => {
  const matrix = new Map<string, { show: boolean; rowspan: number; course?: Course }>();

  // 先初始化每一格
  for (const slot of timeSlots) {
    for (let d = 1; d <= 7; d++) {
      matrix.set(`${d}-${slot.period}`, { show: true, rowspan: 1 });
    }
  }

  // 填入課程並計算合併
  for (let d = 1; d <= 7; d++) {
    for (let i = 0; i < timeSlots.length; i++) {
      const p = timeSlots[i].period;
      const key = `${d}-${p}`;
      
      // 找出這一格的課程
      const course = courses.value.find(c => c.day === d && c.period === p);

      if (course) {
        // 如果這格已經被「吃掉」了(skip)，就跳過
        if (!matrix.get(key)?.show) continue;

        // 往下記錄連堂數
        let span = 1;
        for (let j = i + 1; j < timeSlots.length; j++) {
          const nextP = timeSlots[j].period;
          const nextKey = `${d}-${nextP}`;
          const nextCourse = courses.value.find(c => c.day === d && c.period === nextP);

          // 舊版邏輯：科目相同 & 地點相同 = 合併
          if (nextCourse && nextCourse.name === course.name && nextCourse.location === course.location) {
            span++;
            // 把下一格標記為不顯示
            matrix.set(nextKey, { show: false, rowspan: 0 });
          } else {
            break;
          }
        }
        
        // 設定當前格子的 rowspan
        matrix.set(key, { show: true, rowspan: span, course });
      }
    }
  }
  return matrix;
});

// 取得格子的樣式 helper
const getCellData = (day: number, period: number) => {
  return gridMatrix.value.get(`${day}-${period}`);
};

// --- 功能：新增課程 (支援區間 1-3) ---
const openAddModal = () => {
  form.name = ''; form.location = ''; form.teacher = '';
  form.day = 1; form.startPeriod = 1; form.endPeriod = 1;
  form.color = '#ffffff';
  showModal.value = true;
};

const saveCourse = () => {
  if (!form.name) return alert('請輸入課程名稱');
  if (form.endPeriod < form.startPeriod) return alert('結束節次不能早於起始節次');

  // 1. 先刪除該時段舊的課 (避免重疊)
  // 簡單版：直接濾掉該區間的舊課
  courses.value = courses.value.filter(c => 
    !(c.day === form.day && c.period >= form.startPeriod && c.period <= form.endPeriod)
  );

  // 2. 迴圈新增每一節課 (1-3節 = 新增 1, 2, 3 三筆資料)
  // 這是為了配合舊版資料結構，讓每一格都是獨立資料
  for (let p = form.startPeriod; p <= form.endPeriod; p++) {
    // 如果該節次存在於時間表中才新增
    if (timeSlots.find(ts => ts.period === p)) {
      courses.value.push({
        id: Date.now() + '-' + p,
        name: form.name,
        location: form.location,
        teacher: form.teacher,
        day: form.day,
        period: p,
        color: form.color
      });
    }
  }

  showModal.value = false;
};

// 刪除課程 (點擊時刪除該「連堂」的所有課程)
const handleClick = (course: Course) => {
  if (confirm(`確定刪除「${course.name}」嗎？`)) {
    // 刪除所有 同天、同名、同地點 的課 (連堂一起刪)
    courses.value = courses.value.filter(c => 
      !(c.day === course.day && c.name === course.name && c.location === course.location)
    );
  }
};
</script>

<template>
  <div class="container">
    <div class="toolbar">
      <button class="add-btn" @click="openAddModal">＋ 新增課程</button>
    </div>

    <div class="table-wrapper">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="time-header">節</th>
            <th v-for="d in days" :key="d">{{ d }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timeSlots" :key="slot.period">
            <td class="time-col">
              <span class="p-num">{{ slot.label }}</span>
              <span class="p-time">{{ slot.time }}</span>
            </td>

            <template v-for="(dayName, idx) in days" :key="idx">
              <td 
                v-if="getCellData(idx + 1, slot.period)?.show"
                :rowspan="getCellData(idx + 1, slot.period)?.rowspan"
                class="course-cell"
                :class="{ 'has-course': getCellData(idx + 1, slot.period)?.course }"
                :style="{ backgroundColor: getCellData(idx + 1, slot.period)?.course?.color || 'white' }"
                @click="getCellData(idx + 1, slot.period)?.course && handleClick(getCellData(idx + 1, slot.period)!.course!)"
              >
                <div v-if="getCellData(idx + 1, slot.period)?.course" class="course-content">
                  <div class="c-name">{{ getCellData(idx + 1, slot.period)?.course?.name }}</div>
                  <div class="c-loc">{{ getCellData(idx + 1, slot.period)?.course?.location }}</div>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>✏️ 編輯課程</h3>
        
        <div class="form-group">
          <label>課程名稱</label>
          <input v-model="form.name" placeholder="例：計算機概論">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>星期</label>
            <select v-model="form.day">
              <option v-for="(d, i) in days" :key="d" :value="i+1">{{ d }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>節次 (起-迄)</label>
            <div class="period-range">
              <select v-model="form.startPeriod">
                <option v-for="s in timeSlots" :key="s.period" :value="s.period">{{ s.label }}</option>
              </select>
              <span>至</span>
              <select v-model="form.endPeriod">
                <option v-for="s in timeSlots" :key="s.period" :value="s.period">{{ s.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>地點</label>
            <input v-model="form.location" placeholder="例：C204">
          </div>
          <div class="form-group">
            <label>老師</label>
            <input v-model="form.teacher" placeholder="例：王老師">
          </div>
        </div>

        <div class="form-group">
          <label>標記顏色</label>
          <div class="color-palette">
            <div 
              v-for="c in palette" :key="c" 
              class="color-swatch"
              :style="{ background: c, borderColor: form.color === c ? '#333' : 'transparent' }"
              @click="form.color = c"
            ></div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="showModal = false">取消</button>
          <button class="save-btn" @click="saveCourse">儲存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器與按鈕 */
.container { max-width: 800px; margin: 0 auto; }
.toolbar { text-align: right; margin-bottom: 10px; }
.add-btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.add-btn:hover { background: #2563eb; }

/* 表格樣式 (模擬舊版 CampusKing 風格) */
.table-wrapper { overflow-x: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.schedule-table { width: 100%; border-collapse: collapse; min-width: 600px; table-layout: fixed; }

th { background: #f8f9fa; padding: 10px; border-bottom: 2px solid #eee; color: #555; font-size: 0.9rem; }
.time-header { width: 50px; background: #f1f5f9; }

td { border: 1px solid #eee; text-align: center; vertical-align: middle; padding: 4px; height: 50px; }
.time-col { background: #f8f9fa; width: 50px; }
.p-num { display: block; font-weight: bold; font-size: 1rem; color: #444; }
.p-time { display: block; font-size: 0.75rem; color: #888; }

/* 課程格子 */
.course-cell { transition: background 0.2s; }
.has-course { cursor: pointer; border-left: 3px solid rgba(0,0,0,0.1) !important; }
.has-course:hover { filter: brightness(0.95); }
.c-name { font-weight: bold; font-size: 0.9rem; color: #333; margin-bottom: 2px; }
.c-loc { font-size: 0.8rem; color: #666; }

/* Modal 樣式 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-card { background: white; padding: 25px; border-radius: 12px; width: 90%; max-width: 350px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.modal-card h3 { margin-top: 0; text-align: center; color: #333; }

.form-group { margin-bottom: 12px; }
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }
label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 4px; }
input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.period-range { display: flex; align-items: center; gap: 5px; }

/* 色票選擇 */
.color-palette { display: flex; gap: 8px; justify-content: center; margin-top: 5px; }
.color-swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.color-swatch:active { transform: scale(0.9); }

.modal-actions { display: flex; justify-content: space-between; margin-top: 20px; }
.modal-actions button { flex: 1; margin: 0 5px; padding: 10px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
.save-btn { background: #3b82f6 !important; color: white; border: none !important; }
</style>