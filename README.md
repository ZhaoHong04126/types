# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

此範本旨在協助您快速上手使用 Vue 3 和 TypeScript 在 Vite 中進行開發。此範本使用 Vue 3 的 `<script setup>` SFC（腳本配置），請參閱腳本設定文件以了解更多資訊。

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

如需了解更多關於建議的專案配置和 IDE 支援的信息，請參閱 Vue 文件的 TypeScript 指南。


## GIT遠端推送
* (1)git status : 
    * 隨時檢查哪些檔案被修改了、哪些還沒加入暫存區。
* (2)git add . : 
    * 將修改過的檔案放入暫存區。
* (3)git commit -m "_" : 
    * 將暫存區的檔案正式存入本機儲存庫，並寫下修改說明。
* (4)git push : 
    * 將本機的修改上傳到遠端儲存庫與大家分享。

## 編譯（打包）成純 JavaScript、HTML 和 CSS

### npm run build
* 執行編譯（打包）指令
* 這時系統會開始做幾件事：
    * 檢查你的 TypeScript 語法有沒有錯誤（Type Check）。
    * 把所有的 .vue 和 .ts 檔案編譯成瀏覽器看得懂的 .js 檔案。
    * 把所有的程式碼壓縮（Minify），讓檔案變得超小，提升網頁載入速度。
    * 💡 如果在編譯過程中跳出紅字的 TypeScript 錯誤：
    不用擔心，這通常是一些變數型別沒有定義得很嚴謹。你可以先試著修正它；如果急著想看成品，你也可以暫時在有問題的那一行上方加上 // @ts-ignore 來忽略錯誤，然後再次執行 npm run build。
* 編譯成功後，你會在 VS Code 左側的檔案總管裡，看到多出一個叫做 dist（Distribution 的縮寫）的資料夾。
    * 打開 dist 資料夾，你會看到：
        * index.html (這是整個網站的入口)
        * assets/ 資料夾 (裡面裝著壓縮過後的 .js 和 .css 檔案，檔名會像 index-d34bc2.js 這樣帶有亂碼，這是為了防止瀏覽器快取舊檔案)
    * 這個 dist 資料夾裡面的所有東西，就是你最終要放到網路上的完整成品！

### 在本地端預覽成果 (選作)
* 因為安全性的關係，你直接對著 dist/index.html 點兩下在瀏覽器打開，可能會是一片空白。
為了確認編譯出來的成品有沒有問題，你可以在終端機輸入 npm run preview 指令來預覽

### 把 APP 丟到網路上！🌐
* 當你確認 dist 裡面的檔案沒問題後，你就可以免費把這個網站發布到網路上，讓你的同學或朋友也能用手機點開你的「校園王 APP」了！