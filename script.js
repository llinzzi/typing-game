class TypingGame {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.correctCount = 0;
        this.totalCount = 0;
        this.currentLetter = '';
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.stickerCount = 0;
        this.stickerTarget = 20;
        this.stickers = [];
        this.stickerEmojis = ['🧸', '🐻', '🐰', '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙', '🦄', '🦋', '🐞', '🦕', '🦖', '🐳', '🐬', '🦈', '🐠'];
        this.bigStickerEmojis = ['🌟', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎀', '🎁', '🎂', '🎃', '🎄', '🎅', '🎆', '🎇', '🎈', '🎉', '🎊'];
        this.backgroundStickers = [];
        
        // 游戏激励系统
        this.level = 1;
        this.streak = 0;
        this.bonusMultiplier = 1;
        this.achievements = [];
        this.achievementList = [
            { id: 'first_10', name: '初学者', description: '收集10个贴纸', requirement: 10, icon: '🎯' },
            { id: 'perfect_5', name: '完美连击', description: '连续正确5次', requirement: 5, icon: '🔥' },
            { id: 'speed_demon', name: '速度之王', description: '连续快速正确3次', requirement: 3, icon: '⚡' },
            { id: 'collector', name: '收藏家', description: '收集所有贴纸', requirement: 20, icon: '🏆' },
            { id: 'accuracy_master', name: '精准大师', description: '正确率达到90%', requirement: 90, icon: '🎯' }
        ];
        
        // 初始化音效
        this.audioContext = null;
        this.initAudio();
        
        this.initializeElements();
        this.bindEvents();
        this.generateNewLetter();
        this.initializeStickers();
        this.initializeAchievements();
    }

    initializeElements() {
        this.scoreElement = document.getElementById('score');
        this.comboElement = document.getElementById('combo');
        this.timeElement = document.getElementById('time');
        this.currentLetterElement = document.getElementById('current-letter');
        this.gameMessageElement = document.getElementById('game-message');
        this.progressFillElement = document.getElementById('progress-fill');
        this.rewardNotification = document.getElementById('reward-notification');
        this.rewardText = document.getElementById('reward-text');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScoreElement = document.getElementById('final-score');
        this.finalComboElement = document.getElementById('final-combo');
        this.finalAccuracyElement = document.getElementById('final-accuracy');
        
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        
        this.stickerGrid = document.getElementById('sticker-grid');
        this.stickerCountElement = document.getElementById('sticker-count');
        this.stickerTargetElement = document.getElementById('sticker-target');
        
        // 初始化键盘按键
        this.keys = document.querySelectorAll('.key');
        
        // 创建成就显示区域
        this.createAchievementDisplay();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    playCorrectSound() {
        // 播放正确音效 - 上升的音调
        this.playSound(800, 0.15, 'sine');
        setTimeout(() => this.playSound(1000, 0.15, 'sine'), 100);
        setTimeout(() => this.playSound(1200, 0.2, 'sine'), 200);
    }

    playWrongSound() {
        // 播放错误音效 - 下降的音调
        this.playSound(400, 0.2, 'sawtooth');
        setTimeout(() => this.playSound(300, 0.2, 'sawtooth'), 100);
        setTimeout(() => this.playSound(200, 0.3, 'sawtooth'), 200);
    }

    createAchievementDisplay() {
        const achievementContainer = document.createElement('div');
        achievementContainer.id = 'achievement-container';
        achievementContainer.className = 'achievement-container';
        document.body.appendChild(achievementContainer);
    }

    initializeAchievements() {
        this.achievements = [];
        this.streak = 0;
        this.bonusMultiplier = 1;
    }

    checkAchievements() {
        const accuracy = this.totalCount > 0 ? Math.round((this.correctCount / this.totalCount) * 100) : 0;
        
        // 检查各种成就
        const newAchievements = [];
        
        // 收集10个贴纸
        if (this.stickerCount >= 10 && !this.achievements.includes('first_10')) {
            newAchievements.push('first_10');
        }
        
        // 连续正确5次
        if (this.combo >= 5 && !this.achievements.includes('perfect_5')) {
            newAchievements.push('perfect_5');
        }
        
        // 收集所有贴纸
        if (this.stickerCount >= 20 && !this.achievements.includes('collector')) {
            newAchievements.push('collector');
        }
        
        // 正确率达到90%
        if (accuracy >= 90 && this.totalCount >= 10 && !this.achievements.includes('accuracy_master')) {
            newAchievements.push('accuracy_master');
        }
        
        // 显示新成就
        newAchievements.forEach(achievementId => {
            this.showAchievement(achievementId);
            this.achievements.push(achievementId);
        });
    }

    showAchievement(achievementId) {
        const achievement = this.achievementList.find(a => a.id === achievementId);
        if (!achievement) return;
        
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement-notification';
        achievementElement.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">🏆 成就解锁！</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        document.getElementById('achievement-container').appendChild(achievementElement);
        
        // 播放成就音效
        this.playAchievementSound();
        
        // 3秒后移除
        setTimeout(() => {
            achievementElement.classList.add('fade-out');
            setTimeout(() => {
                if (achievementElement.parentNode) {
                    achievementElement.parentNode.removeChild(achievementElement);
                }
            }, 500);
        }, 3000);
    }

    playAchievementSound() {
        // 播放成就音效 - 欢快的音调
        this.playSound(800, 0.1, 'sine');
        setTimeout(() => this.playSound(1000, 0.1, 'sine'), 100);
        setTimeout(() => this.playSound(1200, 0.1, 'sine'), 200);
        setTimeout(() => this.playSound(1400, 0.2, 'sine'), 300);
        setTimeout(() => this.playSound(1200, 0.1, 'sine'), 500);
        setTimeout(() => this.playSound(1000, 0.1, 'sine'), 600);
        setTimeout(() => this.playSound(800, 0.2, 'sine'), 700);
    }

    calculateBonusPoints() {
        let bonus = 0;
        
        // 连击奖励
        if (this.combo >= 5) bonus += 10;
        if (this.combo >= 10) bonus += 20;
        if (this.combo >= 15) bonus += 30;
        
        // 准确率奖励
        const accuracy = this.totalCount > 0 ? (this.correctCount / this.totalCount) * 100 : 0;
        if (accuracy >= 95) bonus += 15;
        else if (accuracy >= 90) bonus += 10;
        else if (accuracy >= 80) bonus += 5;
        
        return bonus;
    }

    checkPerfectComboReward() {
        // 完美连击奖励：5连击、10连击、15连击时额外奖励一个贴纸
        if (this.combo === 5 || this.combo === 10 || this.combo === 15) {
            // 额外添加一个贴纸
            this.addBonusSticker();
            
            // 显示完美连击提示
            this.showPerfectComboMessage();
            
            // 播放完美连击音效
            this.playPerfectComboSound();
        }
    }

    addBonusSticker() {
        // 如果还没收集满，添加额外贴纸
        if (this.stickerCount < this.stickerTarget) {
            const emoji = this.stickerEmojis[this.stickerCount % this.stickerEmojis.length];
            this.stickers[this.stickerCount] = emoji;
            
            const stickerSlot = this.stickerGrid.children[this.stickerCount];
            stickerSlot.textContent = emoji;
            stickerSlot.classList.add('filled');
            stickerSlot.classList.add('bonus-sticker');
            
            this.stickerCount++;
            this.updateStickerDisplay();
            
            // 移除奖励贴纸的特殊样式
            setTimeout(() => {
                stickerSlot.classList.remove('bonus-sticker');
            }, 2000);
        }
    }

    showPerfectComboMessage() {
        const comboMessages = {
            5: '🔥 完美5连击！额外奖励贴纸！',
            10: '⚡ 完美10连击！额外奖励贴纸！',
            15: '🌟 完美15连击！额外奖励贴纸！'
        };
        
        const message = comboMessages[this.combo];
        if (message) {
            this.gameMessageElement.textContent = message;
            
            // 3秒后恢复正常消息
            setTimeout(() => {
                if (this.isPlaying) {
                    this.gameMessageElement.textContent = '继续加油！';
                }
            }, 3000);
        }
    }

    playPerfectComboSound() {
        // 播放完美连击音效 - 欢快的连续音调
        this.playSound(800, 0.1, 'sine');
        setTimeout(() => this.playSound(1000, 0.1, 'sine'), 100);
        setTimeout(() => this.playSound(1200, 0.1, 'sine'), 200);
        setTimeout(() => this.playSound(1400, 0.1, 'sine'), 300);
        setTimeout(() => this.playSound(1600, 0.2, 'sine'), 400);
        setTimeout(() => this.playSound(1400, 0.1, 'sine'), 600);
        setTimeout(() => this.playSound(1200, 0.1, 'sine'), 700);
        setTimeout(() => this.playSound(1000, 0.1, 'sine'), 800);
        setTimeout(() => this.playSound(800, 0.2, 'sine'), 900);
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    initializeStickers() {
        this.stickerGrid.innerHTML = '';
        this.stickers = [];
        
        for (let i = 0; i < this.stickerTarget; i++) {
            const stickerSlot = document.createElement('div');
            stickerSlot.className = 'sticker-slot';
            stickerSlot.dataset.index = i;
            this.stickerGrid.appendChild(stickerSlot);
            this.stickers.push(null);
        }
        
        this.updateStickerDisplay();
    }

    addSticker() {
        if (this.stickerCount >= this.stickerTarget) return;
        
        const emoji = this.stickerEmojis[this.stickerCount % this.stickerEmojis.length];
        this.stickers[this.stickerCount] = emoji;
        
        const stickerSlot = this.stickerGrid.children[this.stickerCount];
        stickerSlot.textContent = emoji;
        stickerSlot.classList.add('filled');
        
        this.stickerCount++;
        this.updateStickerDisplay();
        
        // 检查是否收集满贴纸
        if (this.stickerCount >= this.stickerTarget) {
            this.showLevelComplete();
        }
    }

    startNewLevel() {
        // 重置贴纸计数
        this.stickerCount = 0;
        this.stickers = [];
        
        // 清空贴纸网格
        this.initializeStickers();
        
        // 重置游戏状态
        this.isPlaying = false;
        this.isPaused = false;
        this.combo = 0;
        this.correctCount = 0;
        this.totalCount = 0;
        
        // 更新显示
        this.updateDisplay();
        this.generateNewLetter();
        
        // 重置按钮状态
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        this.gameMessageElement.textContent = '准备开始第二关！按任意键开始游戏';
    }

    removeSticker() {
        if (this.stickerCount <= 0) return;
        
        this.stickerCount--;
        this.stickers[this.stickerCount] = null;
        
        const stickerSlot = this.stickerGrid.children[this.stickerCount];
        stickerSlot.classList.add('removed');
        
        setTimeout(() => {
            stickerSlot.textContent = '';
            stickerSlot.classList.remove('filled', 'removed');
        }, 300);
        
        this.updateStickerDisplay();
    }

    updateStickerDisplay() {
        this.stickerCountElement.textContent = this.stickerCount;
        this.stickerTargetElement.textContent = this.stickerTarget;
    }

    showLevelComplete() {
        this.stopTimer();
        this.isPlaying = false;
        
        // 显示过关动画
        this.gameMessageElement.textContent = '🎉 恭喜过关！贴纸收集完成！';
        
        // 开盲盒
        this.openBlindBox();
    }

    openBlindBox() {
        // 创建盲盒界面
        const blindBoxModal = document.createElement('div');
        blindBoxModal.className = 'blind-box-modal';
        blindBoxModal.innerHTML = `
            <div class="blind-box-content">
                <h2>🎁 盲盒时间！</h2>
                <p>恭喜收集完所有贴纸！</p>
                <div class="blind-box-container">
                    <div class="blind-box" id="blind-box">
                        <span class="blind-box-text">?</span>
                    </div>
                </div>
                <p>点击盲盒开启！</p>
            </div>
        `;
        
        document.body.appendChild(blindBoxModal);
        
        // 添加点击事件
        const blindBox = document.getElementById('blind-box');
        blindBox.addEventListener('click', () => {
            this.revealBlindBox(blindBox, blindBoxModal);
        });
        
        // 播放盲盒音效
        this.playBlindBoxSound();
    }

    revealBlindBox(blindBox, modal) {
        // 随机选择一个大贴纸
        const randomSticker = this.bigStickerEmojis[Math.floor(Math.random() * this.bigStickerEmojis.length)];
        
        // 添加到背景贴纸列表
        this.backgroundStickers.push(randomSticker);
        
        // 更新盲盒显示
        blindBox.innerHTML = `<span class="big-sticker">${randomSticker}</span>`;
        blindBox.classList.add('opened');
        
        // 播放开箱音效
        this.playOpenBoxSound();
        
        // 更新背景
        this.updateBackground();
        
        // 显示获得提示
        const content = modal.querySelector('.blind-box-content');
        content.innerHTML = `
            <h2>🎉 恭喜获得！</h2>
            <div class="big-sticker-display">${randomSticker}</div>
            <p>大贴纸已添加到背景！</p>
            <button class="btn btn-primary" id="continue-btn">继续游戏</button>
        `;
        
        // 绑定关闭事件
        const continueBtn = content.querySelector('#continue-btn');
        continueBtn.addEventListener('click', () => {
            this.closeBlindBox(modal);
        });
    }

    closeBlindBox(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        
        // 开始新关卡
        setTimeout(() => {
            this.startNewLevel();
        }, 500);
    }

    updateBackground() {
        // 创建或更新背景贴纸容器
        let backgroundContainer = document.getElementById('background-stickers');
        if (!backgroundContainer) {
            backgroundContainer = document.createElement('div');
            backgroundContainer.id = 'background-stickers';
            backgroundContainer.className = 'background-stickers';
            document.body.appendChild(backgroundContainer);
        }
        
        // 清空并重新添加所有背景贴纸
        backgroundContainer.innerHTML = '';
        
        if (this.backgroundStickers.length > 0) {
            this.backgroundStickers.forEach((sticker, index) => {
                const stickerElement = document.createElement('div');
                stickerElement.className = 'background-sticker';
                stickerElement.textContent = sticker;
                stickerElement.style.left = (Math.random() * 80 + 10) + '%';
                stickerElement.style.top = (Math.random() * 80 + 10) + '%';
                stickerElement.style.animationDelay = (index * 0.5) + 's';
                backgroundContainer.appendChild(stickerElement);
            });
        }
    }

    playBlindBoxSound() {
        // 播放盲盒音效
        this.playSound(600, 0.2, 'sine');
        setTimeout(() => this.playSound(800, 0.2, 'sine'), 200);
        setTimeout(() => this.playSound(1000, 0.3, 'sine'), 400);
    }

    playOpenBoxSound() {
        // 播放开箱音效
        this.playSound(800, 0.1, 'sine');
        setTimeout(() => this.playSound(1000, 0.1, 'sine'), 100);
        setTimeout(() => this.playSound(1200, 0.1, 'sine'), 200);
        setTimeout(() => this.playSound(1400, 0.2, 'sine'), 300);
        setTimeout(() => this.playSound(1600, 0.3, 'sine'), 500);
    }

    startGame() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.gameMessageElement.textContent = '游戏进行中！按对应的字母键...';
        this.startTimer();
    }

    pauseGame() {
        if (!this.isPlaying) return;
        
        if (this.isPaused) {
            this.isPaused = false;
            this.pauseBtn.textContent = '暂停';
            this.gameMessageElement.textContent = '游戏进行中！按对应的字母键...';
            this.startTimer();
        } else {
            this.isPaused = true;
            this.pauseBtn.textContent = '继续';
            this.gameMessageElement.textContent = '游戏已暂停';
            this.stopTimer();
        }
    }

    resetGame() {
        this.stopTimer();
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.totalCount = 0;
        this.stickerCount = 0;
        this.stickers = [];
        this.backgroundStickers = [];
        
        this.updateDisplay();
        this.generateNewLetter();
        this.initializeStickers();
        this.updateBackground();
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        this.gameMessageElement.textContent = '准备开始！按任意键开始游戏';
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this.updateDisplay();
                
                const progress = ((60 - this.timeLeft) / 60) * 100;
                this.progressFillElement.style.width = progress + '%';
                
                // 游戏现在基于贴纸收集完成，不再基于时间结束
                // 但保留时间显示作为参考
                if (this.timeLeft <= 0) {
                    this.gameMessageElement.textContent = '时间到！继续收集贴纸完成关卡！';
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    handleKeyPress(event) {
        if (!this.isPlaying || this.isPaused) {
            if (!this.isPlaying) {
                this.startGame();
            }
            return;
        }

        const pressedKey = event.key.toUpperCase();
        this.totalCount++;
        
        if (pressedKey === this.currentLetter) {
            this.correctCount++;
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            
            // 计算基础分数和奖励
            let points = 10;
            points += this.combo * 2;
            points += this.calculateBonusPoints();
            
            this.score += points;
            
            // 播放正确音效
            this.playCorrectSound();
            
            // 添加贴纸
            this.addSticker();
            
            // 检查完美连击奖励
            this.checkPerfectComboReward();
            
            // 检查成就
            this.checkAchievements();
            
            // 显示奖励信息
            const bonusPoints = this.calculateBonusPoints();
            let rewardMessage = `正确！+${points}分 (连击: ${this.combo})`;
            if (bonusPoints > 0) {
                rewardMessage += ` +${bonusPoints}奖励`;
            }
            this.showReward(points, this.combo);
            
            this.currentLetterElement.classList.add('bounce');
            setTimeout(() => {
                this.currentLetterElement.classList.remove('bounce');
            }, 300);
            
            this.gameMessageElement.textContent = rewardMessage;
        } else {
            this.combo = 0;
            
            // 播放错误音效
            this.playWrongSound();
            
            // 删除贴纸
            this.removeSticker();
            
            this.gameMessageElement.textContent = `错误！应该是 ${this.currentLetter}`;
            
            this.currentLetterElement.classList.add('shake');
            setTimeout(() => {
                this.currentLetterElement.classList.remove('shake');
            }, 300);
        }
        
        this.generateNewLetter();
        this.updateDisplay();
    }

    generateNewLetter() {
        this.currentLetter = this.letters[Math.floor(Math.random() * this.letters.length)];
        this.currentLetterElement.textContent = this.currentLetter;
        this.highlightKey(this.currentLetter);
        // this.speakLetter(this.currentLetter);
    }

    speakLetter(letter) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(letter);
            utterance.lang = 'en-US';
            utterance.rate = 0.6;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    highlightKey(letter) {
        // 移除之前的高亮
        this.keys.forEach(key => key.classList.remove('highlight'));
        
        // 高亮当前字母对应的按键
        this.keys.forEach(key => {
            if (key.textContent === letter) {
                key.classList.add('highlight');
            }
        });
    }

    showReward(points, combo) {
        let rewardMessage = `+${points}分`;
        if (combo >= 5) {
            rewardMessage += ` 🔥连击${combo}!`;
        } else if (combo >= 3) {
            rewardMessage += ` ⚡连击${combo}!`;
        }
        
        this.rewardText.textContent = rewardMessage;
        this.rewardNotification.classList.add('show');
        
        setTimeout(() => {
            this.rewardNotification.classList.remove('show');
        }, 1000);
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.comboElement.textContent = this.combo;
        this.timeElement.textContent = this.timeLeft;
    }

    endGame() {
        this.stopTimer();
        this.isPlaying = false;
        
        const accuracy = this.totalCount > 0 ? Math.round((this.correctCount / this.totalCount) * 100) : 0;
        
        this.finalScoreElement.textContent = this.score;
        this.finalComboElement.textContent = this.maxCombo;
        this.finalAccuracyElement.textContent = accuracy + '%';
        
        this.gameOverModal.classList.add('show');
    }

    playAgain() {
        this.gameOverModal.classList.remove('show');
        this.resetGame();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TypingGame();
});
