/* ============================================
   安紘的英雄傳說 - 主程式
   ============================================ */

// ========== 常數定義 ==========

/**
 * 屬性名稱對應表
 * 將屬性代碼對應到中文名稱
 */
const ATTR_MAP = {
    chi: '國語',
    math: '數學',
    eng: '英文',
    ball: '運動',
    life: '生活'
};

/**
 * 屬性圖示對應表
 * 每個屬性對應的emoji圖示
 */
const EMOJI_MAP = {
    chi: '📖',
    math: '🧠',
    eng: '🗣️',
    ball: '⚽',
    life: '🧹'
};

/**
 * 等級稱號系統
 * 每個屬性都有11個等級稱號（每10級一個稱號）
 */
const RANKS = {
    chi: ["朗讀生", "小學生", "中學生", "大學生", "研究生", "學者", "史學家", "考據家", "教授", "大師", "🖋️ 文豪"],
    math: ["數字學徒", "實習生", "魔法使", "幻術師", "咒術師", "大魔導", "召喚師", "構築師", "聖導師", "賢者", "♾️ 法神"],
    eng: ["練習生", "聯絡員", "翻譯官", "外交官", "領事官", "大使", "總督", "議長", "指揮官", "元首", "🌐 村長"],
    ball: ["慢跑者", "追風者", "疾速手", "閃電俠", "穿梭者", "神速手", "躍遷者", "時空者", "超越者", "極速神", "⚡ 光速神"],
    life: ["勤務兵", "班長", "排長", "連長", "營長", "旅長", "師長", "軍長", "司令", "大將軍", "👑 統帥"]
};

/**
 * 升級鼓勵語列表
 * 每次升級時會隨機顯示一句鼓勵語
 */
const ENCOURAGEMENT_MESSAGES = [
    "太棒了！你正在變得更強！",
    "繼續努力，你是最棒的！",
    "哇！又升級了！真厲害！",
    "你的努力沒有白費！",
    "太厲害了！繼續加油！",
    "你正在成為真正的英雄！",
    "每一步都是成長！",
    "堅持就是勝利！",
    "你做得非常好！",
    "繼續前進，沒有什麼能阻擋你！",
    "你的進步讓人驚嘆！",
    "太優秀了！保持這個節奏！",
    "每一次升級都是新的開始！",
    "你正在創造奇蹟！",
    "加油！你離目標更近了！"
];

/**
 * LocalStorage 儲存鍵名
 * 用於儲存和讀取遊戲資料
 */
const STORAGE_KEY = 'hero_data_v19_stable';

// ========== 全域變數 ==========

/**
 * 預設寶物池配置（帶機率和功能描述）
 * 每個寶物都有機率權重和功能描述
 */
const DEFAULT_TREASURE_POOL = [
    { name: '小點心', icon: '🍪', weight: 40, function: '恢復體力，心情+1' },
    { name: '能量飲料', icon: '🥤', weight: 30, function: '補充能量，下次任務經驗+10%' },
    { name: '魔法書', icon: '📚', weight: 15, function: '學習新技能，隨機屬性+5XP' },
    { name: '幸運符', icon: '🍀', weight: 10, function: '帶來好運，免做家事1次' },
    { name: '傳說寶石', icon: '💎', weight: 5, function: '稀有寶物，所有屬性+10XP' }
];

/**
 * 遊戲資料物件
 * 包含所有遊戲狀態：屬性、經驗值、任務記錄、物品等
 */
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    stats: { chi: 1, math: 1, eng: 1, ball: 1, life: 1 },
    exps: { chi: 0, math: 0, eng: 0, ball: 0, life: 0 },
    log: {},
    inventory: [],
    dropRate: 50,
    customTasks: [],
    // 寶物池現在包含機率權重
    treasurePool: DEFAULT_TREASURE_POOL.map(item => ({ ...item }))
};

// 如果舊資料沒有treasurePool，初始化它
if (!data.treasurePool || data.treasurePool.length === 0) {
    data.treasurePool = DEFAULT_TREASURE_POOL.map(item => ({ ...item }));
    save();
}

// 為了向後兼容，保留itemPool（如果存在）
if (data.itemPool && !data.treasurePool) {
    // 將舊的itemPool轉換為treasurePool（均等機率）
    const totalWeight = 100 / data.itemPool.length;
    data.treasurePool = data.itemPool.map(item => ({
        name: item.name,
        icon: item.icon,
        weight: totalWeight,
        function: item.function || '待設定功能'
    }));
    save();
}

