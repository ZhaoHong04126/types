import { ref, watch } from 'vue';

// 預設學期
export const currentSemester = ref('112-1');
// 學期清單
export const semesterList = ref<string[]>(['112-1']);

// 初始化時從 LocalStorage 讀取紀錄
const savedSem = localStorage.getItem('uni_life_current_sem');
if (savedSem) currentSemester.value = savedSem;

const savedList = localStorage.getItem('uni_life_sem_list');
if (savedList) semesterList.value = JSON.parse(savedList);

// 監聽變動並自動存檔
watch(currentSemester, (val) => {
  localStorage.setItem('uni_life_current_sem', val);
});
watch(semesterList, (val) => {
  localStorage.setItem('uni_life_sem_list', JSON.stringify(val));
}, { deep: true });