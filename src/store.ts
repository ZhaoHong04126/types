import { ref, watch } from 'vue';

// 預設學期
export const currentSemester = ref('112-1');
// 學期清單
export const semesterList = ref<string[]>(['112-1']);
// 使用者暱稱
export const userName = ref('同學');
// 學校校系
export const userDepartment = ref('');

// 初始化時從 LocalStorage 讀取紀錄
const savedSem = localStorage.getItem('uni_life_current_sem');
if (savedSem) currentSemester.value = savedSem;

const savedList = localStorage.getItem('uni_life_sem_list');
if (savedList) semesterList.value = JSON.parse(savedList);

const savedName = localStorage.getItem('uni_life_user_name');
if (savedName) userName.value = savedName;

const savedDept = localStorage.getItem('uni_life_dept_v1');
if (savedDept) userDepartment.value = savedDept;

// 監聽變動並自動存檔
watch(currentSemester, (val) => {
  localStorage.setItem('uni_life_current_sem', val);
});
watch(semesterList, (val) => {
  localStorage.setItem('uni_life_sem_list', JSON.stringify(val));
}, { deep: true });
watch(userName, (val) => {
  localStorage.setItem('uni_life_user_name', val);
});
watch(userDepartment, (val) => {
  localStorage.setItem('uni_life_dept_v1', val);
});
// ==========================================
// 全域自訂對話框 (Global Dialog) 系統
// ==========================================
export const dialogState = ref({
  isOpen: false,
  type: 'alert' as 'alert' | 'confirm' | 'prompt',
  title: '',
  message: '',
  inputValue: '',
  inputPlaceholder: '',
  resolvePromise: null as ((value: any) => void) | null,
});

export const customAlert = (message: string, title = '💡 提示') => {
  return new Promise<void>((resolve) => {
    dialogState.value = {
      isOpen: true, type: 'alert', title, message,
      inputValue: '', inputPlaceholder: '', resolvePromise: resolve
    };
  });
};

export const customConfirm = (message: string, title = '❓ 請確認') => {
  return new Promise<boolean>((resolve) => {
    dialogState.value = {
      isOpen: true, type: 'confirm', title, message,
      inputValue: '', inputPlaceholder: '', resolvePromise: resolve
    };
  });
};

export const customPrompt = (message: string, defaultValue = '', placeholder = '', title = '✏️ 請輸入') => {
  return new Promise<string | null>((resolve) => {
    dialogState.value = {
      isOpen: true, type: 'prompt', title, message,
      inputValue: defaultValue, inputPlaceholder: placeholder, resolvePromise: resolve
    };
  });
};

export const closeDialog = (result: any = null) => {
  dialogState.value.isOpen = false;
  if (dialogState.value.resolvePromise) {
    dialogState.value.resolvePromise(result);
    dialogState.value.resolvePromise = null;
  }
};