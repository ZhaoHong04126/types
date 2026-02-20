<script setup lang="ts">
import { ref } from 'vue';
import { userName, userDepartment, customAlert, customConfirm } from '../store';

const tempName = ref(userName.value);
const tempDepartment = ref(userDepartment.value);
const isSettingsLocked = ref(true);

const toggleSettingsLock = async () => {
  if (isSettingsLocked.value) {
    const isConfirmed = await customConfirm('確定要解除鎖定嗎？\n（解鎖後可修改基本資料）', '🔓 解鎖確認');
    if (isConfirmed) {
      tempName.value = userName.value; 
      tempDepartment.value = userDepartment.value; 
      isSettingsLocked.value = false;
    }
  } else {
    isSettingsLocked.value = true;
  }
};

const saveSettings = async () => {
  if (!tempName.value.trim()) return await customAlert('暱稱不能為空喔！', '⚠️ 提示');
  
  userName.value = tempName.value.trim();
  userDepartment.value = tempDepartment.value.trim(); 
  await customAlert('個人資料已成功更新！', '✅ 儲存成功');
  isSettingsLocked.value = true; 
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
      🔒 設定已鎖定，請點擊上方按鈕解鎖以編輯資料
    </div>
    <div class="hint-bar" v-else>
      💡 編輯模式已開啟！您可以修改基本資料。
    </div>

    <div class="settings-card" :class="{ 'locked-card': isSettingsLocked }">
      <div class="card-header">👤 基本資料設定</div>
      
      <div class="form-group">
        <label>您的稱呼</label>
        <div v-if="isSettingsLocked" class="readonly-text">{{ userName || '尚未設定' }}</div>
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

    <div class="version-info">
      Campus King 校園王 v1.0<br>Made with ❤️
    </div>
  </div>
</template>

<style scoped>
.settings-container { max-width: 600px; margin: 0 auto; padding: 10px; }
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.lock-btn { background: white; border: 1px solid #ddd; color: #666; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.lock-btn.is-locked { background: #fff3e0; color: #f57c00; border-color: #f57c00; }
.hint-bar { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 10px 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; text-align: center; font-weight: bold; }
.hint-bar.locked-hint { background: #fff3e0; color: #f57c00; }

.settings-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); border: 1px solid #f1f5f9; transition: opacity 0.3s; }
.locked-card { opacity: 0.9; }
.card-header { font-size: 1.1rem; font-weight: bold; color: #334155; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }

.form-group { margin-bottom: 10px; }
.form-group label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 8px; font-weight: bold; }
.readonly-text { font-size: 1.2rem; font-weight: bold; color: #333; padding: 5px 0; }
.readonly-text.is-empty { color: #94a3b8; font-style: italic; } 

.input-row { display: flex; gap: 10px; }
.input-row input { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; outline: none; transition: 0.2s; box-sizing: border-box; }
.input-row input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.hint-text { font-size: 0.8rem; color: #94a3b8; margin-top: 8px; }

.action-btn { padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
.action-btn:active:not(:disabled) { transform: scale(0.98); }
.action-btn:disabled { cursor: not-allowed; filter: grayscale(100%); opacity: 0.5; }
.primary { background: #3b82f6; color: white; }
.primary:hover:not(:disabled) { background: #2563eb; }

.version-info { text-align: center; color: #cbd5e1; font-size: 0.8rem; margin-top: 30px; line-height: 1.5; }
</style>