// 為現有寶物池添加功能字段（如果沒有）
if (data.treasurePool) {
    let needsUpdate = false;
    data.treasurePool.forEach(item => {
        if (!item.function) {
            item.function = '待設定功能';
            needsUpdate = true;
        }
    });
    if (needsUpdate) {
        save();
    }
}

/**
 * Chart.js 雷達圖實例
 * 用於顯示英雄屬性分佈
 */
let chart = null;

// ========== 資料儲存相關函數 ==========

/**
 * 儲存資料到 LocalStorage
 * 每次資料變更後都應該呼叫此函數
 */
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('儲存資料失敗:', e);
        alert('儲存失敗，請檢查瀏覽器儲存空間');
    }
}

/**
 * 匯出資料為 Base64 編碼字串
 * 用於備份和分享進度
 */
function exportData() {
    try {
        const jsonString = JSON.stringify(data);
        const encoded = btoa(encodeURIComponent(jsonString));
        navigator.clipboard.writeText(encoded).then(() => {
            alert("進度已轉為代碼並複製！請存於 Line 或記事本。");
        }).catch(() => {
            // 如果複製失敗，顯示代碼讓用戶手動複製
            prompt("請複製以下代碼:", encoded);
        });
    } catch (e) {
        alert("匯出失敗：" + e.message);
    }
}

/**
 * 從 Base64 編碼字串匯入資料
 * 用於還原備份的進度
 */
function importData() {
    try {
        const str = document.getElementById('import-area').value.trim();
        if (!str) {
            alert("請輸入代碼！");
            return;
        }
        const decoded = decodeURIComponent(atob(str));
        const json = JSON.parse(decoded);
        
        // 驗證資料格式
        if (json.stats && json.exps && json.log !== undefined) {
            data = json;
            save();
            alert("還原成功！正在重新載入...");
            location.reload();
        } else {
            alert("代碼格式不正確！");
        }
    } catch (e) {
        alert("代碼不正確！錯誤：" + e.message);
    }
}

// ========== 頁面切換相關函數 ==========

/**
 * 切換顯示的頁面
 * @param {string} pageId - 要顯示的頁面ID
 * @param {HTMLElement} el - 被點擊的導航項目元素
 */
function showPage(pageId, el) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // 移除所有導航項目的active狀態
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    // 顯示目標頁面
    document.getElementById(pageId).classList.add('active');
    // 標記當前導航項目為active
    el.classList.add('active');
    
    // 根據頁面ID執行對應的渲染函數
    if (pageId === 'status') renderStatus();
    if (pageId === 'daily') renderDaily();
    if (pageId === 'history') renderHistory();
    if (pageId === 'setting') renderSetting();
}

// ========== 升級提示相關函數 ==========

/**
 * 顯示升級提示畫面
 * @param {string} attr - 升級的屬性代碼
 * @param {number} newLevel - 新的等級
 */
function showLevelUp(attr, newLevel) {
    const overlay = document.getElementById('level-up-overlay');
    const titleEl = document.getElementById('level-up-title');
    const messageEl = document.getElementById('level-up-message');
    const attrEl = document.getElementById('level-up-attr');
    
    // 隨機選擇一句鼓勵語
    const randomMessage = ENCOURAGEMENT_MESSAGES[
        Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)
    ];
    
    // 設置顯示內容
    titleEl.textContent = `等級提升！`;
    messageEl.textContent = randomMessage;
    attrEl.textContent = `${EMOJI_MAP[attr]} ${ATTR_MAP[attr]} Lv.${newLevel}`;
    
    // 顯示提示畫面
    overlay.classList.add('show');
    
    // 播放升級音效
    playSound('levelup');
    
    // 2秒後自動隱藏
    setTimeout(() => {
        overlay.classList.remove('show');
    }, 2000);
}

// ========== 寶箱系統相關函數 ==========

/**
 * 根據機率權重隨機選擇一個寶物
 * @returns {Object} 選中的寶物物件
 */
