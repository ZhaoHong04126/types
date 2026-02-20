<script setup lang="ts">
import { ref } from 'vue';
import { userName, userDepartment, customAlert, customConfirm, customPrompt } from '../store'; // ✨ 引入 userDepartment

const tempName = ref(userName.value);
const tempDepartment = ref(userDepartment.value); // ✨ 暫存的科系輸入值
const fileInput = ref<HTMLInputElement | null>(null);
const isSettingsLocked = ref(true);

const toggleSettingsLock = async () => {
  if (isSettingsLocked.value) {
    const isConfirmed = await customConfirm('確定要解除鎖定嗎？\n（解鎖後可修改暱稱、校系、匯入備份或清除資料）', '🔓 解鎖確認');
    if (isConfirmed) {
      tempName.value = userName.value; 
      tempDepartment.value = userDepartment.value; // ✨ 同步最新資料
      isSettingsLocked.value = false;
    }
  } else {
    isSettingsLocked.value = true;
  }
};

const saveSettings = async () => {
  if (!tempName.value.trim()) return await customAlert('暱稱不能為空喔！', '⚠️ 提示');
  
  userName.value = tempName.value.trim();
  userDepartment.value = tempDepartment.value.trim(); // ✨ 儲存科系
  await customAlert('個人設定已成功更新！', '✅ 儲存成功');
  isSettingsLocked.value = true; 
};

