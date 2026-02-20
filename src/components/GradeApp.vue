<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { currentSemester, customAlert, customConfirm } from '../store'; 
import type { CourseGrade, ModuleCategory, CourseCategory } from '../types/Grade';

const grades = ref<CourseGrade[]>([]);
const modules = ref<ModuleCategory[]>([]); 
const currentTab = ref<'records' | 'modules'>('records');

const showGradeModal = ref(false);
const showModuleModal = ref(false);

// 自主學習狀態
const isSelfStudy = ref(false);

const courseCategories: CourseCategory[] = ['必修', '選修', '必選修'];

const gradeForm = reactive({
  name: '', 
  credits: 3, 
  category: '必修' as CourseCategory, 
  score: 80, 
  moduleId: ''
});

const moduleForm = reactive({
  name: '', type: 'simple' as 'simple' | 'complex', targetCredits: 10, targetReq: 0, targetElec: 0
});

const STORAGE_KEY_GRADES = 'uni_life_grades_v1';
const STORAGE_KEY_MODULES = 'uni_life_modules_v2'; 
const allScheduleCourses = ref<any[]>([]);

onMounted(() => {
  const savedGrades = localStorage.getItem(STORAGE_KEY_GRADES);
  const savedModules = localStorage.getItem(STORAGE_KEY_MODULES);
  
  if (savedGrades) grades.value = JSON.parse(savedGrades);
  if (savedModules) modules.value = JSON.parse(savedModules);

  const savedCourses = localStorage.getItem('uni_life_courses_v1');
  if (savedCourses) allScheduleCourses.value = JSON.parse(savedCourses);
});

watch(grades, (val) => localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(val)), { deep: true });
watch(modules, (val) => localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(val)), { deep: true });

const scheduleCourseNames = computed(() => {
  const names = allScheduleCourses.value.filter(c => c.semester === currentSemester.value).map(c => c.name);
  return [...new Set(names)];
});

watch(() => gradeForm.name, (newVal) => {
  if (newVal && !isSelfStudy.value) {
    const matches = allScheduleCourses.value.filter(c => c.semester === currentSemester.value && c.name === newVal);
    if (matches.length > 0) gradeForm.credits = matches.length;
  }
});

const currentSemesterGrades = computed(() => grades.value.filter(g => g.semester === currentSemester.value));

const currentStats = computed(() => {
  let totalCreditsForGpa = 0; 
  let weightedScore = 0;      
  let earnedCredits = 0;      

  currentSemesterGrades.value.forEach(g => { 
    if (g.score === -1) {
      earnedCredits += g.credits;
    } else {
      totalCreditsForGpa += g.credits; 
      weightedScore += (g.score * g.credits); 
      if (g.score >= 60) earnedCredits += g.credits;
    }
  });

  const average = totalCreditsForGpa === 0 ? 0 : (weightedScore / totalCreditsForGpa);
  return { 
    totalCreditsForGpa, 
    average: average.toFixed(2), 
    earnedCredits 
  };
});

const moduleProgress = computed(() => {
  const progress: Record<string, { total: number, req: number, elec: number }> = {};
  modules.value.forEach(m => { progress[m.id] = { total: 0, req: 0, elec: 0 }; });
  
  grades.value.forEach(g => {
    const isPassed = g.score === -1 || g.score >= 60;
    
    if (g.moduleId && progress[g.moduleId] && isPassed) {
      progress[g.moduleId].total += g.credits;
      if (g.category === '必修') progress[g.moduleId].req += g.credits;
      else if (g.category === '選修' || g.category === '必選修') progress[g.moduleId].elec += g.credits; 
    }
  });
  return progress;
});

const calcPercent = (earned: number, target: number) => {
  if (target <= 0) return earned > 0 ? '100%' : '0%';
  return Math.min((earned / target) * 100, 100) + '%';
};

const openGradeModal = () => {
  const savedCourses = localStorage.getItem('uni_life_courses_v1');
  if (savedCourses) allScheduleCourses.value = JSON.parse(savedCourses);

  gradeForm.name = ''; 
  gradeForm.credits = 3; 
  gradeForm.score = 80;
  isSelfStudy.value = false; 

  if (modules.value.length > 0) gradeForm.moduleId = modules.value[0].id;
  else gradeForm.moduleId = '';
  
  showGradeModal.value = true;
};

