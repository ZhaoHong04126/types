<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { customAlert, customConfirm } from '../store'; // ✨ 引入自訂彈窗
import type { LotteryCategory } from '../types/Lottery';

const categories = ref<LotteryCategory[]>([
  { id: '1', name: '🍱 午餐吃什麼', items: ['麥當勞', '八方雲集', '學餐', '超商', '健康餐盒', '不吃當減肥'] },
  { id: '2', name: '🥤 飲料喝什麼', items: ['五十嵐', '可不可', '迷客夏', '清心', '麻古', '喝水就好'] },
  { id: '3', name: '💰 誰去買宵夜', items: ['我', '室友A', '室友B', '猜拳決定'] }
]);

const selectedCategoryId = ref('1'); 
const drawResult = ref('❓');        
const isDrawing = ref(false);        
const showEditModal = ref(false);    

const editForm = ref({ id: '', name: '', itemsText: '' });
const STORAGE_KEY = 'uni_life_lottery_v1';

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      categories.value = JSON.parse(saved);
      if (categories.value.length > 0) selectedCategoryId.value = categories.value[0].id;
    } catch (e) { console.error(e); }
  }
});

watch(categories, (newVal) => localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal)), { deep: true });

const currentCategory = computed(() => categories.value.find(c => c.id === selectedCategoryId.value));

// ✨ 改用自訂彈窗
const handleDraw = async () => {
  if (!currentCategory.value || currentCategory.value.items.length === 0) {
    return await customAlert('這個籤筒裡面沒有選項喔，請先新增！', '💡 提示');
  }
  
  if (isDrawing.value) return; 
  isDrawing.value = true;
  drawResult.value = '🤔...';
  const options = currentCategory.value.items;

  let counter = 0;
  const maxTicks = 20; 
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * options.length);
    drawResult.value = options[randomIndex];
    counter++;
    if (counter >= maxTicks) {
      clearInterval(interval);
      isDrawing.value = false;
      const finalIndex = Math.floor(Math.random() * options.length);
      drawResult.value = `🎉 ${options[finalIndex]} 🎉`;
    }
  }, 50); 
};

const openAddModal = () => { editForm.value = { id: '', name: '', itemsText: '' }; showEditModal.value = true; };
const openEditModal = () => {
  if (!currentCategory.value) return;
  editForm.value = { id: currentCategory.value.id, name: currentCategory.value.name, itemsText: currentCategory.value.items.join('\n') };
  showEditModal.value = true;
};

// ✨ 改用自訂彈窗
const saveCategory = async () => {
  if (!editForm.value.name.trim()) return await customAlert('請輸入籤筒名稱喔！', '💡 提示');
  
  const itemsArray = editForm.value.itemsText.split('\n').map(item => item.trim()).filter(item => item !== '');
  if (itemsArray.length === 0) return await customAlert('請至少輸入一個選項喔！', '💡 提示');

  if (editForm.value.id) {
    const index = categories.value.findIndex(c => c.id === editForm.value.id);
    if (index !== -1) { categories.value[index].name = editForm.value.name; categories.value[index].items = itemsArray; }
  } else {
    const newId = Date.now().toString();
    categories.value.push({ id: newId, name: editForm.value.name, items: itemsArray });
    selectedCategoryId.value = newId; 
  }
  showEditModal.value = false; drawResult.value = '❓'; 
};

// ✨ 改用自訂彈窗
const deleteCategory = async () => {
  if (!editForm.value.id) return;
  if (await customConfirm('確定要刪除這個籤筒嗎？', '🗑️ 刪除確認')) {
    categories.value = categories.value.filter(c => c.id !== editForm.value.id);
    if (categories.value.length > 0) selectedCategoryId.value = categories.value[0].id;
    else selectedCategoryId.value = '';
    showEditModal.value = false; drawResult.value = '❓';
  }
};
</script>