// ...下方的 exportData, importData, triggerFileInput, clearAllData 等保持不變...
const exportData = () => {
  const allData: Record<string, string | null> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('uni_life_')) {
      allData[key] = localStorage.getItem(key);
    }
  }

  const dataStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `CampusKing_Backup_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const importData = async (event: Event) => {
  if (isSettingsLocked.value) return; 

  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      
      const isConfirmed = await customConfirm('⚠️ 警告：匯入資料將會覆蓋您目前的【所有紀錄】。\n確定要繼續嗎？', '🚨 匯入確認');
      if (!isConfirmed) {
        if (fileInput.value) fileInput.value.value = ''; 
        return;
      }

      Object.keys(data).forEach(key => {
        if (key.startsWith('uni_life_') && data[key] !== null) {
          localStorage.setItem(key, data[key]);
        }
      });

      await customAlert('資料已成功還原！\n系統將為您重新載入以套用新資料。', '🎉 還原成功');
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      await customAlert('檔案格式錯誤，無法讀取！\n請確保您上傳的是原本匯出的備份檔。', '❌ 錯誤');
    }
  };
  reader.readAsText(file);
};

const triggerFileInput = () => {
  if (isSettingsLocked.value) return; 
  fileInput.value?.click();
};

const clearAllData = async () => {
  if (isSettingsLocked.value) return; 

  const confirm1 = await customConfirm('🚨 警告：這將會清除您在此 APP 的【所有紀錄】（包含課表、記帳、成績等）！\n強烈建議您先使用「匯出備份」功能。\n\n確定要繼續嗎？', '💀 危險操作');
  
  if (confirm1) {
    const confirm2 = await customPrompt('此動作無法復原！\n請輸入「確認刪除」以執行：', '', '輸入 確認刪除', '🔥 最後確認');
    
    if (confirm2 === '確認刪除') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('uni_life_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      await customAlert('資料已全數清除，系統將為您重新載入。', '🗑️ 已清除');
      window.location.reload();
    } else {
      await customAlert('輸入不正確，取消刪除動作。', '💡 提示');
    }
  }
};
</script>

<template>
  <div class="settings-container">
    <div class="toolbar">
      <button class="lock-btn" :class="{ 'is-locked': isSettingsLocked }" @click="toggleSettingsLock">
        {{ isSettingsLocked ? '🔒 唯讀模式' : '🔓 設定模式' }}
      </button>
    </div>

    <div class="hint-bar locked-hint" v-if="isSettingsLocked">
      🔒 設定已鎖定，請點擊上方按鈕解鎖以編輯或匯入資料
    </div>
    <div class="hint-bar" v-else>
      💡 編輯模式已開啟！您可以修改暱稱、匯入備份或清除資料。
    </div>

    <div class="settings-card" :class="{ 'locked-card': isSettingsLocked }">
      <div class="card-header">👤 個人設定</div>
      
      <div class="form-group">
        <label>您的稱呼</label>
        <div v-if="isSettingsLocked" class="readonly-text">{{ userName }}</div>
        <div v-else class="input-row">
          <input type="text" v-model="tempName" placeholder="請輸入暱稱">
        </div>
        <p class="hint-text">這個稱呼會顯示在首頁跟您打招呼喔！</p>
      </div>

      <div class="form-group" style="margin-top: 20px;">
        <label>學校科系</label>
        <div v-if="isSettingsLocked" class="readonly-text" :class="{ 'is-empty': !userDepartment }">
          {{ userDepartment || '尚未設定' }}
        </div>
        <div v-else class="input-row">
          <input type="text" v-model="tempDepartment" placeholder="例如：台灣大學 資訊工程學系">
        </div>
        <p class="hint-text">標示您目前就讀的學校及系所。</p>
      </div>

      <button v-if="!isSettingsLocked" class="action-btn primary" style="margin-top: 20px; width: 100%;" @click="saveSettings">
        💾 儲存設定
      </button>
    </div>

    <div class="settings-card">
      <div class="card-header">💾 資料備份與還原</div>
      <p class="desc-text">本系統的資料皆儲存於您的瀏覽器中。如果您需要更換裝置或瀏覽器，請先匯出備份檔，再到新裝置上匯入。</p>
      <div class="actions-col">
        <button class="action-btn export-btn" @click="exportData">📥 匯出備份檔 (.json)</button>
        <div class="divider"></div>
        <input type="file" ref="fileInput" accept=".json" @change="importData" style="display: none;">
        <button class="action-btn import-btn" :disabled="isSettingsLocked" @click="triggerFileInput">📤 匯入備份檔 (.json)</button>
      </div>
    </div>

    <div class="settings-card danger-zone" :class="{ 'locked-danger': isSettingsLocked }">
      <div class="card-header danger-text">💀 危險區域</div>
      <p class="desc-text">清除資料後將無法復原，請謹慎操作。</p>
      <button class="action-btn danger-btn" :disabled="isSettingsLocked" @click="clearAllData">🗑️ 清除所有 APP 資料</button>
    </div>

    <div class="version-info">
      Campus King 校園王 v1.0<br>Made with ❤️
    </div>
  </div>
</template>

<style scoped>
/* 保持原本設定頁面的 CSS 即可，以下新增一點點 .is-empty 的樣式 */
.settings-container { max-width: 600px; margin: 0 auto; padding: 10px; }
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.lock-btn { background: white; border: 1px solid #ddd; color: #666; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.lock-btn.is-locked { background: #fff3e0; color: #f57c00; border-color: #f57c00; }
.hint-bar { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 10px 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; text-align: center; font-weight: bold; }
.hint-bar.locked-hint { background: #fff3e0; color: #f57c00; }
.settings-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); border: 1px solid #f1f5f9; transition: opacity 0.3s; }
.locked-card { opacity: 0.9; }
.card-header { font-size: 1.1rem; font-weight: bold; color: #334155; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
.danger-zone { border-color: #fecaca; background: #fff5f5; }
.locked-danger { filter: grayscale(80%); opacity: 0.7; }
.danger-text { color: #dc2626; border-bottom-color: #fecaca; }
.form-group { margin-bottom: 10px; }
.form-group label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 8px; font-weight: bold; }
.readonly-text { font-size: 1.2rem; font-weight: bold; color: #333; padding: 5px 0; }
.readonly-text.is-empty { color: #94a3b8; font-style: italic; } /* ✨ 新增空資料的灰色樣式 */
.input-row { display: flex; gap: 10px; }
.input-row input { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; outline: none; transition: 0.2s; }
.input-row input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.hint-text { font-size: 0.8rem; color: #94a3b8; margin-top: 8px; }
.desc-text { font-size: 0.9rem; color: #475569; line-height: 1.5; margin-bottom: 15px; }
.actions-col { display: flex; flex-direction: column; gap: 15px; }
.divider { height: 1px; background: #e2e8f0; margin: 5px 0; position: relative; }
.divider::after { content: "或"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 0 10px; font-size: 0.8rem; color: #94a3b8; }
.action-btn { padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
.action-btn:active:not(:disabled) { transform: scale(0.98); }
.action-btn:disabled { cursor: not-allowed; filter: grayscale(100%); opacity: 0.5; }
.primary { background: #3b82f6; color: white; }
.primary:hover:not(:disabled) { background: #2563eb; }
.export-btn { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.export-btn:hover:not(:disabled) { background: #bae6fd; }
.import-btn { background: #dcfce7; color: #047857; border: 1px solid #bbf7d0; }
.import-btn:hover:not(:disabled) { background: #bbf7d0; }
.danger-btn { background: #ef4444; color: white; width: 100%; }
.danger-btn:hover:not(:disabled) { background: #dc2626; }
.version-info { text-align: center; color: #cbd5e1; font-size: 0.8rem; margin-top: 30px; line-height: 1.5; }
</style>