const saveGrade = async () => {
  let finalName = gradeForm.name;
  
  if (isSelfStudy.value) {
    finalName = '自主學習'; 
  } else {
    if (!finalName) return await customAlert('請輸入課程名稱喔！', '💡 提示');
  }

  if (gradeForm.credits <= 0) return await customAlert('學分必須大於 0 喔！', '💡 提示');
  if (!gradeForm.moduleId) return await customAlert('請選擇歸屬模組！\n(若無模組請先至「學分模組」新增)', '💡 提示');

  grades.value.push({
    id: Date.now().toString(), 
    semester: currentSemester.value, 
    name: finalName,
    credits: gradeForm.credits, 
    category: isSelfStudy.value ? '選修' : gradeForm.category, 
    score: isSelfStudy.value ? -1 : gradeForm.score, 
    moduleId: gradeForm.moduleId
  });
  showGradeModal.value = false;
};

const deleteGrade = async (id: string) => {
  if (await customConfirm('確定刪除此筆成績嗎？', '🗑️ 刪除確認')) {
    grades.value = grades.value.filter(g => g.id !== id);
  }
};

const openModuleModal = () => {
  moduleForm.name = ''; moduleForm.type = 'simple'; moduleForm.targetCredits = 10;
  moduleForm.targetReq = 0; moduleForm.targetElec = 0;
  showModuleModal.value = true;
};

const saveModule = async () => {
  if (!moduleForm.name) return await customAlert('請輸入模組名稱喔！', '💡 提示');
  modules.value.push({
    id: Date.now().toString(), name: moduleForm.name, type: moduleForm.type,
    targetCredits: moduleForm.targetCredits, targetReq: moduleForm.targetReq, targetElec: moduleForm.targetElec
  });
  showModuleModal.value = false;
};

const deleteModule = async (id: string) => {
  if (await customConfirm('確定刪除此模組？\n(歸屬於此模組的成績將會失去分類喔！)', '🗑️ 刪除確認')) {
    modules.value = modules.value.filter(m => m.id !== id);
    grades.value.forEach(g => { if (g.moduleId === id) g.moduleId = ''; });
  }
};
</script>

