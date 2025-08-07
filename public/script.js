// 게임 상태 관리
class EscapeRoomGame {
    constructor() {
        this.socket = io();
        this.currentCode = '';
        this.correctCode = '4152314'; // 7자리 비밀번호
        this.attempts = 0;
        this.startTime = Date.now();
        this.gameCompleted = false;
        this.timerInterval = null;
        
        this.initializeElements();
        this.initializeSocket();
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
        this.connectionIndicator = document.getElementById('connection-indicator');
        this.connectionText = document.getElementById('connection-text');
    }

    initializeSocket() {
        // 연결 상태 관리
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            console.log('서버에 연결되었습니다.');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            console.log('서버 연결이 끊어졌습니다.');
        });

        // 게임 이벤트 처리
        this.socket.on('game-started', (data) => {
            console.log('게임이 시작되었습니다:', data);
        });

        this.socket.on('game-ended', (data) => {
            console.log('게임이 종료되었습니다:', data);
        });
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
        } else if (digit) {
            this.addDigit(digit);
        }

        this.addButtonFeedback(button);
    }

    handleKeyboardInput(e) {
        if (this.gameCompleted) return;

        if (e.key >= '0' && e.key <= '9' && this.currentCode.length < 4) {
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
        // 7자리로 패딩
        const displayCode = this.currentCode.padEnd(7, '0');
        this.lockDisplay.textContent = displayCode;
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

        this.clearCode();
    }

    handleSuccess() {
        this.gameCompleted = true;
        this.stopTimer();

        // 서버에 성공 이벤트 전송
        this.socket.emit('end-game', {
            roomId: 'main-room',
            success: true,
            attempts: this.attempts,
            time: this.getElapsedTime()
        });

        // 보물상자 열기 애니메이션
        this.boxLid.classList.add('open');

        // 폭발 효과
        setTimeout(() => {
            this.triggerExplosion();
        }, 1000);

        // 성공 모달 표시
        setTimeout(() => {
            this.showSuccessModal();
        }, 2000);
    }

    handleFailure() {
        // 실패 피드백
        this.lockDisplay.style.color = '#e74c3c';
        setTimeout(() => {
            this.lockDisplay.style.color = '#ecf0f1';
        }, 500);

        // 진동 피드백 (모바일)
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    }

    triggerExplosion() {
        this.explosion.style.display = 'block';
        
        // 파티클 애니메이션
        const particles = this.explosion.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            const angle = (index / particles.length) * 2 * Math.PI;
            const distance = 100 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
        });

        // 폭발 효과 숨기기
        setTimeout(() => {
            this.explosion.style.display = 'none';
        }, 1000);
    }

    showProblemModal() {
        this.problemModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    showSuccessModal() {
        this.successModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // 성공 모달이 닫힐 때 게임 리셋
        if (modal === this.successModal) {
            this.resetGame();
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
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateConnectionStatus(isOnline) {
        if (isOnline) {
            this.connectionIndicator.classList.remove('offline');
            this.connectionIndicator.classList.add('online');
            this.connectionText.textContent = '온라인';
        } else {
            this.connectionIndicator.classList.remove('online');
            this.connectionIndicator.classList.add('offline');
            this.connectionText.textContent = '오프라인';
        }
    }

    addButtonFeedback(button) {
        // 터치 피드백
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 100);

        // 진동 피드백 (모바일)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    resetGame() {
        // 게임 상태 리셋
        this.currentCode = '';
        this.attempts = 0;
        this.gameCompleted = false;
        this.startTime = Date.now();
        
        // UI 리셋
        this.updateDisplay();
        this.attemptsDisplay.textContent = '0';
        this.boxLid.classList.remove('open');
        
        // 타이머 재시작
        this.stopTimer();
        this.startTimer();
        
        console.log('게임이 리셋되었습니다.');
    }
}

// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    const game = new EscapeRoomGame();
    
    // 전역 객체로 게임 인스턴스 저장 (디버깅용)
    window.escapeRoomGame = game;
    
    console.log('방탈출 게임이 시작되었습니다!');
});

// 서비스 워커 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW 등록 성공:', registration);
            })
            .catch(registrationError => {
                console.log('SW 등록 실패:', registrationError);
            });
    });
}

// 화면 방향 고정 (모바일)
if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {
        console.log('화면 방향 고정을 지원하지 않습니다.');
    });
}

// 터치 이벤트 최적화
let touchStartY = 0;
let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.modal-content')) {
        e.preventDefault();
    }
}, { passive: false });

// 성능 최적화
let ticking = false;

function updateLayout() {
    // 레이아웃 업데이트 로직
    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateLayout);
        ticking = true;
    }
}

window.addEventListener('resize', requestTick);
