<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { currentSemester, customAlert, customConfirm } from '../store'; // ✨ 引入自訂對話框
import type { Course, TimeSlot } from '../types/Course';

const days = ['一', '二', '三', '四', '五', '六', '日'];
const timeSlots: TimeSlot[] = [
  { period: 1, label: '1', time: '08:10' }, { period: 2, label: '2', time: '09:10' },
  { period: 3, label: '3', time: '10:10' }, { period: 4, label: '4', time: '11:10' },
  { period: 5, label: '午', time: '12:10' }, { period: 6, label: '5', time: '13:10' },
  { period: 7, label: '6', time: '14:10' }, { period: 8, label: '7', time: '15:10' },
  { period: 9, label: '8', time: '16:10' }, { period: 10, label: '9', time: '17:10' },
  { period: 11, label: 'A', time: '18:10' }, { period: 12, label: 'B', time: '19:10' },
];

const palette = ['#ffffff', '#ffcdd2', '#ffe0b2', '#fff9c4', '#c8e6c9', '#bbdefb', '#e1bee7'];

const courses = ref<Course[]>([]);
const showModal = ref(false);
const selectionAnchor = ref<{ day: number, period: number } | null>(null);
const isLocked = ref(true); 

// ✨ 改用 customConfirm
const toggleLock = async () => {
  if (isLocked.value) {
    const isConfirmed = await customConfirm('確定要進入編輯模式嗎？\n（解鎖後可新增或刪除課程）', '🔓 解鎖確認');
    if (isConfirmed) isLocked.value = false;
  } else {
    isLocked.value = true;
  }
};

const form = reactive({
  id: '', name: '', location: '', teacher: '',
  day: 1, startPeriod: 1, endPeriod: 1, color: '#ffffff'
});

const STORAGE_KEY = 'uni_life_courses_v1';

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      courses.value = parsed.map((c: any) => ({ ...c, semester: c.semester || currentSemester.value }));
    } catch (e) { console.error(e); }
  }
});

watch(courses, (newVal) => localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal)), { deep: true });

const currentSemesterCourses = computed(() => courses.value.filter(c => c.semester === currentSemester.value));

const gridMatrix = computed(() => {
  const matrix = new Map<string, { show: boolean; rowspan: number; course?: Course }>();
  for (const slot of timeSlots) { for (let d = 1; d <= 7; d++) { matrix.set(`${d}-${slot.period}`, { show: true, rowspan: 1 }); } }
  
  for (let d = 1; d <= 7; d++) {
    for (let i = 0; i < timeSlots.length; i++) {
      const p = timeSlots[i].period;
      const key = `${d}-${p}`;
      const course = currentSemesterCourses.value.find(c => c.day === d && c.period === p);

      if (course) {
        if (!matrix.get(key)?.show) continue;
        let span = 1;
        for (let j = i + 1; j < timeSlots.length; j++) {
          const nextP = timeSlots[j].period;
          const nextKey = `${d}-${nextP}`;
          const nextCourse = currentSemesterCourses.value.find(c => c.day === d && c.period === nextP);
          if (nextCourse && nextCourse.name === course.name && nextCourse.location === course.location) {
            span++; matrix.set(nextKey, { show: false, rowspan: 0 });
          } else break;
        }
        matrix.set(key, { show: true, rowspan: span, course });
      }
    }
  }
  return matrix;
});

const getCell = (day: number, period: number) => gridMatrix.value.get(`${day}-${period}`);

const handleCellClick = (day: number, period: number) => {
  if (isLocked.value) return;
  const cellData = getCell(day, period);
  if (cellData?.course) return openEditModal(cellData.course);

  if (!selectionAnchor.value) {
    selectionAnchor.value = { day, period };
  } else {
    if (selectionAnchor.value.day === day) {
      const start = Math.min(selectionAnchor.value.period, period);
      const end = Math.max(selectionAnchor.value.period, period);
      openAddModal(day, start, end);
      selectionAnchor.value = null;
    } else selectionAnchor.value = { day, period };
  }
};

const handleManualAdd = () => { if (!isLocked.value) openAddModal(); };

const openAddModal = (day = 1, start = 1, end = 1) => {
  form.id = ''; form.name = ''; form.location = ''; form.teacher = '';
  form.day = day; form.startPeriod = start; form.endPeriod = end; form.color = '#ffffff';
  showModal.value = true;
};