<template>
  <div class="lottery-container">
    <div class="selector-card">
      <label class="selector-label">請選擇籤筒：</label>
      <div class="selector-row">
        <select v-model="selectedCategoryId" class="category-select" @change="drawResult = '❓'">
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <button v-if="currentCategory" class="icon-btn" @click="openEditModal" title="編輯此籤筒">✏️</button>
        <button class="icon-btn add-btn" @click="openAddModal" title="新增籤筒">➕</button>
      </div>
    </div>

    <div class="draw-card">
      <div class="result-display" :class="{ 'is-drawing': isDrawing }">{{ drawResult }}</div>
      <button class="draw-btn" :class="{ 'drawing-state': isDrawing }" :disabled="isDrawing || !currentCategory" @click="handleDraw">
        {{ isDrawing ? '抽籤中...' : '🎲 點我抽籤' }}
      </button>
      <div v-if="currentCategory" class="options-preview">
        <p>目前的選項有：</p>
        <div class="tags-container"><span v-for="(item, idx) in currentCategory.items" :key="idx" class="item-tag">{{ item }}</span></div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-card">
        <h3>{{ editForm.id ? '✏️ 編輯籤筒' : '➕ 新增籤筒' }}</h3>
        <div class="form-group"><label>籤筒名稱</label><input v-model="editForm.name" placeholder="例如：明天穿什麼" /></div>
        <div class="form-group"><label>選項 (請每行輸入一個選項)</label><textarea v-model="editForm.itemsText" rows="6" placeholder="T恤&#10;襯衫&#10;帽T"></textarea></div>
        <div class="modal-actions"><button v-if="editForm.id" class="delete-btn" @click="deleteCategory">刪除籤筒</button><button v-else @click="showEditModal = false">取消</button><button class="save-btn" @click="saveCategory">儲存</button></div>
        <button v-if="editForm.id" class="close-text-btn" @click="showEditModal = false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 樣式與原版相同 */
.lottery-container { max-width: 600px; margin: 0 auto; padding: 10px; }
.selector-card { background: white; border-radius: 12px; padding: 15px 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.selector-label { display: block; font-size: 0.9rem; color: #666; margin-bottom: 8px; font-weight: bold; }
.selector-row { display: flex; gap: 10px; align-items: center; }
.category-select { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: #f9fafb; }
.icon-btn { background: white; border: 1px solid #ddd; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
.icon-btn:hover { background: #f3f4f6; } .add-btn { background: #e0f2fe; border-color: #bae6fd; }
.draw-card { background: white; border-radius: 16px; padding: 30px 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
.result-display { font-size: 2.5rem; font-weight: bold; color: #333; min-height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #ccc; transition: all 0.1s; }
.result-display.is-drawing { color: #3b82f6; transform: scale(1.05); border-color: #3b82f6; border-style: solid; }
.draw-btn { background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%); color: #d13054; border: none; padding: 15px 40px; border-radius: 50px; font-size: 1.5rem; font-weight: bold; cursor: pointer; box-shadow: 0 8px 15px rgba(255, 154, 158, 0.4); transition: transform 0.1s, box-shadow 0.1s; width: 100%; max-width: 300px; }
.draw-btn:active { transform: translateY(4px); box-shadow: 0 4px 8px rgba(255, 154, 158, 0.4); }
.draw-btn.drawing-state { background: #e5e7eb; color: #9ca3af; box-shadow: none; cursor: not-allowed; transform: none; }
.options-preview { margin-top: 30px; text-align: left; } .options-preview p { font-size: 0.85rem; color: #888; margin-bottom: 10px; }
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.item-tag { background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; border: 1px solid #e2e8f0; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 25px; border-radius: 16px; width: 90%; max-width: 350px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.2s; }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { margin-top: 0; text-align: center; color: #333; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; } label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 5px; font-weight: bold; }
input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 1rem; font-family: inherit; } textarea { resize: vertical; line-height: 1.5; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; }
.save-btn { background: #3b82f6; color: white; } .delete-btn { background: #fee2e2; color: #ef4444; } .close-text-btn { background: transparent; border: none; color: #999; width: 100%; margin-top: 10px; cursor: pointer; }
</style>