function selectTreasureByWeight() {
    const pool = data.treasurePool || [];
    if (pool.length === 0) {
        // 如果沒有寶物池，返回預設寶物
        return { name: '小點心', icon: '🍪', function: '待設定功能' };
    }
    
    // 計算總權重
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
    
    // 生成0到總權重之間的隨機數
    let random = Math.random() * totalWeight;
    
    // 根據權重選擇寶物
    for (let i = 0; i < pool.length; i++) {
        random -= (pool[i].weight || 1);
        if (random <= 0) {
            return {
                name: pool[i].name,
                icon: pool[i].icon,
                function: pool[i].function || '待設定功能'
            };
        }
    }
    
    // 如果沒有選中，返回第一個
    return {
        name: pool[0].name,
        icon: pool[0].icon,
        function: pool[0].function || '待設定功能'
    };
}

/**
 * 顯示寶箱選擇界面
 * 顯示3個寶箱讓玩家選擇
 */
function showTreasureBoxSelection() {
    const overlay = document.getElementById('treasure-box-overlay');
    const container = document.getElementById('treasure-box-container');
    
    if (!overlay || !container) return;
    
    // 清空容器
    container.innerHTML = '<h2 class="treasure-title">🎁 選擇一個寶箱！</h2><div class="treasure-boxes"></div>';
    const boxesContainer = container.querySelector('.treasure-boxes');
    
    // 為3個寶箱預先決定獎品（但玩家不知道）
    const treasures = [
        selectTreasureByWeight(),
        selectTreasureByWeight(),
        selectTreasureByWeight()
    ];
    
    // 創建3個寶箱
    treasures.forEach((treasure, index) => {
        const box = document.createElement('div');
        box.className = 'treasure-box';
        box.dataset.index = index;
        box.dataset.treasure = JSON.stringify(treasure);
        box.innerHTML = `
            <div class="treasure-box-icon">📦</div>
            <div class="treasure-box-label">寶箱 ${index + 1}</div>
        `;
        
        // 綁定點擊事件
        box.onclick = () => openTreasureBox(index, treasure, boxesContainer);
        
        boxesContainer.appendChild(box);
    });
    
    // 顯示寶箱選擇界面
    overlay.classList.add('show');
    
    // 播放寶箱出現音效
    playSound('treasureAppear');
}

/**
 * 打開選中的寶箱
 * @param {number} boxIndex - 寶箱索引
 * @param {Object} treasure - 寶物物件
 * @param {HTMLElement} boxesContainer - 寶箱容器
 */
function openTreasureBox(boxIndex, treasure, boxesContainer) {
    // 禁用所有寶箱點擊
    const allBoxes = boxesContainer.querySelectorAll('.treasure-box');
    allBoxes.forEach(box => {
        box.style.pointerEvents = 'none';
    });
    
    const selectedBox = allBoxes[boxIndex];
    
    // 播放開箱音效
    playSound('treasureOpen');
    
    // 開箱動畫
    selectedBox.classList.add('opening');
    
    setTimeout(() => {
        // 顯示獎品
        selectedBox.classList.add('opened');
        selectedBox.innerHTML = `
            <div class="treasure-result-icon">${treasure.icon}</div>
            <div class="treasure-result-name">${treasure.name}</div>
            <div class="treasure-result-label">獲得！</div>
        `;
        
        // 其他寶箱淡出
        allBoxes.forEach((box, idx) => {
            if (idx !== boxIndex) {
                box.style.opacity = '0.3';
                box.style.transform = 'scale(0.8)';
            }
        });
        
        // 添加獎品到背包
        if (data.inventory.length < 8) {
            data.inventory.push(treasure);
            save();
        } else {
            // 背包已滿，顯示提示
            setTimeout(() => {
                alert(`獲得 ${treasure.icon} ${treasure.name}！但背包已滿，無法添加。`);
            }, 500);
        }
        
        // 播放獲得音效
        playSound('treasureGet');
        
        // 顯示特效
        confetti({
            particleCount: 100,
            spread: 60,
            origin: { 
                x: selectedBox.getBoundingClientRect().left / window.innerWidth,
                y: selectedBox.getBoundingClientRect().top / window.innerHeight
            }
        });
        
        // 2秒後關閉界面
        setTimeout(() => {
            document.getElementById('treasure-box-overlay').classList.remove('show');
            renderStatus(); // 更新狀態頁面
        }, 2000);
        
    }, 800); // 開箱動畫持續時間
}

// ========== 音效系統 ==========

