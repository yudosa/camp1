// 게임 상태 관리
class EscapeRoomGame {
    constructor() {
        this.socket = io();
        this.currentCode = '';
        this.correctCode = '4152314'; // 7자리 비밀번호
        this.startTime = Date.now();
        this.gameCompleted = false;
        this.timerInterval = null;
        this.isMobile = this.detectMobile();
        
        this.initializeElements();
        this.initializeSocket();
        this.initializeEventListeners();
        this.startTimer();
        this.setupMobileOptimizations();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    setupMobileOptimizations() {
        if (this.isMobile) {
            // 모바일에서 뷰포트 높이 설정
            const setVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', setVH);
            
            // 터치 이벤트 최적화
            document.addEventListener('touchstart', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }

    initializeElements() {
        this.lockDisplay = document.getElementById('lock-code');
        this.timerDisplay = document.getElementById('timer');
        this.treasureBox = document.getElementById('treasure-box');
        this.boxLid = document.querySelector('.box-lid');
        this.problemBtn = document.getElementById('problem-btn');
        this.problemModal = document.getElementById('problem-modal');
        this.successModal = document.getElementById('success-modal');
        this.explosion = document.getElementById('explosion');
    }

    initializeSocket() {
        // 연결 상태 관리
        this.socket.on('connect', () => {
            console.log('서버에 연결되었습니다.');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('서버 연결이 끊어졌습니다.');
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('연결 오류:', error);
            this.updateConnectionStatus(false);
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
        // 자물쇠 버튼 이벤트 (터치 최적화)
        document.querySelectorAll('.lock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLockButton(e.target);
            });
            
            // 터치 이벤트 추가
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleLockButton(e.target);
            }, { passive: false });
        });

        // 문제보기 버튼
        this.problemBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showProblemModal();
        });
        
        this.problemBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.showProblemModal();
        }, { passive: false });

        // 모달 닫기 버튼
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal(e.target.closest('.modal'));
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.closeModal(e.target.closest('.modal'));
            }, { passive: false });
        });

        // 모달 외부 클릭 시 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
            
            modal.addEventListener('touchstart', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // 키보드 이벤트 (데스크톱에서만)
        if (!this.isMobile) {
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardInput(e);
            });
        }

        // 화면 방향 변경 감지
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateLayout();
            }, 100);
        });

        // 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this.updateLayout();
        });
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
        
        // 서버에 성공 이벤트 전송
        this.socket.emit('end-game', {
            roomId: 'main-room',
            success: true,
            time: this.getElapsedTime()
        });

        // 성공 애니메이션
        this.treasureBox.classList.add('success');
        this.boxLid.style.transform = 'rotateX(-95deg)';
        
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
    }

    handleFailure() {
        // 실패 애니메이션
        this.treasureBox.classList.add('shake');
        setTimeout(() => {
            this.treasureBox.classList.remove('shake');
        }, 500);

        // 모바일에서 진동 피드백 (선택사항)
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(200);
        }
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
        // 모바일에서 스크롤 방지
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
        
        // 이미지 줌 기능 초기화
        this.initializeImageZoom();
    }

    initializeImageZoom() {
        const problemImage = document.querySelector('#problem-modal .problem-image img');
        if (!problemImage) return;

        let currentScale = 1;
        let initialDistance = 0;
        let initialScale = 1;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let translateX = 0;
        let translateY = 0;

        // 터치 이벤트 (핀치 줌)
        problemImage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialScale = currentScale;
            } else if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }
        }, { passive: false });

        problemImage.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = (currentDistance / initialDistance) * initialScale;
                currentScale = Math.min(Math.max(scale, 0.5), 5); // 0.5배 ~ 5배 제한
                this.applyZoom(problemImage, currentScale, translateX, translateY);
            } else if (e.touches.length === 1 && isDragging) {
                e.preventDefault();
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                this.applyZoom(problemImage, currentScale, translateX, translateY);
            }
        }, { passive: false });

        problemImage.addEventListener('touchend', (e) => {
            isDragging = false;
            
            // 더블 탭으로 리셋
            const currentTime = new Date().getTime();
            const tapLength = currentTime - (problemImage.lastTap || 0);
            if (tapLength < 500 && tapLength > 0) {
                // 더블 탭
                currentScale = 1;
                translateX = 0;
                translateY = 0;
                this.applyZoom(problemImage, currentScale, translateX, translateY);
                e.preventDefault();
            }
            problemImage.lastTap = currentTime;
        });

        // 마우스 휠 줌 (데스크톱)
        problemImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            currentScale = Math.min(Math.max(currentScale * delta, 0.5), 5);
            this.applyZoom(problemImage, currentScale, translateX, translateY);
        }, { passive: false });

        // 더블 클릭으로 리셋 (데스크톱)
        problemImage.addEventListener('dblclick', (e) => {
            e.preventDefault();
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            this.applyZoom(problemImage, currentScale, translateX, translateY);
        });

        // 마우스 드래그 (데스크톱)
        problemImage.addEventListener('mousedown', (e) => {
            if (currentScale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                problemImage.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && currentScale > 1) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                this.applyZoom(problemImage, currentScale, translateX, translateY);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (problemImage) {
                problemImage.style.cursor = 'zoom-in';
            }
        });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    applyZoom(image, scale, translateX = 0, translateY = 0) {
        image.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        image.style.transformOrigin = 'center center';
        image.style.transition = scale === 1 ? 'transform 0.3s ease-out' : 'transform 0.1s ease-out';
        
        // 줌 레벨에 따라 커서 변경
        if (scale > 1) {
            image.style.cursor = 'grab';
        } else {
            image.style.cursor = 'zoom-in';
        }
    }

    showSuccessModal() {
        this.successModal.style.display = 'block';
        // 모바일에서 스크롤 방지
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            // 모바일에서 스크롤 복원
            if (this.isMobile) {
                document.body.style.overflow = 'auto';
            }
            
            // 문제 모달이 닫힐 때 이미지 줌 리셋
            if (modal === this.problemModal) {
                const problemImage = document.querySelector('#problem-modal .problem-image img');
                if (problemImage) {
                    problemImage.style.transform = 'scale(1)';
                }
            }
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

    updateConnectionStatus(isOnline) {
        // 연결 상태 표시 (선택사항)
        console.log('연결 상태:', isOnline ? '온라인' : '오프라인');
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
        this.startTime = Date.now();
        this.gameCompleted = false;
        
        this.updateDisplay();
        this.timerDisplay.textContent = '00:00';
        
        this.treasureBox.classList.remove('success');
        this.boxLid.style.transform = '';
        
        this.startTimer();
        
        // 로컬 스토리지에서 성공 기록 제거
        localStorage.removeItem('escapeRoomCompleted');
        localStorage.removeItem('escapeRoomTime');
    }

    updateLayout() {
        // 모바일 최적화
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // 화면 크기에 따른 추가 최적화
        if (window.innerWidth <= 480) {
            // 작은 모바일 화면
            document.body.classList.add('small-mobile');
        } else if (window.innerWidth <= 768) {
            // 일반 모바일 화면
            document.body.classList.add('mobile');
        } else if (window.innerWidth <= 1024) {
            // 태블릿 화면
            document.body.classList.add('tablet');
        } else {
            // 데스크톱 화면
            document.body.classList.remove('small-mobile', 'mobile', 'tablet');
        }
    }
}

// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    const game = new EscapeRoomGame();
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => {
        game.updateLayout();
    });
    
    // 초기 레이아웃 설정
    game.updateLayout();
    
    // 성공 기록이 있으면 표시
    const completed = localStorage.getItem('escapeRoomCompleted');
    if (completed === 'true') {
        const time = localStorage.getItem('escapeRoomTime');
        console.log(`이전 기록: ${time}초`);
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
