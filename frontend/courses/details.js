document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // ==   1. المتغيرات والعناصر       ==
    // ===================================
    const elements = {
        courseDetailsContainer: document.getElementById('course-details-container'),
        navLinksContainer: document.getElementById('nav-links'),
        notificationContainer: document.getElementById('notification-container'),
        videoModal: document.getElementById('video-player-modal'),
        youtubeContainer: document.getElementById('youtube-container'),
        videoLoading: document.getElementById('video-loading'),
        videoError: document.getElementById('video-error'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        currentLessonTitle: document.getElementById('current-lesson-title'),
        videoDuration: document.getElementById('video-duration'),
        devToolsWarning: document.getElementById('dev-tools-warning')
    };

    const state = {
        authToken: localStorage.getItem('authToken'),
        userData: JSON.parse(localStorage.getItem('userData') || 'null'),
        courseId: new URLSearchParams(window.location.search).get('id'),
        youtubePlayer: null,
        isPlayerReady: false,
        currentSpeed: 1
    };

    // ===================================
    // ==      2. وظائف مساعدة         ==
    // ===================================
    const showNotification = (message, type = 'success') => {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        const notification = document.createElement('div');
        notification.className = `notification p-4 rounded-lg shadow-lg text-white ${colors[type]} animate-slideIn`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="ml-3">${icons[type]}</span>
                <span>${message}</span>
            </div>
        `;
        
        elements.notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    };

    const extractYouTubeId = (url) => {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    };


    // Helper Functions للـ Fullscreen
const isFullscreen = () => {
    return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
};

const enterFullscreen = async (element) => {
    if (element.requestFullscreen) {
        return element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        return element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        return element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        return element.msRequestFullscreen();
    }
};

const exitFullscreen = async () => {
    if (document.exitFullscreen) {
        return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        return document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        return document.msExitFullscreen();
    }
};
    // ===================================
    // ==   3. مشغل الفيديو المخصص      ==
    // ===================================
    const videoPlayer = {
        open(url, title) {
            elements.currentLessonTitle.textContent = title;
            const videoId = extractYouTubeId(url);
            
            if (!videoId) {
                showNotification('رابط YouTube غير صالح', 'error');
                return;
            }
            
            elements.videoModal.classList.remove('hidden');
            elements.youtubeContainer.classList.remove('hidden');
            elements.videoLoading.classList.remove('hidden');
            elements.videoError.classList.add('hidden');
            document.body.style.overflow = 'hidden';
            
            this.createPlayer(videoId);
        },

// 1. تحديث دالة createPlayer لحجم أكبر
createPlayer(videoId) {
    if (state.youtubePlayer) {
        state.youtubePlayer.destroy();
    }
    
    // إنشاء أدوات التحكم المخصصة
    this.createCustomControls();
    
    state.youtubePlayer = new YT.Player('youtube-player', {
        height: '100%',  // تغيير إلى 100%
        width: '100%',
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            disablekb: 1,
            fs: 0,
            cc_load_policy: 0,
            iv_load_policy: 3,
            showinfo: 0,
            playsinline: 1,
            enablejsapi: 1
        },
        events: {
            onReady: this.onReady.bind(this),
            onStateChange: this.onStateChange.bind(this),
            onError: () => showNotification('خطأ في تحميل الفيديو', 'error')
        }
    });
},

// 2. تحديث طبقة الحماية لتكون فقط على الفيديو
addProtectionLayer() {
    const overlay = document.createElement('div');
    overlay.className = 'video-protection-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 60px; /* ترك مساحة لأزرار التحكم */
        z-index: 10; /* أقل من أزرار التحكم */
        cursor: default;
    `;
    
    overlay.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showNotification('النقر بالزر الأيمن غير مسموح', 'warning');
    });
    
    // السماح بالنقر للتشغيل/الإيقاف
    overlay.addEventListener('click', (e) => {
        if (state.youtubePlayer && state.isPlayerReady) {
            const playerState = state.youtubePlayer.getPlayerState();
            if (playerState === YT.PlayerState.PLAYING) {
                state.youtubePlayer.pauseVideo();
            } else {
                state.youtubePlayer.playVideo();
            }
        }
    });
    
    document.getElementById('youtube-player-wrapper').appendChild(overlay);
},