/**
 * 播放音效
 * 使用Web Audio API生成簡單的音效
 * @param {string} type - 音效類型：'levelup', 'treasureAppear', 'treasureOpen', 'treasureGet'
 */
function playSound(soundType) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        switch(soundType) {
            case 'levelup':
                // 升級音效：上升的音調
                playTone(audioContext, 523.25, 0.1, 'sine'); // C5
                setTimeout(() => playTone(audioContext, 659.25, 0.1, 'sine'), 100); // E5
                setTimeout(() => playTone(audioContext, 783.99, 0.2, 'sine'), 200); // G5
                break;
            case 'treasureAppear':
                // 寶箱出現音效：神秘音調
                playTone(audioContext, 392, 0.15, 'triangle');
                setTimeout(() => playTone(audioContext, 523.25, 0.15, 'triangle'), 150);
                break;
            case 'treasureOpen':
                // 開箱音效：短促的上升音
                playTone(audioContext, 440, 0.1, 'square');
                setTimeout(() => playTone(audioContext, 554.37, 0.1, 'square'), 50);
                setTimeout(() => playTone(audioContext, 659.25, 0.15, 'sine'), 100);
                break;
            case 'treasureGet':
                // 獲得音效：愉快的音調
                playTone(audioContext, 523.25, 0.1, 'sine');
                setTimeout(() => playTone(audioContext, 659.25, 0.1, 'sine'), 100);
                setTimeout(() => playTone(audioContext, 783.99, 0.2, 'sine'), 200);
                break;
        }
    } catch (e) {
        // 如果音效播放失敗，靜默失敗（不影響遊戲體驗）
        console.log('音效播放失敗:', e);
    }
}

/**
 * 播放單個音調
 * @param {AudioContext} audioContext - 音頻上下文
 * @param {number} frequency - 頻率（Hz）
 * @param {number} duration - 持續時間（秒）
 * @param {string} waveType - 波形類型
 */
function playTone(audioContext, frequency, duration, waveType) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = waveType;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// ========== 經驗值和等級相關函數 ==========

/**
 * 增加經驗值
 * @param {string} attr - 屬性代碼
 * @param {number} amount - 要增加的經驗值數量
 */
function addExp(attr, amount) {
    if (!data.exps[attr]) data.exps[attr] = 0;
    if (!data.stats[attr]) data.stats[attr] = 1;
    
    const oldLevel = data.stats[attr];
    data.exps[attr] += amount;
    
    // 檢查是否升級（每100經驗值升1級）
    while (data.exps[attr] >= 100) {
        data.exps[attr] -= 100;
        data.stats[attr]++;
        
        // 顯示升級特效和提示
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        showLevelUp(attr, data.stats[attr]);
        
        // 升級時有20%機率觸發寶箱選擇
        // 只有觸發寶箱時才會獲得物品，其他情況不給任何物品
        if (Math.random() < 0.2) {
            // 延遲顯示寶箱，讓升級提示先顯示
            setTimeout(() => {
                showTreasureBoxSelection();
            }, 2100); // 升級提示2秒後顯示寶箱
        }
        // 如果沒有觸發寶箱（80%機率），則不給任何物品
    }
    
    // 確保經驗值不超過100
    if (data.exps[attr] > 100) data.exps[attr] = 100;
    
    save();
    
    // 如果升級了，重新渲染狀態頁面以更新顯示
    if (data.stats[attr] > oldLevel) {
        renderStatus();
    }
}

/**
 * 減少經驗值（用於取消任務時）
 * @param {string} attr - 屬性代碼
 * @param {number} amount - 要減少的經驗值數量
 */
function removeExp(attr, amount) {
    if (!data.exps[attr]) data.exps[attr] = 0;
    if (!data.stats[attr]) data.stats[attr] = 1;
    
    data.exps[attr] -= amount;
    
    // 如果經驗值變負數，降級並補回經驗值
    while (data.exps[attr] < 0 && data.stats[attr] > 1) {
        data.stats[attr]--;
        data.exps[attr] += 100;
    }
    
    // 確保經驗值不為負數
    if (data.exps[attr] < 0) data.exps[attr] = 0;
    
    save();
}

// ========== 渲染相關函數 ==========

/**
 * 渲染英雄狀態頁面
 * 顯示屬性、等級、經驗值進度條和雷達圖
 */