<template>
  <div class="grade-container">
    
    <div class="tabs">
      <button :class="{ active: currentTab === 'records' }" @click="currentTab = 'records'">📝 成績紀錄</button>
      <button :class="{ active: currentTab === 'modules' }" @click="currentTab = 'modules'">📊 學分模組</button>
    </div>

    <div v-if="currentTab === 'records'">
      <div class="summary-card">
        <div class="stat-box"><div class="stat-label">本學期實得學分</div><div class="stat-value">{{ currentStats.earnedCredits }}</div></div>
        <div class="stat-divider"></div>
        <div class="stat-box"><div class="stat-label">本學期平均成績</div><div class="stat-value highlight">{{ currentStats.average }}</div></div>
      </div>

      <div class="list-card">
        <div class="list-header"><h3>本學期修課明細 <span style="font-size:0.85rem;color:#888;">({{ currentSemester }})</span></h3><button class="add-btn-sm" @click="openGradeModal">＋ 新增成績</button></div>
        <div v-if="currentSemesterGrades.length === 0" class="empty-state">這學期 ({{ currentSemester }}) 還沒有成績紀錄喔！</div>
        
        <div class="grade-list">
          <div v-for="item in currentSemesterGrades" :key="item.id" class="g-item">
            <div class="g-info">
              <div class="g-title">{{ item.name }}</div>
              <div class="g-tags">
                <span class="badge" :class="item.category === '必修' ? 'req' : (item.category === '選修' ? 'elec' : 'req-elec')">{{ item.category }}</span>
                <span class="badge credits">{{ item.credits }} 學分</span>
                <span v-if="item.moduleId" class="badge module">{{ modules.find(m => m.id === item.moduleId)?.name || '未分類' }}</span>
                <span v-else class="badge module" style="background:#fee2e2; color:#ef4444;">⚠ 未分類</span>
              </div>
            </div>
            
            <div class="g-score" v-if="item.score === -1" style="color: #10b981; font-size: 0.9rem;">
              <span style="background:#d1fae5; padding: 4px 8px; border-radius: 6px;">P (通過)</span>
            </div>
            <div class="g-score" v-else :class="{ 'failed': item.score < 60 }">
              {{ item.score }}
            </div>

            <button class="del-btn" @click="deleteGrade(item.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentTab === 'modules'">
      <div class="list-card">
        <div class="list-header"><h3>📂 畢業學分模組 <span style="font-size:0.8rem;color:#888;font-weight:normal">(歷年總計)</span></h3><button class="add-btn-sm" @click="openModuleModal">＋ 新增模組</button></div>
        <div v-if="modules.length === 0" class="empty-state">目前為空，請先點擊上方新增模組 (例如：共同必修、系定選修)。</div>

        <div class="module-list">
          <div v-for="mod in modules" :key="mod.id" class="m-item">
            <template v-if="mod.type === 'simple'">
              <div class="m-header"><span class="m-title">{{ mod.name }} <span class="tag-simple">單一總學分</span></span><span class="m-progress-text">{{ moduleProgress[mod.id]?.total || 0 }} / {{ mod.targetCredits }}</span></div>
              <div class="progress-bar-bg"><div class="progress-bar-fill custom-fill" :style="{ width: calcPercent(moduleProgress[mod.id]?.total || 0, mod.targetCredits) }" :class="{ 'is-full': (moduleProgress[mod.id]?.total || 0) >= mod.targetCredits }"></div></div>
            </template>
            <template v-else>
              <div class="m-header" style="margin-bottom: 8px;"><span class="m-title">{{ mod.name }} <span class="tag-complex">分必/選修</span></span></div>
              <div style="margin-bottom: 10px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#666; margin-bottom: 2px;"><span><span class="badge req">必修</span></span><span>{{ moduleProgress[mod.id]?.req || 0 }} / {{ mod.targetReq }}</span></div>
                <div class="progress-bar-bg" style="height: 6px;"><div class="progress-bar-fill" style="background: #e74c3c;" :style="{ width: calcPercent(moduleProgress[mod.id]?.req || 0, mod.targetReq) }"></div></div>
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#666; margin-bottom: 2px;"><span><span class="badge elec">選修 / 必選修</span></span><span>{{ moduleProgress[mod.id]?.elec || 0 }} / {{ mod.targetElec }}</span></div>
                <div class="progress-bar-bg" style="height: 6px;"><div class="progress-bar-fill" style="background: #f39c12;" :style="{ width: calcPercent(moduleProgress[mod.id]?.elec || 0, mod.targetElec) }"></div></div>
              </div>
            </template>
            <button class="del-btn-sm mt-2" @click="deleteModule(mod.id)">刪除模組</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showGradeModal" class="modal-overlay">
      <div class="modal-card">
        <h3>💯 新增成績 <span style="font-size: 0.85rem; color: #888; font-weight: normal;">({{ currentSemester }})</span></h3>
        
        <div class="form-row">
            <div class="form-group" style="flex: 2; display: flex; flex-direction: column;">
                <label>課程名稱</label>
                
                <input v-if="isSelfStudy" type="text" value="自主學習" disabled style="background: #f1f5f9; color: #94a3b8; cursor: not-allowed; margin-bottom: 6px;">
                <input v-else list="schedule-course-list" v-model="gradeForm.name" placeholder="例: 計算機概論" autocomplete="off" style="margin-bottom: 6px;">
                <datalist id="schedule-course-list"><option v-for="cName in scheduleCourseNames" :key="cName" :value="cName"></option></datalist>
                
                <label style="display:flex; align-items:center; cursor:pointer; margin-top: 2px; color: #3b82f6; font-size: 0.85rem; font-weight: bold;">
                    <input type="checkbox" v-model="isSelfStudy" style="width:auto; margin: 0 6px 0 2px; cursor:pointer; transform: scale(1.1);">
                    自主學習 <span style="color:#94a3b8; font-weight: normal; margin-left: 4px; font-size: 0.75rem;">(不計GPA)</span>
                </label>
            </div>
            
            <div class="form-group" style="flex: 1;">
                <label>成績</label>
                <input v-if="!isSelfStudy" type="number" v-model="gradeForm.score" placeholder="如：85">
                <div v-else style="padding: 10px; background: #d1fae5; color: #10b981; border-radius: 8px; text-align: center; font-weight: bold; border: 1px solid #a7f3d0; box-sizing: border-box; font-size: 1rem; display: flex; align-items: center; justify-content: center; height: 42px;">
                    P
                </div>
            </div>
        </div>

        <div class="form-row" style="margin-top: 5px;">
          <div class="form-group"><label>學分</label><input type="number" v-model="gradeForm.credits"></div>
          <div class="form-group" v-if="!isSelfStudy">
             <label>類別</label>
             <select v-model="gradeForm.category"><option v-for="c in courseCategories" :key="c" :value="c">{{ c }}</option></select>
          </div>
        </div>

        <div class="form-group">
          <label>歸屬模組 <span style="color:#ef4444">*必填</span></label>
          <select v-model="gradeForm.moduleId">
            <option value="" disabled>請選擇要計算在哪個模組</option>
            <option v-for="m in modules" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>
        
        <div class="modal-actions">
            <button @click="showGradeModal = false">取消</button>
            <button class="save-btn" @click="saveGrade">確定</button>
        </div>
      </div>
    </div>

    <div v-if="showModuleModal" class="modal-overlay">
      <div class="modal-card">
        <h3>📊 新增學分模組</h3>
        <div class="form-group"><label>模組名稱</label><input v-model="moduleForm.name" placeholder="例: 核心通識、系定必修"></div>
        <div class="form-group"><label>計算方式</label><select v-model="moduleForm.type"><option value="simple">單一總學分 (不分必選修)</option><option value="complex">細分 必修 / 選修 目標</option></select></div>
        <div v-if="moduleForm.type === 'simple'" class="form-group" style="background:#f8fafc; padding:10px; border-radius:8px;"><label>目標總學分</label><input type="number" v-model="moduleForm.targetCredits" min="0"></div>
        <div v-if="moduleForm.type === 'complex'" class="form-row" style="background:#f8fafc; padding:10px; border-radius:8px;">
          <div class="form-group"><label>必修 目標</label><input type="number" v-model="moduleForm.targetReq" min="0"></div>
          <div class="form-group"><label>選修 目標</label><input type="number" v-model="moduleForm.targetElec" min="0"></div>
        </div>
        <div class="modal-actions"><button @click="showModuleModal = false">取消</button><button class="save-btn" @click="saveModule">確定</button></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-container { max-width: 800px; margin: 0 auto; padding: 10px; }
