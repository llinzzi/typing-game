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
        
        // 初始化音效
        this.audioContext = null;
        this.initAudio();
        
        this.initializeElements();
        this.bindEvents();
        this.generateNewLetter();
        this.initializeStickers();
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
        
        setTimeout(() => {
            this.gameOverModal.classList.add('show');
            this.finalScoreElement.textContent = this.score;
            this.finalComboElement.textContent = this.maxCombo;
            const accuracy = this.totalCount > 0 ? Math.round((this.correctCount / this.totalCount) * 100) : 0;
            this.finalAccuracyElement.textContent = accuracy + '%';
        }, 2000);
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
        this.timeLeft = 60;
        this.correctCount = 0;
        this.totalCount = 0;
        this.stickerCount = 0;
        
        this.updateDisplay();
        this.generateNewLetter();
        this.initializeStickers();
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        this.gameMessageElement.textContent = '准备开始！按任意键开始游戏';
        this.progressFillElement.style.width = '0%';
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
            
            let points = 10;
            points += this.combo * 2;
            
            this.score += points;
            
            // 播放正确音效
            this.playCorrectSound();
            
            // 添加贴纸
            this.addSticker();
            
            this.showReward(points, this.combo);
            
            this.currentLetterElement.classList.add('bounce');
            setTimeout(() => {
                this.currentLetterElement.classList.remove('bounce');
            }, 300);
            
            this.gameMessageElement.textContent = `正确！+${points}分 (连击: ${this.combo})`;
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