function renderStatus() {
    const list = document.getElementById('attr-list');
    list.innerHTML = '';
    let sum = 0;
    
    // 渲染每個屬性的資訊
    Object.keys(ATTR_MAP).forEach(k => {
        sum += data.stats[k] || 1;
        const level = data.stats[k] || 1;
        const exp = data.exps[k] || 0;
        
        // 計算等級稱號（每10級一個稱號，最多11個）
        const rankIndex = Math.min(Math.floor(level / 10), 10);
        const rank = RANKS[k][rankIndex] || RANKS[k][0];
        
        // 創建屬性列
        const attrRow = document.createElement('div');
        attrRow.className = 'attr-row';
        attrRow.innerHTML = `
            <div class="attr-info">
                <span>${EMOJI_MAP[k]} ${ATTR_MAP[k]} Lv.${level}</span>
                <span class="rank-tag">${rank}</span>
            </div>
            <div class="bar-outer">
                <div class="bar-inner" style="width:${exp}%"></div>
            </div>
        `;
        list.appendChild(attrRow);
    });
    
    // 更新總等級（平均等級）
    const totalLevel = Math.floor(sum / 5);
    document.getElementById('total-lv').textContent = totalLevel;
    
    // 更新雷達圖
    if (chart) {
        chart.data.datasets[0].data = Object.keys(ATTR_MAP).map(k => data.stats[k] || 1);
        chart.update();
    }
    
    // 渲染儲物箱
    renderInventory();
}

/**
 * 渲染每日任務頁面
 * 根據今天的星期顯示對應的任務
 */
function renderDaily() {
    const today = new Date();
    const todayStr = today.toLocaleDateString();
    const dayOfWeek = today.getDay(); // 0=週日, 1=週一, ..., 6=週六
    
    // 顯示今天的日期和星期
    const weekDays = "日一二三四五六";
    document.getElementById('today-info').textContent = 
        `${todayStr} (週${weekDays[dayOfWeek]})`;
    
    const dList = document.getElementById('daily-list');
    const sList = document.getElementById('special-task-list');
    const shr = document.getElementById('special-hr');
    
    dList.innerHTML = '<h2>📅 每日任務</h2>';
    sList.innerHTML = '<h2>🏆 特別成就</h2>';
    
    const doneArr = data.log[todayStr] || [];
    let hasSpecial = false;
    
            // 遍歷所有自訂任務
    data.customTasks.forEach((t, taskIndex) => {
        const isDone = doneArr.includes(t.name);
        
        // 檢查任務是否應該在今天顯示
        const shouldShow = t.type === 'special' || 
                          (t.days && Array.isArray(t.days) && t.days.includes(dayOfWeek));
        
        if (shouldShow) {
            const item = document.createElement('div');
            item.className = `daily-item ${t.type === 'special' ? 'special' : ''} ${isDone ? 'done' : ''}`;
            
            // 特別成就任務添加刪除按鈕
            if (t.type === 'special' && !isDone) {
                item.innerHTML = `
                    <div class="check-circle">${isDone ? '✓' : ''}</div>
                    <div style="flex:1">
                        <b>${t.type === 'special' ? '[成就] ' : ''}${t.name}</b><br>
                        <small>${ATTR_MAP[t.attr]} +${t.exp}XP</small>
                    </div>
                    <button class="btn-del" onclick="event.stopPropagation(); deleteSpecialTask(${taskIndex})" style="margin-left:10px;">刪除</button>
                `;
            } else {
                item.innerHTML = `
                    <div class="check-circle">${isDone ? '✓' : ''}</div>
                    <div style="flex:1">
                        <b>${t.type === 'special' ? '[成就] ' : ''}${t.name}</b><br>
                        <small>${ATTR_MAP[t.attr]} +${t.exp}XP</small>
                    </div>
                `;
            }
            
            // 綁定點擊事件（但排除刪除按鈕的點擊）
            item.onclick = (e) => {
                if (e.target.classList.contains('btn-del')) {
                    return; // 如果點擊的是刪除按鈕，不執行任務切換
                }
                toggleTask(t.attr, t.name, t.exp, t.type);
            };
            
            // 根據任務類型添加到對應列表
            if (t.type === 'special') {
                sList.appendChild(item);
                hasSpecial = true;
            } else {
                dList.appendChild(item);
            }
        }
    });
    
    // 如果有特別成就，顯示分隔線
    shr.style.display = hasSpecial ? 'block' : 'none';
}