.tabs { display: flex; margin-bottom: 15px; background: #eef2f5; padding: 5px; border-radius: 8px; }
.tabs button { flex: 1; padding: 10px; border: none; background: transparent; color: #666; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.2s; }
.tabs button.active { background: #4a90e2; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 4px 10px rgba(118, 75, 162, 0.3); }
.stat-box { text-align: center; flex: 1; }
.stat-divider { width: 1px; height: 50px; background: rgba(255,255,255,0.3); }
.stat-label { font-size: 0.9rem; opacity: 0.9; margin-bottom: 5px; }
.stat-value { font-size: 2rem; font-weight: bold; }
.stat-value.highlight { color: #fef08a; }
.list-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 20px; }
.list-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
.list-header h3 { margin: 0; color: #333; }
.empty-state { text-align: center; color: #94a3b8; padding: 20px 0; font-size: 0.9rem; }
.g-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.g-info { flex: 1; display: flex; flex-direction: column; }
.g-title { font-weight: bold; font-size: 1rem; color: #333; margin-bottom: 4px; }
.g-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.g-score { font-weight: bold; font-size: 1.2rem; width: 50px; text-align: right; margin-right: 10px; color: #10b981; }
.g-score.failed { color: #ef4444; }
.m-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
.m-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.m-title { font-weight: bold; color: #333; display: flex; align-items: center; gap: 8px; }
.m-progress-text { font-size: 0.9rem; color: #64748b; font-weight: bold; }
.progress-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #ef4444; transition: width 0.3s; }
.custom-fill { background: #3b82f6; }
.progress-bar-fill.is-full { background: #10b981; }
.tag-simple { font-size: 0.7rem; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 10px; font-weight: normal; }
.tag-complex { font-size: 0.7rem; background: #f3e8ff; color: #7e22ce; padding: 2px 6px; border-radius: 10px; font-weight: normal; }
.badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.badge.req { background: #fee2e2; color: #b91c1c; }
.badge.elec { background: #e0f2fe; color: #0369a1; }
.badge.req-elec { background: #fef3c7; color: #b45309; }
.badge.credits { background: #f1f5f9; color: #475569; }
.badge.module { background: #e2e8f0; color: #334155; }
.add-btn-sm { background: #333; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.del-btn { background: transparent; border: none; color: #cbd5e1; font-size: 1.2rem; cursor: pointer; }
.del-btn:hover { color: #ef4444; }
.del-btn-sm { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; margin-top: 10px; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 25px; border-radius: 16px; width: 90%; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.2s; }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { margin-top: 0; text-align: center; color: #333; margin-bottom: 20px; }
.form-group { margin-bottom: 12px; }
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }
label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 5px; font-weight: bold; }
input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 1rem; }
.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; }
.save-btn { background: #3b82f6; color: white; }
</style>