// 3. تحديث أدوات التحكم مع z-index أعلى
createCustomControls() {
    const controlsHtml = `
        <div id="custom-video-controls" style="position: absolute; bottom: 0; left: 0; right: 0; z-index:50; background: rgba(0, 0, 0, 0.9); padding: 15px;">
            <div class="flex items-center justify-between text-white">
                <div class="flex items-center gap-4">
                    <button id="play-pause-btn" class="hover:bg-gray-700 p-3 rounded transition cursor-pointer">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path id="play-icon" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                    </button>
                    <div class="text-sm">
                        <span id="current-time">0:00</span>
                        <span class="mx-1">/</span>
                        <span id="total-time">0:00</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <label class="text-sm">السرعة:</label>
                        <select id="speed-select" class="bg-gray-800 rounded px-3 py-2 text-sm cursor-pointer">
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                        </select>
                    </div>
                    
                    <button id="fullscreen-btn" class="hover:bg-gray-700 p-3 rounded transition cursor-pointer">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const wrapper = document.getElementById('youtube-player-wrapper');
    wrapper.insertAdjacentHTML('beforeend', controlsHtml);
    
    // ربط الأحداث
    this.bindControlEvents();
},

        bindControlEvents() {
            // زر التشغيل/الإيقاف
            document.getElementById('play-pause-btn').addEventListener('click', () => {
                if (state.youtubePlayer && state.isPlayerReady) {
                    const playerState = state.youtubePlayer.getPlayerState();
                    if (playerState === YT.PlayerState.PLAYING) {
                        state.youtubePlayer.pauseVideo();
                    } else {
                        state.youtubePlayer.playVideo();
                    }
                }
            });

            // تغيير السرعة
            document.getElementById('speed-select').addEventListener('change', (e) => {
                if (state.youtubePlayer && state.isPlayerReady) {
                    state.youtubePlayer.setPlaybackRate(parseFloat(e.target.value));
                }
            });

// ربط زر الـ Fullscreen
const fullscreenBtn = document.getElementById('fullscreen-btn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', async () => {
        const playerWrapper = document.getElementById('youtube-player-wrapper');
        
        try {
            if (!isFullscreen()) {
                // دخول وضع ملء الشاشة
                await enterFullscreen(playerWrapper);
            } else {
                // الخروج من وضع ملء الشاشة
                await exitFullscreen();
            }
        } catch (error) {
            showNotification('وضع ملء الشاشة غير مدعوم في هذا المتصفح', 'warning');
        }
    });
}

// الاستماع لتغيير حالة fullscreen
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

function updateFullscreenButton() {
    const icon = document.querySelector('#fullscreen-btn svg path');
    if (icon) {
        if (isFullscreen()) {
            // أيقونة الخروج من fullscreen
            icon.setAttribute('d', 'M5 5a1 1 0 011-1h4a1 1 0 010 2H7.414l2.293 2.293a1 1 0 01-1.414 1.414L6 7.414V10a1 1 0 01-2 0V6a1 1 0 011-1zm9 0a1 1 0 011 1v4a1 1 0 01-2 0V7.414l-2.293 2.293a1 1 0 01-1.414-1.414L11.586 6H9a1 1 0 010-2h4a1 1 0 011 1zm0 9a1 1 0 01-1 1h-4a1 1 0 010 2h2.586l-2.293 2.293a1 1 0 001.414 1.414L9 18.586V16a1 1 0 012 0v4a1 1 0 01-1 1zm-9 0a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 000-2H7.414l2.293-2.293a1 1 0 00-1.414-1.414L6 16.586V14a1 1 0 00-2 0z');
        } else {
            // أيقونة دخول fullscreen
            icon.setAttribute('d', 'M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z');
        }
    }
}

            // تحديث الوقت كل ثانية
            setInterval(() => {
                if (state.youtubePlayer && state.isPlayerReady) {
                    const currentTime = state.youtubePlayer.getCurrentTime();
                    const duration = state.youtubePlayer.getDuration();
                    
                    document.getElementById('current-time').textContent = this.formatTime(currentTime);
                    document.getElementById('total-time').textContent = this.formatTime(duration);
                }
            }, 1000);
        },

        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },

        onReady(event) {
            state.isPlayerReady = true;
            elements.videoLoading.classList.add('hidden');
            
            const duration = event.target.getDuration();
            elements.videoDuration.textContent = this.formatTime(duration);
            
            this.hideYouTubeElements();
            this.addProtectionLayer();
            
            showNotification('تم تحميل الفيديو بنجاح! 🎬', 'success');
        },

        onStateChange(event) {
            const playIcon = document.getElementById('play-icon');
            if (event.data === YT.PlayerState.PLAYING) {
                playIcon.setAttribute('d', 'M5 3h4v14H5zM11 3h4v14h-4z'); // pause icon
            } else {
                playIcon.setAttribute('d', 'M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z'); // play icon
            }
            
            if (event.data === YT.PlayerState.ENDED) {
                event.target.stopVideo();
                showNotification('انتهى الدرس! 👏', 'info');
            }
        },

        hideYouTubeElements() {
            const style = document.createElement('style');
            style.innerHTML = `
                .ytp-chrome-top, .ytp-title, .ytp-share-button, .ytp-overflow-button,
                .ytp-watermark, .ytp-cards-button, .ytp-ce-element, .ytp-endscreen-content,
                .ytp-popup.ytp-contextmenu, .ytp-gradient-top {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        },

        addProtectionLayer() {
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 z-40';
            overlay.style.cursor = 'default';
            
            overlay.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showNotification('النقر بالزر الأيمن غير مسموح', 'warning');
            });
            
            document.getElementById('youtube-player-wrapper').appendChild(overlay);
        },

        close() {
            elements.videoModal.classList.add('hidden');
            document.body.style.overflow = '';
            
            if (state.youtubePlayer && state.isPlayerReady) {
                state.youtubePlayer.pauseVideo();
            }
            
            // إزالة أدوات التحكم المخصصة
            const controls = document.getElementById('custom-video-controls');
            if (controls) controls.remove();
        }
    };

    // ===================================
    // ==      4. وظائف الحماية         ==
    // ===================================
    const protection = {
        init() {
            this.preventContextMenu();
            this.preventKeyboardShortcuts();
            this.preventDevTools();
            this.preventTextSelection();
        },

        preventContextMenu() {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showNotification('النقر بالزر الأيمن غير مسموح', 'warning');
                return false;
            });
        },

        preventKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // منع اختصارات النسخ والحفظ
                if (e.ctrlKey && ['c', 'a', 's', 'u', 'p'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    showNotification('هذا الاختصار غير مسموح', 'warning');
                    return false;
                }
                
                // منع F12
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && ['i', 'c', 'j'].includes(e.key.toLowerCase()))) {
                    e.preventDefault();
                    this.showDevToolsWarning();
                    return false;
                }
            });
        },

        preventDevTools() {
            setInterval(() => {
                const threshold = 160;
                const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                
                if (widthThreshold || heightThreshold) {
                    this.showDevToolsWarning();
                }
            }, 1000);
        },

        preventTextSelection() {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        },

        showDevToolsWarning() {
            elements.devToolsWarning.style.display = 'block';
            setTimeout(() => {
                window.location.href = '../courses/courses.html';
            }, 3000);
        }
    };

    // ===================================
    // ==      5. وظائف الصفحة         ==
    // ===================================
    const page = {
        async init() {
            if (!state.courseId) {
                showNotification('معرف الكورس غير موجود', 'error');
                setTimeout(() => window.location.href = './courses.html', 2000);
                return;
            }

            this.setupNavbar();
            await this.loadCourseDetails();
            protection.init();
            
            elements.closeModalBtn.addEventListener('click', () => videoPlayer.close());
            
            showNotification('مرحباً بك في منصة التعلم! 🎓', 'success');
        },

        setupNavbar() {
            let navHTML = '';
            if (state.authToken && state.userData) {
                navHTML = `
                    <a href="../courses/courses.html" class="text-gray-300 hover:text-white">جميع الكورسات</a>
                    <a href="../dashboard/my-courses.html" class="text-gray-300 hover:text-white">كورساتي</a>
                    ${state.userData.role === 'instructor' ? '<a href="../dashboard/dashboard.html" class="text-gray-300 hover:text-white">لوحة التحكم</a>' : ''}
                    <button id="logout-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">تسجيل الخروج</button>
                `;
            } else {
                navHTML = '<a href="../login/index.html" class="bg-blue-600 text-white px-4 py-2 rounded">دخول / تسجيل</a>';
            }
            
            elements.navLinksContainer.innerHTML = navHTML;
            
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.clear();
                    showNotification('تم تسجيل الخروج بنجاح', 'success');
                    setTimeout(() => window.location.href = '../login/index.html', 1000);
                });
            }
        },

        async loadCourseDetails() {
            try {
                const response = await fetch(`http://localhost:3000/api/courses/${state.courseId}`, {
                    headers: state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {}
                });
                
                if (!response.ok) throw new Error('لا يمكن العثور على الكورس');
                
                const course = await response.json();
                this.renderCourse(course);
                
            } catch (error) {
                this.renderError(error.message);
            }
        },

        renderCourse(course) {
            const lessonsHTML = course.lessons && course.lessons.length > 0 
                ? course.lessons.map((lesson, index) => this.createLessonCard(lesson, index)).join('')
                : '<div class="text-center py-16"><p class="text-2xl text-gray-400">لا توجد دروس متاحة بعد</p></div>';

            elements.courseDetailsContainer.innerHTML = `
                <div class="max-w-6xl mx-auto">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8">
                        <h1 class="text-4xl font-bold text-white mb-4">${course.title}</h1>
                        <p class="text-white mb-4">بواسطة: ${course.instructor_name}</p>
                        <p class="text-white">${course.description || 'لا يوجد وصف'}</p>
                        ${this.renderEnrollButton(course)}
                    </div>
                    
                    <div class="bg-gray-800 rounded-lg p-8">
                        <h2 class="text-3xl font-bold text-white mb-6">محتوى الكورس</h2>
                        ${lessonsHTML}
                    </div>
                </div>
            `;

            this.bindLessonEvents(course);
        },

        createLessonCard(lesson, index) {
            return `
                <div class="bg-gray-700 p-6 rounded-lg mb-4 flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-white">${lesson.title}</h3>
                        <p class="text-gray-400">الدرس ${lesson.lesson_order || index + 1}</p>
                    </div>
                    <button data-video-url="${lesson.video_url}" data-lesson-title="${lesson.title}" 
                            class="play-lesson-btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded">
                        مشاهدة
                    </button>
                </div>
            `;
        },

        renderEnrollButton(course) {
            if (!state.userData) {
                return '<div class="mt-6"><a href="../login/index.html" class="text-white underline">سجل دخولك للالتحاق</a></div>';
            }
            
            if (state.userData.role === 'student') {
                if (course.isEnrolled) {
                    return '<div class="mt-6 text-green-300">✅ أنت ملتحق بهذا الكورس</div>';
                } else {
                    return '<button id="enroll-btn" class="mt-6 bg-white text-blue-600 px-6 py-3 rounded font-bold">التحق الآن</button>';
                }
            }
            
            return '';
        },

        bindLessonEvents(course) {
            // زر الالتحاق
            const enrollBtn = document.getElementById('enroll-btn');
            if (enrollBtn) {
                enrollBtn.addEventListener('click', () => this.enrollInCourse());
            }

            // أزرار الدروس
            document.querySelectorAll('.play-lesson-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const videoUrl = button.dataset.videoUrl;
                    const lessonTitle = button.dataset.lessonTitle;
                    
                    if (!videoUrl) {
                        showNotification('رابط الفيديو غير متاح', 'error');
                        return;
                    }
                    
                    if (state.userData?.role === 'student' && !course.isEnrolled) {
                        showNotification('يجب الالتحاق بالكورس أولاً', 'warning');
                        return;
                    }
                    
                    videoPlayer.open(videoUrl, lessonTitle);
                });
            });
        },

        async enrollInCourse() {
            try {
                const response = await fetch(`http://localhost:3000/api/courses/${state.courseId}/enroll`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.authToken}`
                    }
                });
                
                if (!response.ok) throw new Error('حدث خطأ في الالتحاق');
                
                showNotification('تم الالتحاق بنجاح! 🎉', 'success');
                this.loadCourseDetails();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        },

        renderError(message) {
            elements.courseDetailsContainer.innerHTML = `
                <div class="text-center py-20">
                    <h2 class="text-3xl font-bold text-red-400 mb-4">خطأ</h2>
                    <p class="text-gray-400 mb-8">${message}</p>
                    <a href="./courses.html" class="bg-blue-600 text-white px-6 py-3 rounded">العودة للكورسات</a>
                </div>
            `;
        }
    };

    // ===================================
    // ==      6. بدء التطبيق          ==
    // ===================================
    window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API Ready');
    };

    page.init();
});