/**
 * 切換任務完成狀態
 * @param {string} attr - 屬性代碼
 * @param {string} name - 任務名稱
 * @param {number} exp - 任務獎勵經驗值
 * @param {string} type - 任務類型
 */
function toggleTask(attr, name, exp, type) {
    const today = new Date().toLocaleDateString();
    
    // 初始化今天的記錄
    if (!data.log[today]) {
        data.log[today] = [];
    }
    
    const idx = data.log[today].indexOf(name);
    
    if (idx === -1) {
        // 標記為完成
        data.log[today].push(name);
        addExp(attr, parseInt(exp) || 0);
    } else {
        // 取消完成（需要確認）
        if (confirm(`確定要恢復「${name}」嗎？這會扣除已獲得的經驗值。`)) {
            data.log[today].splice(idx, 1);
            removeExp(attr, parseInt(exp) || 0);
        } else {
            return; // 用戶取消，不執行任何操作
        }
    }
    
    save();
    renderDaily();
    renderStatus(); // 更新狀態頁面以顯示新的經驗值
}

/**
 * 渲染歷史記錄頁面
 * 顯示所有完成任務的日期記錄
 */
function renderHistory() {
    const list = document.getElementById('calendar-list');
    list.innerHTML = '';
    
    // 按日期排序（最新的在前）
    const sortedDates = Object.keys(data.log).sort().reverse();
    
    if (sortedDates.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">還沒有任何記錄</p>';
        return;
    }
    
    sortedDates.forEach(d => {
        const tasks = data.log[d];
        if (tasks && tasks.length > 0) {
            const container = document.createElement('div');
            container.className = 'container';
            container.style.borderWidth = '2px';
            container.style.fontSize = '0.75rem';
            container.innerHTML = `<b>${d}</b><br>${tasks.join(', ')}`;
            list.appendChild(container);
        }
    });
}

/**
 * 渲染設定頁面
 * 顯示數值編輯、任務列表、物品列表等
 */