const openEditModal = (course: Course) => {
  const sameCourses = currentSemesterCourses.value.filter(c => c.day === course.day && c.name === course.name && c.location === course.location);
  const minP = Math.min(...sameCourses.map(c => c.period));
  const maxP = Math.max(...sameCourses.map(c => c.period));

  form.id = course.id; form.name = course.name; form.location = course.location; form.teacher = course.teacher;
  form.day = course.day; form.startPeriod = minP; form.endPeriod = maxP; form.color = course.color;
  showModal.value = true;
};

// ✨ 改用 customAlert
const saveCourse = async () => {
  if (!form.name) return await customAlert('請輸入課程名稱喔！', '💡 提示');
  if (form.endPeriod < form.startPeriod) return await customAlert('結束節次不能比開始節次早！', '💡 提示');
  
  courses.value = courses.value.filter(c => !(c.semester === currentSemester.value && c.day === form.day && c.period >= form.startPeriod && c.period <= form.endPeriod));
  for (let p = form.startPeriod; p <= form.endPeriod; p++) {
    if (timeSlots.find(ts => ts.period === p)) {
      courses.value.push({
        id: Date.now() + '-' + p, semester: currentSemester.value, name: form.name,
        location: form.location, teacher: form.teacher, day: form.day, period: p, color: form.color
      });
    }
  }
  showModal.value = false;
  selectionAnchor.value = null;
};

// ✨ 改用 customConfirm
const deleteCourse = async () => {
  const isConfirmed = await customConfirm('確定要刪除這堂課嗎？', '🗑️ 刪除確認');
  if (!isConfirmed) return;
  
  courses.value = courses.value.filter(c => !(c.semester === currentSemester.value && c.day === form.day && c.period >= form.startPeriod && c.period <= form.endPeriod));
  showModal.value = false;
};
</script>

