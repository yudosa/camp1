// 게임 상태 관리
class EscapeRoomGame {
    constructor() {
        this.currentCode = '';
        this.correctCode = '4152314'; // 7자리 비밀번호
        this.attempts = 0;
        this.startTime = Date.now();
        this.gameCompleted = false;
        this.timerInterval = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.startTimer();
    }

    initializeElements() {
        this.lockDisplay = document.getElementById('lock-code');
        this.attemptsDisplay = document.getElementById('attempts');
        this.timerDisplay = document.getElementById('timer');
        this.treasureBox = document.getElementById('treasure-box');
        this.boxLid = document.querySelector('.box-lid');
        this.problemBtn = document.getElementById('problem-btn');
        this.problemModal = document.getElementById('problem-modal');
        this.successModal = document.getElementById('success-modal');
        this.explosion = document.getElementById('explosion');
        this.resetBtn = document.getElementById('reset-btn');
    }

    initializeEventListeners() {
        // 자물쇠 버튼 이벤트
        document.querySelectorAll('.lock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleLockButton(e.target);
            });
        });

        // 문제보기 버튼
        this.problemBtn.addEventListener('click', () => {
            this.showProblemModal();
        });

        // 리셋 버튼
        this.resetBtn.addEventListener('click', () => {
            this.resetGame();
        });

        // 모달 닫기 버튼
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // 모달 외부 클릭 시 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });

        // 터치 이벤트 최적화
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    handleLockButton(button) {
        const digit = button.dataset.digit;
        const isClear = button.classList.contains('clear-btn');
        const isEnter = button.classList.contains('enter-btn');

        if (isClear) {
            this.clearCode();
        } else if (isEnter) {
            this.submitCode();
        } else if (digit && this.currentCode.length < 7) {
            this.addDigit(digit);
        }

        this.addButtonFeedback(button);
    }

    handleKeyboardInput(e) {
        if (this.gameCompleted) return;

        if (e.key >= '0' && e.key <= '9' && this.currentCode.length < 7) {
            this.addDigit(e.key);
        } else if (e.key === 'Enter') {
            this.submitCode();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            this.clearCode();
        }
    }

    addDigit(digit) {
        if (this.currentCode.length < 7) {
            this.currentCode += digit;
            this.updateDisplay();
        }
    }

    clearCode() {
        this.currentCode = '';
        this.updateDisplay();
    }

    updateDisplay() {
        this.lockDisplay.textContent = this.currentCode.padEnd(7, '0');
    }

    submitCode() {
        if (this.currentCode.length !== 7) return;

        this.attempts++;
        this.attemptsDisplay.textContent = this.attempts;

        if (this.currentCode === this.correctCode) {
            this.handleSuccess();
        } else {
            this.handleFailure();
        }

        this.currentCode = '';
        this.updateDisplay();
    }

    handleSuccess() {
        this.gameCompleted = true;
        this.stopTimer();
        
        // 성공 애니메이션
        this.treasureBox.classList.add('success');
        this.boxLid.style.transform = 'rotateX(-90deg)';
        
        // 폭발 효과
        setTimeout(() => {
            this.triggerExplosion();
        }, 500);

        // 성공 모달 표시
        setTimeout(() => {
            this.showSuccessModal();
        }, 1000);

        // 로컬 스토리지에 성공 기록
        localStorage.setItem('escapeRoomCompleted', 'true');
        localStorage.setItem('escapeRoomTime', this.getElapsedTime().toString());
        localStorage.setItem('escapeRoomAttempts', this.attempts.toString());
    }

    handleFailure() {
        // 실패 애니메이션
        this.treasureBox.classList.add('shake');
        setTimeout(() => {
            this.treasureBox.classList.remove('shake');
        }, 500);

        // 실패 사운드 효과 (선택사항)
        // this.playFailureSound();
    }

    triggerExplosion() {
        this.explosion.style.display = 'block';
        this.explosion.classList.add('active');
        
        setTimeout(() => {
            this.explosion.classList.remove('active');
            setTimeout(() => {
                this.explosion.style.display = 'none';
            }, 1000);
        }, 2000);
    }

    showProblemModal() {
        this.problemModal.style.display = 'block';
    }

    showSuccessModal() {
        this.successModal.style.display = 'block';
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = this.getElapsedTime();
            this.timerDisplay.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    addButtonFeedback(button) {
        button.classList.add('pressed');
        setTimeout(() => {
            button.classList.remove('pressed');
        }, 150);
    }

    resetGame() {
        this.currentCode = '';
        this.correctCode = '4152314';
        this.attempts = 0;
        this.startTime = Date.now();
        this.gameCompleted = false;
        
        this.updateDisplay();
        this.attemptsDisplay.textContent = '0';
        this.timerDisplay.textContent = '00:00';
        
        this.treasureBox.classList.remove('success');
        this.boxLid.style.transform = '';
        
        this.startTimer();
        
        // 로컬 스토리지에서 성공 기록 제거
        localStorage.removeItem('escapeRoomCompleted');
        localStorage.removeItem('escapeRoomTime');
        localStorage.removeItem('escapeRoomAttempts');
    }
}

// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    const game = new EscapeRoomGame();
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', updateLayout);
    
    // 초기 레이아웃 설정
    updateLayout();
    
    // 성공 기록이 있으면 표시
    const completed = localStorage.getItem('escapeRoomCompleted');
    if (completed === 'true') {
        const time = localStorage.getItem('escapeRoomTime');
        const attempts = localStorage.getItem('escapeRoomAttempts');
        console.log(`이전 기록: ${time}초, ${attempts}번 시도`);
    }
});

// 레이아웃 업데이트 함수
function updateLayout() {
    // 모바일 최적화
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// 애니메이션 프레임 요청
function requestTick() {
    requestAnimationFrame(updateLayout);
}