function renderSetting() {
    // 渲染數值編輯區域
    const editArea = document.getElementById('manual-edit-area');
    editArea.innerHTML = '<div class="edit-grid"><b>屬性</b><b>等級</b><b>XP</b></div>';
    
    Object.keys(ATTR_MAP).forEach(k => {
        const level = data.stats[k] || 1;
        const exp = data.exps[k] || 0;
        editArea.innerHTML += `
            <div class="edit-grid">
                <span>${ATTR_MAP[k]}</span>
                <input type="number" id="edit-lv-${k}" value="${level}" min="1">
                <input type="number" id="edit-exp-${k}" value="${exp}" min="0" max="100">
            </div>
        `;
    });
    
    // 渲染任務列表
    const tList = document.getElementById('config-task-list');
    tList.innerHTML = '<h2>現有任務清單</h2>';
    
    if (data.customTasks.length === 0) {
        tList.innerHTML += '<p style="color:#888; font-size:0.8rem;">還沒有任務</p>';
    } else {
        data.customTasks.forEach((t, i) => {
            const taskDiv = document.createElement('div');
            taskDiv.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:5px; background:#fff; padding:8px; border-radius:8px; font-size:0.8rem;';
            taskDiv.innerHTML = `
                <span>${t.name}</span>
                <button class="btn-del" data-task-index="${i}">刪除</button>
            `;
            
            // 使用事件委派避免閉包問題
            taskDiv.querySelector('.btn-del').onclick = (function(index) {
                return function() {
                    if (confirm(`確定要刪除「${data.customTasks[index].name}」嗎？`)) {
                        data.customTasks.splice(index, 1);
                        save();
                        renderSetting();
                    }
                };
            })(i);
            
            tList.appendChild(taskDiv);
        });
    }
    
    // 渲染寶物列表（使用treasurePool）
    const iList = document.getElementById('config-item-list');
    iList.innerHTML = '<h2>現有寶物清單（機率權重）</h2>';
    
    const pool = data.treasurePool || [];
    
    if (pool.length === 0) {
        iList.innerHTML += '<p style="color:#888; font-size:0.8rem;">還沒有寶物</p>';
    } else {
        // 計算總權重以顯示百分比
        const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
        
        pool.forEach((item, i) => {
            const weight = item.weight || 1;
            const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : 0;
            
            const itemFunction = item.function || '待設定功能';
            
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display:flex; flex-direction:column; margin-bottom:15px; background:#fff; padding:12px; border-radius:8px; font-size:0.8rem; gap:8px;';
            itemDiv.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div style="flex:1; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.5rem;">${item.icon}</span>
                        <div style="flex:1;">
                            <div style="font-weight:bold;">${item.name}</div>
                            <div style="color:#666; font-size:0.75rem; margin-top:2px;">${itemFunction}</div>
                        </div>
                    </div>
                    <button class="btn-del" data-item-index="${i}">刪除</button>
                </div>
                <div style="display:flex; align-items:center; gap:5px; padding-top:5px; border-top:1px solid #eee;">
                    <label style="color:#666; font-size:0.75rem;">機率權重：</label>
                    <input type="number" id="weight-${i}" value="${weight}" min="1" max="100" 
                           style="width:60px; padding:4px; border:1px solid #ccc; border-radius:4px; text-align:center;"
                           onchange="updateTreasureWeight(${i}, this.value)">
                    <span style="color:#666; font-size:0.7rem;">(${percentage}%)</span>
                    <label style="color:#666; font-size:0.75rem; margin-left:10px;">功能：</label>
                    <input type="text" id="function-${i}" value="${itemFunction}" 
                           style="flex:1; padding:4px; border:1px solid #ccc; border-radius:4px; font-size:0.75rem;"
                           onchange="updateTreasureFunction(${i}, this.value)" placeholder="例如：免做家事1次">
                </div>
            `;
            
            // 使用事件委派避免閉包問題
            itemDiv.querySelector('.btn-del').onclick = (function(index) {
                return function() {
                    if (confirm(`確定要刪除「${pool[index].name}」嗎？`)) {
                        pool.splice(index, 1);
                        save();
                        renderSetting();
                    }
                };
            })(i);
            
            iList.appendChild(itemDiv);
        });
    }
}

/**
 * 手動更新屬性數值
 * 從設定頁面的輸入框讀取數值並更新
 */
function manualUpdateStats() {
    Object.keys(ATTR_MAP).forEach(k => {
        const levelInput = document.getElementById(`edit-lv-${k}`);
        const expInput = document.getElementById(`edit-exp-${k}`);
        
        if (levelInput && expInput) {
            const level = parseInt(levelInput.value) || 1;
            const exp = parseInt(expInput.value) || 0;
            
            // 驗證數值範圍
            data.stats[k] = Math.max(1, level);
            data.exps[k] = Math.max(0, Math.min(100, exp));
        }
    });
    
    save();
    alert("數值已儲存！");
    renderStatus(); // 更新顯示
}

/**
 * 渲染儲物箱
 * 顯示最多8個物品欄位，包含名稱和功能
 */
function renderInventory() {
    const inv = document.getElementById('inventory');
    if (!inv) return;
    
    inv.innerHTML = '';
    
    // 創建8個物品欄位
    for (let i = 0; i < 8; i++) {
        const item = data.inventory[i];
        const slot = document.createElement('div');
        slot.className = 'inv-slot' + (item ? ' has-item' : '');
        
        if (item) {
            // 確保舊資料也有function字段
            if (!item.function) {
                item.function = '待設定功能';
            }
            
            // 顯示物品圖示、名稱和功能
            slot.innerHTML = `
                <div class="inv-item-icon">${item.icon}</div>
                <div class="inv-item-name">${item.name}</div>
                <div class="inv-item-function">${item.function}</div>
            `;
            
            // 綁定點擊事件
            slot.onclick = (function(itemIndex, itemName) {
                return function() {
                    if (confirm(`使用「${itemName}」？`)) {
                        data.inventory.splice(itemIndex, 1);
                        save();
                        renderInventory();
                    }
                };
            })(i, item.name);
        } else {
            slot.innerHTML = '';
        }
        
        inv.appendChild(slot);
    }
}

// ========== 任務和物品管理函數 ==========

/**
 * 切換星期選擇器的顯示/隱藏
 * 特別成就不需要選擇星期
 */
function toggleDayPicker() {
    const taskType = document.getElementById('task-type').value;
    const weekdaySection = document.getElementById('weekday-section');
    if (weekdaySection) {
        weekdaySection.style.display = (taskType === 'normal') ? 'block' : 'none';
    }
}

/**
 * 新增任務
 * 從表單讀取資料並新增到任務列表
 */
function addNewTask() {
    const nameInput = document.getElementById('task-name');
    const attrSelect = document.getElementById('task-attr');
    const typeSelect = document.getElementById('task-type');
    const expInput = document.getElementById('task-exp-input');
    
    const name = nameInput.value.trim();
    if (!name) {
        alert("請輸入任務名稱");
        return;
    }
    
    const attr = attrSelect.value;
    const type = typeSelect.value;
    const exp = parseInt(expInput.value) || 20;
    
    // 如果是每日任務，讀取選中的星期
    let days = [];
    if (type === 'normal') {
        const selectedDays = document.querySelectorAll('#week-picker .day-btn.selected');
        days = Array.from(selectedDays).map(btn => parseInt(btn.dataset.day));
        
        if (days.length === 0) {
            alert("請至少選擇一個星期");
            return;
        }
    } else {
        // 特別成就每天都顯示
        days = [0, 1, 2, 3, 4, 5, 6];
    }
    
    // 新增任務
    data.customTasks.push({
        id: Date.now(),
        name: name,
        attr: attr,
        type: type,
        exp: exp,
        days: days
    });
    
    save();
    
    // 清空表單
    nameInput.value = '';
    expInput.value = '';
    
    // 重新渲染設定頁面
    renderSetting();
}

/**
 * 新增物品到寶物池
 * 從表單讀取資料並新增到物品池（帶機率權重和功能描述）
 */
function addNewItem() {
    const nameInput = document.getElementById('item-name-input');
    const iconInput = document.getElementById('item-icon-input');
    const functionInput = document.getElementById('item-function-input');
    
    const name = nameInput.value.trim();
    if (!name) {
        alert("請輸入寶物名稱");
        return;
    }
    
    const icon = iconInput.value.trim() || '🎁';
    const itemFunction = functionInput.value.trim() || '待設定功能';
    
    // 確保treasurePool存在
    if (!data.treasurePool) {
        data.treasurePool = [];
    }
    
    // 新增物品（預設權重為10）
    data.treasurePool.push({ 
        name: name, 
        icon: icon,
        weight: 10,  // 預設機率權重
        function: itemFunction
    });
    
    save();
    
    // 清空表單
    nameInput.value = '';
    iconInput.value = '';
    functionInput.value = '';
    
    // 重新渲染設定頁面
    renderSetting();
}

/**
 * 刪除特別成就任務（挑戰失敗）
 * @param {number} taskIndex - 任務在customTasks陣列中的索引
 */
function deleteSpecialTask(taskIndex) {
    if (confirm('確定要刪除此特別成就嗎？（挑戰失敗）')) {
        data.customTasks.splice(taskIndex, 1);
        save();
        renderDaily(); // 重新渲染任務頁面
    }
}

/**
 * 更新寶物的機率權重
 * @param {number} index - 寶物索引
 * @param {string} value - 新的權重值
 */
function updateTreasureWeight(index, value) {
    const weight = parseInt(value) || 1;
    if (data.treasurePool && data.treasurePool[index]) {
        data.treasurePool[index].weight = Math.max(1, Math.min(100, weight));
        save();
        renderSetting(); // 重新渲染以更新百分比顯示
    }
}

/**
 * 更新寶物的功能描述
 * @param {number} index - 寶物索引
 * @param {string} value - 新的功能描述
 */
function updateTreasureFunction(index, value) {
    if (data.treasurePool && data.treasurePool[index]) {
        data.treasurePool[index].function = value.trim() || '待設定功能';
        save();
    }
}

// ========== 初始化函數 ==========

/**
 * 初始化應用程式
 * 設置Chart.js圖表和事件監聽器
 */
function init() {
    // 初始化雷達圖
    const canvas = document.getElementById('radar');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.values(ATTR_MAP),
                datasets: [{
                    data: Object.keys(ATTR_MAP).map(k => data.stats[k] || 1),
                    backgroundColor: 'rgba(139, 0, 0, 0.2)',
                    borderColor: '#8b0000',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // 設置星期選擇按鈕的事件監聽器
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.onclick = () => btn.classList.toggle('selected');
    });
    
    // 初始渲染狀態頁面
    renderStatus();
}

// 當頁面載入完成時執行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