<template>
  <div class="container">
    <div class="toolbar">
      <button class="lock-btn" :class="{ 'is-locked': isLocked }" @click="toggleLock">
        {{ isLocked ? '🔒 唯讀模式' : '🔓 編輯模式' }}
      </button>
      <button class="add-btn" :disabled="isLocked" @click="handleManualAdd">＋ 新增課程</button>
    </div>

    <div class="hint-bar" v-if="selectionAnchor && !isLocked">已選取週{{ days[selectionAnchor.day - 1] }} 第 {{ timeSlots.find(t=>t.period === selectionAnchor?.period)?.label }} 節，請點選結束節次</div>
    <div class="hint-bar locked-hint" v-else-if="isLocked">🔒 課表已鎖定，請點擊上方按鈕解鎖以編輯</div>
    <div class="hint-bar" v-else>💡 目前編輯【{{ currentSemester }}】的課表，點擊空白格子新增</div>

    <div class="table-wrapper" :class="{ 'locked-table': isLocked }">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="time-header">節</th><th v-for="d in days" :key="d">{{ d }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timeSlots" :key="slot.period">
            <td class="time-col"><span class="p-num">{{ slot.label }}</span><span class="p-time">{{ slot.time }}</span></td>
            <template v-for="(dayName, idx) in days" :key="idx">
              <td v-if="getCell(idx + 1, slot.period)?.show" :rowspan="getCell(idx + 1, slot.period)?.rowspan" class="course-cell" :class="{ 'has-course': getCell(idx + 1, slot.period)?.course, 'is-selected': selectionAnchor?.day === (idx+1) && selectionAnchor?.period === slot.period }" :style="{ backgroundColor: getCell(idx + 1, slot.period)?.course?.color || '' }" @click="handleCellClick(idx + 1, slot.period)">
                <div v-if="getCell(idx + 1, slot.period)?.course" class="course-content">
                  <div class="c-name">{{ getCell(idx + 1, slot.period)?.course?.name }}</div>
                  <div class="c-loc">{{ getCell(idx + 1, slot.period)?.course?.location }}</div>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>{{ form.id ? '✏️ 編輯課程' : '➕ 新增課程' }} <span style="font-size: 0.8rem; color: #888; font-weight: normal;">({{ currentSemester }})</span></h3>
        <div class="form-group"><label>課程名稱</label><input v-model="form.name" placeholder="例：微積分" /></div>
        <div class="form-row">
          <div class="form-group"><label>星期</label><select v-model="form.day" disabled><option v-for="(d, i) in days" :key="d" :value="i+1">{{ d }}</option></select></div>
          <div class="form-group"><label>節次區間</label><div class="period-range"><select v-model="form.startPeriod"><option v-for="s in timeSlots" :key="s.period" :value="s.period">{{ s.label }}</option></select><span>至</span><select v-model="form.endPeriod"><option v-for="s in timeSlots" :key="s.period" :value="s.period">{{ s.label }}</option></select></div></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>地點</label><input v-model="form.location" placeholder="例：A101" /></div>
          <div class="form-group"><label>老師</label><input v-model="form.teacher" placeholder="例：陳教授" /></div>
        </div>
        <div class="form-group">
          <label>標記顏色</label>
          <div class="color-palette"><div v-for="c in palette" :key="c" class="color-swatch" :style="{ background: c }" :class="{ selected: form.color === c }" @click="form.color = c"></div></div>
        </div>
        <div class="modal-actions">
          <button v-if="form.id" class="delete-btn" @click="deleteCourse">刪除</button>
          <button v-else @click="showModal = false">取消</button>
          <button class="save-btn" @click="saveCourse">儲存</button>
        </div>
        <button v-if="form.id" class="close-text-btn" @click="showModal = false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 800px; margin: 0 auto; position: relative; }
.toolbar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 10px; }
.lock-btn { background: white; border: 1px solid #ddd; color: #666; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
.lock-btn.is-locked { background: #fff3e0; color: #f57c00; border-color: #f57c00; }
.add-btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.add-btn:hover { background: #2563eb; } .add-btn:disabled { background: #ccc; cursor: not-allowed; }
.hint-bar { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 0.9rem; text-align: center; }
.hint-bar.locked-hint { background: #fff3e0; color: #f57c00; }
.table-wrapper { overflow-x: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background: white; transition: 0.3s; }
.locked-table { opacity: 0.9; background: #fafafa; }
.schedule-table { width: 100%; border-collapse: collapse; min-width: 600px; table-layout: fixed; }
th { background: #f8f9fa; padding: 10px; border-bottom: 2px solid #eee; color: #555; font-size: 0.9rem; }
.time-header { width: 45px; background: #f1f5f9; }
td { border: 1px solid #eee; text-align: center; vertical-align: middle; padding: 2px; height: 50px; position: relative; }
.time-col { background: #f8f9fa; width: 45px; }
.p-num { display: block; font-weight: bold; font-size: 1rem; color: #444; }
.p-time { display: block; font-size: 0.7rem; color: #888; }
.course-cell:not(.has-course):hover { background-color: #f9fafb; cursor: pointer; }
.locked-table .course-cell:not(.has-course):hover { background-color: transparent; cursor: default; }
.is-selected { background-color: #b2dfdb !important; box-shadow: inset 0 0 0 2px #009688; }
.has-course { cursor: pointer; border-left: 4px solid rgba(0,0,0,0.15) !important; transition: filter 0.2s; }
.has-course:hover { filter: brightness(0.95); }
.locked-table .has-course { cursor: default; } .locked-table .has-course:hover { filter: none; }
.c-name { font-weight: bold; font-size: 0.85rem; color: #333; line-height: 1.2; }
.c-loc { font-size: 0.75rem; color: #666; margin-top: 2px; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 25px; border-radius: 16px; width: 85%; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.2s; }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { margin-top: 0; text-align: center; color: #333; margin-bottom: 20px; display: flex; flex-direction: column; gap: 5px; }
.form-group { margin-bottom: 15px; } .form-row { display: flex; gap: 10px; } .form-row .form-group { flex: 1; }
label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 5px; }
input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 1rem; background: #fff; }
.period-range { display: flex; align-items: center; gap: 5px; }
.color-palette { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.color-swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #eee; cursor: pointer; transition: transform 0.1s; }
.color-swatch.selected { border-color: #555; transform: scale(1.1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; }
.save-btn { background: #3b82f6; color: white; }
.delete-btn { background: #fee2e2; color: #ef4444; }
.close-text-btn { background: transparent; border: none; color: #999; width: 100%; margin-top: 10px; cursor: pointer; }
</style>