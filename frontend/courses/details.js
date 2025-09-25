document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // ==   1. تحديد العناصر الأساسية    ==
    // ===================================
    const courseDetailsContainer = document.getElementById('course-details-container');
    const navLinksContainer = document.getElementById('nav-links');
    const notificationContainer = document.getElementById('notification-container');
    const videoModal = document.getElementById('video-player-modal');
    const youtubeContainer = document.getElementById('youtube-container');
    const videoLoading = document.getElementById('video-loading');
    const videoError = document.getElementById('video-error');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const currentLessonTitle = document.getElementById('current-lesson-title');
    const videoDuration = document.getElementById('video-duration');
    const devToolsWarning = document.getElementById('dev-tools-warning');
    
    // ===================================
    // ==      2. متغيرات الحالة        ==
    // ===================================
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    
    let youtubePlayer = null;
    let isPlayerReady = false;
    let screenCaptureWarningCount = 0;

    // ===================================
    // ==      3. وظائف مساعدة         ==
    // ===================================

    // وظيفة عرض الإشعارات المحسنة
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const colorClasses = {
            success: 'bg-gradient-to-r from-green-600 to-green-700 border-green-500',
            error: 'bg-gradient-to-r from-red-600 to-red-700 border-red-500',
            warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-500',
            info: 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.className = `notification p-4 rounded-xl shadow-2xl text-white text-sm border-r-4 ${colorClasses[type]} max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="ml-3 text-lg">${icons[type]}</span>
                <span class="font-medium">${message}</span>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInFromTop 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4500);
    };

    // استخراج معرف YouTube
    const extractYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // ===================================
    // ==   4. وظائف المشغل المطور      ==
    // ===================================

    // إعداد YouTube Player API
    window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API جاهز');
    };

// فتح مشغل الفيديو مع حماية متقدمة
const openVideoPlayer = (url, title) => {
    currentLessonTitle.textContent = title;
    const videoId = extractYouTubeId(url);
    
    if (!videoId) {
        showVideoError('رابط YouTube غير صالح');
        return;
    }
    
    videoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    youtubeContainer.classList.remove('hidden');
    videoLoading.classList.remove('hidden');
    videoError.classList.add('hidden');
    
    // إنشاء مشغل YouTube
    if (youtubePlayer) {
        youtubePlayer.destroy();
    }
    
    youtubePlayer = new YT.Player('youtube-player', {
        height: '500',
        width: '100%',
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,              // منع الفيديوهات المقترحة نهائياً
            modestbranding: 1,   // إخفاء شعار YouTube
            disablekb: 1,        // تعطيل اختصارات الكيبورد
            fs: 0,               // منع ملء الشاشة
            cc_load_policy: 0,   // إخفاء الترجمة
            iv_load_policy: 3,   // إخفاء التعليقات التوضيحية
            showinfo: 0,         // إخفاء معلومات الفيديو
            origin: window.location.origin,
            widget_referrer: window.location.href,
            playsinline: 1,      // تشغيل داخل الصفحة على الموبايل
            enablejsapi: 1,      // تفعيل JavaScript API
            color: 'white',      // لون شريط التقدم أبيض
            loop: 0              // عدم تكرار الفيديو
        },
        events: {
            onReady: (event) => {
                isPlayerReady = true;
                videoLoading.classList.add('hidden');
                
                // إخفاء عناصر YouTube المزعجة
                setTimeout(() => {
                    hideYouTubeElements();
                    enhanceVideoProtection();
                }, 100);
                
                const duration = event.target.getDuration();
                const mins = Math.floor(duration / 60);
                const secs = Math.floor(duration % 60);
                videoDuration.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
                showNotification('تم تحميل الفيديو بنجاح! 🎬', 'success');
            },
            onStateChange: (event) => {
                // منع الانتقال إلى YouTube عند انتهاء الفيديو
                if (event.data === YT.PlayerState.ENDED) {
                    event.target.stopVideo();
                    // إخفاء شاشة النهاية فوراً
                    hideEndScreen();
                    showNotification('انتهى الدرس! 👏', 'info');
                }
            },
            onError: (event) => {
                showVideoError('خطأ في تحميل الفيديو من YouTube');
            }
        }
    });
};
// دالة إخفاء عناصر YouTube المزعجة
const hideYouTubeElements = () => {
    // إضافة CSS ديناميكي قوي لإخفاء العناصر
    const style = document.createElement('style');
    style.innerHTML = `
        /* إخفاء جميع عناصر YouTube غير المرغوبة */
        .ytp-chrome-top,
        .ytp-chrome-top-buttons,
        .ytp-title,
        .ytp-title-channel,
        .ytp-show-cards-title,
        .ytp-pause-overlay,
        .ytp-share-button,
        .ytp-overflow-button,
        .ytp-copylink-button,
        .ytp-watch-later-button,
        .ytp-watch-later-icon,
        .ytp-share-button-visible,
        .ytp-youtube-button,
        .ytp-watermark,
        .ytp-cards-button,
        .ytp-cards-teaser,
        .ytp-ce-element,
        .ytp-ce-covering-overlay,
        .ytp-ce-element-shadow,
        .ytp-ce-expanding-overlay,
        .ytp-ce-video,
        .ytp-endscreen-content,
        .ytp-endscreen-previous,
        .ytp-endscreen-next,
        .html5-endscreen,
        .videowall-endscreen,
        .ytp-player-content.ytp-iv-player-content {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }
        
        /* إخفاء قائمة الكليك الأيمن */
        .ytp-popup.ytp-contextmenu {
            display: none !important;
        }
        
        /* منع ظهور pointer على الفيديو */
        .html5-video-player {
            cursor: default !important;
        }
        
        /* إخفاء اللوجو والعنوان في أعلى الفيديو */
        .ytp-gradient-top {
            display: none !important;
        }
        
        /* إخفاء الإعلانات والبطاقات التفاعلية */
        .iv-branding,
        .branding-img,
        .ytp-cards-teaser-text {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
};
// حماية متقدمة ضد فتح روابط YouTube
const preventYouTubeRedirect = () => {
    // مراقبة جميع النقرات على الصفحة
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // منع أي روابط تؤدي إلى YouTube
        if (target.tagName === 'A' && target.href && target.href.includes('youtube.com')) {
            e.preventDefault();
            e.stopPropagation();
            showNotification('لا يمكن فتح YouTube من داخل المنصة', 'warning');
            return false;
        }
    }, true);
    
    // منع فتح نوافذ جديدة
    const originalOpen = window.open;
    window.open = function(url) {
        if (url && url.includes('youtube.com')) {
            showNotification('لا يمكن فتح YouTube في نافذة جديدة', 'warning');
            return null;
        }
        return originalOpen.apply(this, arguments);
    };
};



// دالة إخفاء شاشة النهاية فوراً
const hideEndScreen = () => {
    // محاولة إخفاء شاشة النهاية بطرق متعددة
    const endScreenSelectors = [
        '.ytp-endscreen-content',
        '.html5-endscreen',
        '.ytp-ce-element',
        '.ytp-ce-covering-overlay',
        '.ytp-ce-element-shadow',
        '.ytp-ce-expanding-overlay'
    ];
    
    endScreenSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.remove();
        });
    });
};

// دالة تحسين الحماية على الفيديو
const enhanceVideoProtection = () => {
    // إيجاد iframe YouTube
    const iframe = document.querySelector('#youtube-player');
    if (!iframe) return;
    
    // إضافة طبقة حماية شفافة مُحسّنة
    const protectionOverlay = document.createElement('div');
    protectionOverlay.className = 'absolute inset-0 z-50';
    protectionOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        background: transparent;
        cursor: default;
    `;
    
    // منع جميع أحداث الماوس على الطبقة
    protectionOverlay.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showNotification('النقر بالزر الأيمن غير مسموح على الفيديو', 'warning');
        return false;
    });
    
    // السماح بالنقر للتشغيل/الإيقاف فقط
    protectionOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (youtubePlayer && isPlayerReady) {
            const state = youtubePlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                youtubePlayer.pauseVideo();
            } else {
                youtubePlayer.playVideo();
            }
        }
    });
    
    // منع السحب والإفلات
    protectionOverlay.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });
    
    // إضافة الطبقة للحاوية
    const container = document.querySelector('#youtube-player-wrapper');
    if (container && !container.querySelector('.protection-overlay')) {
        protectionOverlay.classList.add('protection-overlay');
        container.appendChild(protectionOverlay);
    }
    
    // مراقبة التغييرات في DOM لإعادة تطبيق الحماية
    const observer = new MutationObserver(() => {
        hideYouTubeElements();
        hideEndScreen();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // تكرار إخفاء العناصر كل ثانية للتأكد
    setInterval(() => {
        hideEndScreen();
    }, 1000);
};
    // عرض خطأ الفيديو
    const showVideoError = (message) => {
        videoLoading.classList.add('hidden');
        videoError.classList.remove('hidden');
        showNotification(message, 'error');
    };

    // إغلاق مشغل الفيديو (فقط عند الضغط على زر الإغلاق)
    const closeVideoPlayer = () => {
        videoModal.classList.add('hidden');
        document.body.style.overflow = '';
        
        if (youtubePlayer && isPlayerReady) {
            youtubePlayer.pauseVideo();
        }
        
        youtubeContainer.classList.add('hidden');
        videoError.classList.add('hidden');
        videoLoading.classList.add('hidden');
    };

    // ===================================
    // ==      5. وظائف الصفحة         ==
    // ===================================

    // إعداد شريط التنقل
    const setupNavbar = () => {
        let navHTML = '';
        if (authToken && userData) {
            navHTML = `
                <a href="../courses/courses.html" class="text-gray-300 hover:text-white transition-colors hover-scale">جميع الكورسات</a>
                <a href="../dashboard/my-courses.html" class="text-gray-300 hover:text-white transition-colors hover-scale">كورساتي</a>
                ${userData.role === 'instructor' ? `<a href="../dashboard/dashboard.html" class="text-gray-300 hover:text-white transition-colors hover-scale">لوحة التحكم</a>` : ''}
                <button id="logout-btn" class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-6 rounded-lg text-sm transition-all transform hover:scale-105">تسجيل الخروج</button>
            `;
        } else {
            navHTML = `<a href="../login/index.html" class="btn-gradient text-white font-bold py-2 px-6 rounded-lg text-sm">دخول / تسجيل</a>`;
        }
        navLinksContainer.innerHTML = navHTML;
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                showNotification('تم تسجيل الخروج بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = '../login/index.html';
                }, 1000);
            });
        }
    };

    // الالتحاق بالكورس
    const enrollInCourse = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await response.json();
            
            if (!response.ok) { 
                throw new Error(data.message); 
            }

            showNotification('🎉 تم الالتحاق بالكورس بنجاح!', 'success');
            fetchCourseDetails();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // جلب تفاصيل الكورس
    const fetchCourseDetails = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
                headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
            });
            
            if (!response.ok) { 
                throw new Error('لا يمكن العثور على الكورس'); 
            }
            
            const course = await response.json();
            
            // عرض تفاصيل الكورس
            let lessonsHTML = `
                <div class="text-center py-16">
                    <div class="text-8xl mb-6">📚</div>
                    <p class="text-2xl text-gray-400 font-semibold">لا توجد دروس متاحة في هذا الكورس بعد</p>
                    <p class="text-sm text-gray-500 mt-4">سيتم إضافة الدروس قريباً</p>
                </div>
            `;
            
            if (course.lessons && course.lessons.length > 0) {
                lessonsHTML = `
                    <div class="grid gap-6">
                        ${course.lessons.map((lesson, index) => `
                            <div class="course-card bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-2xl hover-glow">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-6 space-x-reverse">
                                        <div class="bg-gradient-to-r from-primary to-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl shadow-lg">
                                            ${lesson.lesson_order || index + 1}
                                        </div>
                                        <div>
                                            <h4 class="text-2xl font-bold text-white mb-2">${lesson.title}</h4>
                                            <p class="text-sm text-gray-400">الدرس ${lesson.lesson_order || index + 1} • محتوى تفاعلي</p>
                                        </div>
                                    </div>
                                    <button data-video-url="${lesson.video_url}" data-lesson-title="${lesson.title}" 
                                            class="play-lesson-btn btn-gradient text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
                                        ▶ مشاهدة الدرس
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            courseDetailsContainer.innerHTML = `
                <div class="max-w-6xl mx-auto">
                    <!-- رأس الكورس -->
                    <div class="gradient-bg rounded-3xl shadow-2xl p-10 mb-10 relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-6">
                            <div class="text-6xl opacity-20">🎓</div>
                        </div>
                        <div class="flex items-start justify-between mb-8 relative z-10">
                            <div class="flex-1">
                                <h1 class="text-5xl font-bold mb-6 text-white drop-shadow-lg">
                                    ${course.title}
                                </h1>
                                <div class="flex items-center space-x-3 space-x-reverse text-white mb-6">
                                    <span class="text-2xl">👨‍🏫</span>
                                    <span class="text-xl font-semibold">بواسطة: ${course.instructor_name}</span>
                                </div>
                                <p class="text-white leading-relaxed text-lg opacity-90">${course.description || 'لا يوجد وصف متاح لهذا الكورس'}</p>
                            </div>
                            <div class="text-center bg-white bg-opacity-20 rounded-2xl p-6 backdrop-blur-sm">
                                <div class="text-4xl font-bold text-white">${course.lessons ? course.lessons.length : 0}</div>
                                <div class="text-sm text-white opacity-75">درس متاح</div>
                            </div>
                        </div>
                        
                        <div id="enroll-button-container" class="mt-8 relative z-10"></div>
                    </div>
                    
                    <!-- قسم الدروس -->
                    <div class="bg-gray-800 rounded-3xl shadow-2xl p-10 border border-gray-700">
                        <div class="flex items-center justify-between mb-10">
                            <h2 class="text-4xl font-bold text-white flex items-center glow-effect">
                                <span class="ml-4">📖</span>
                                محتوى الكورس
                            </h2>
                            <div class="text-sm text-gray-400 bg-gray-700 px-4 py-2 rounded-full">
                                ${course.lessons ? course.lessons.length : 0} درس متاح
                            </div>
                        </div>
                        ${lessonsHTML}
                    </div>
                </div>
            `;
            
            // إعداد زر الالتحاق
            const enrollContainer = document.getElementById('enroll-button-container');
            if (userData && userData.role === 'student') {
                if (course.isEnrolled) {
                    enrollContainer.innerHTML = `
                        <div class="flex items-center bg-green-600 bg-opacity-20 border-2 border-green-500 rounded-2xl p-6 backdrop-blur-sm">
                            <span class="text-green-400 text-3xl ml-4">✅</span>
                            <div>
                                <div class="text-green-300 font-bold text-xl">أنت ملتحق بهذا الكورس</div>
                                <div class="text-green-400 text-sm">يمكنك الآن مشاهدة جميع الدروس</div>
                            </div>
                        </div>
                    `;
                } else {
                    enrollContainer.innerHTML = `
                        <button id="enroll-btn" class="btn-gradient text-white font-bold py-5 px-10 rounded-2xl text-xl transition-all transform hover:scale-105 shadow-2xl flex items-center">
                            <span class="ml-3 text-2xl">🎓</span>
                            التحق بالكورس الآن
                        </button>
                    `;
                    document.getElementById('enroll-btn').addEventListener('click', enrollInCourse);
                }
            } else if (!userData) {
                enrollContainer.innerHTML = `
                    <div class="bg-blue-600 bg-opacity-20 border-2 border-blue-500 rounded-2xl p-6 backdrop-blur-sm">
                        <div class="flex items-center">
                            <span class="text-blue-400 text-3xl ml-4">ℹ️</span>
                            <div>
                                <div class="text-blue-300 font-bold text-xl">سجل دخولك للالتحاق بالكورس</div>
                                <div class="text-blue-400 text-sm">
                                    <a href="../login/index.html" class="underline hover:text-blue-300 font-semibold">اضغط هنا لتسجيل الدخول</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // إعداد أزرار مشاهدة الدروس
            document.querySelectorAll('.play-lesson-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const videoUrl = button.dataset.videoUrl;
                    const lessonTitle = button.dataset.lessonTitle;
                    
                    if (!videoUrl) {
                        showNotification('رابط الفيديو غير متاح', 'error');
                        return;
                    }
                    
                    // التحقق من الالتحاق للطلاب
                    if (userData && userData.role === 'student' && !course.isEnrolled) {
                        showNotification('يجب الالتحاق بالكورس أولاً لمشاهدة الدروس', 'warning');
                        return;
                    }
                    
                    openVideoPlayer(videoUrl, lessonTitle);
                });
            });

        } catch (error) {
            courseDetailsContainer.innerHTML = `
                <div class="text-center py-20">
                    <div class="text-8xl mb-6">😞</div>
                    <h2 class="text-3xl font-bold text-red-400 mb-6">خطأ في تحميل الكورس</h2>
                    <p class="text-gray-400 mb-8 text-lg">${error.message}</p>
                    <a href="./courses.html" class="btn-gradient text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105">
                        العودة للكورسات
                    </a>
                </div>
            `;
        }
    };

    // ===================================
    // ==      6. وظائف الحماية المتقدمة         ==
    // ===================================

    // منع لقطة الشاشة والتسجيل
    const preventScreenCapture = () => {
        const blurElement = document.querySelector('.blur-protection');
        
        // منع لقطة الشاشة
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') {
                blurElement.classList.add('blurred');
                showNotification('تصوير الشاشة غير مسموح به في هذه المنصة', 'error');
                screenCaptureWarningCount++;
                
                if (screenCaptureWarningCount >= 3) {
                    showNotification('تم اكتشاف محاولات متعددة لتصوير الشاشة. سيتم إعادة التوجيه...', 'error');
                    setTimeout(() => {
                        window.location.href = '../courses/courses.html';
                    }, 3000);
                }
                
                setTimeout(() => {
                    blurElement.classList.remove('blurred');
                }, 2000);
            }
        });

        // منع النقر بالزر الأيمن (شامل)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNotification('النقر بالزر الأيمن غير مسموح', 'warning');
            return false;
        }, true);

        // منع اختصارات النسخ والحفظ
        document.addEventListener('keydown', (e) => {
            // منع Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+U, Ctrl+P
            if (e.ctrlKey && ['c', 'a', 's', 'u', 'p'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                e.stopPropagation();
                showNotification('هذا الاختصار غير مسموح', 'warning');
                return false;
            }
            
            // منع F12 وأدوات المطور
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && ['i', 'c', 'j'].includes(e.key.toLowerCase())) ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                e.stopPropagation();
                showDevToolsWarning();
                return false;
            }
        }, true);

        // منع السحب والإفلات
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        }, true);

        // منع التحديد
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        }, true);
    };

    // إظهار تحذير أدوات المطور
    const showDevToolsWarning = () => {
        devToolsWarning.style.display = 'block';
        let countdown = 5;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            devToolsWarning.innerHTML = `
                <h2 class="text-xl font-bold mb-2">⚠️ تحذير أمني</h2>
                <p>استخدام أدوات المطور ممنوع في هذه المنصة</p>
                <p class="text-sm mt-2">سيتم إعادة التوجيه خلال ${countdown} ثواني...</p>
            `;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = '../courses/courses.html';
            }
        }, 1000);
    };

    // مراقبة أدوات المطور
    const detectDevTools = () => {
        let devtools = { open: false };
        
        setInterval(() => {
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            
            if (heightThreshold || widthThreshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    showDevToolsWarning();
                }
            } else {
                devtools.open = false;
            }
        }, 1000);
    };
// دالة حماية متقدمة من أدوات المطور
const advancedDevToolsProtection = () => {
    // كشف محاولات فتح Inspector
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            devToolsWarning.style.display = 'block';
            setTimeout(() => {
                window.location.href = '../courses/courses.html';
            }, 3000);
        }
    });
    
    // طباعة رسالة تحذيرية في Console
    console.log('%c⛔ توقف!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cهذا المحتوى محمي بحقوق الطبع والنشر', 'color: red; font-size: 20px;');
    console.log('%cأي محاولة لنسخ أو سرقة المحتوى ستؤدي إلى اتخاذ إجراءات قانونية', 'color: yellow; font-size: 16px;');
    
    // تعطيل console.log
    const disabledMethods = ['log', 'debug', 'info', 'warn', 'error'];
    disabledMethods.forEach(method => {
        const original = console[method];
        console[method] = function() {
            showNotification('محاولة استخدام وحدة التحكم محظورة', 'error');
            return null;
        };
    });
    
    // منع تصحيح JavaScript
    setInterval(() => {
        debugger;
    }, 100);
};
    // منع تسجيل الشاشة (جزئياً)
    const preventScreenRecording = () => {
        // تغيير عنوان الصفحة عشوائياً لتصعيب التسجيل
        setInterval(() => {
            if (document.hidden) {
                document.title = 'منصة محمية - التسجيل ممنوع';
            } else {
                document.title = 'تفاصيل الكورس - منصة التعلم المطورة';
            }
        }, 1000);

        // إخفاء المحتوى عند تغيير علامة التبويب
        document.addEventListener('visibilitychange', () => {
            const blurElement = document.querySelector('.blur-protection');
            if (document.hidden) {
                blurElement.style.filter = 'blur(20px)';
                showNotification('المحتوى مخفي لأغراض الحماية', 'info');
            } else {
                blurElement.style.filter = 'blur(0px)';
            }
        });
    };

    // تحديث طريقة جلب رابط الفيديو
const fetchSecureVideoUrl = async (lessonId) => {
    try {
        const response = await fetch(`http://localhost:3000/api/lessons/${lessonId}/video`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('غير مصرح لك بمشاهدة هذا الفيديو');
        }
        
        const data = await response.json();
        return data.url;
    } catch (error) {
        showNotification(error.message, 'error');
        return null;
    }
};
// حماية شاملة للصفحة
const comprehensivePageProtection = () => {
    // منع طباعة الصفحة
    window.addEventListener('beforeprint', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showNotification('الطباعة غير مسموحة في هذه المنصة', 'error');
        return false;
    });
    
    // منع اختيار النص في الصفحة كاملة
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    // حماية من أدوات تسجيل الشاشة
    document.addEventListener('keydown', (e) => {
        // منع Win + G (Xbox Game Bar)
        if (e.key === 'g' && e.metaKey) {
            e.preventDefault();
            showNotification('تسجيل الشاشة غير مسموح', 'error');
        }
        
        // منع Win + Alt + R (تسجيل الشاشة في Windows)
        if (e.altKey && e.key === 'r' && e.metaKey) {
            e.preventDefault();
            showNotification('تسجيل الشاشة غير مسموح', 'error');
        }
    });
    
    // إضافة watermark على الفيديو (اختياري)
    const addVideoWatermark = () => {
        const watermark = document.createElement('div');
        watermark.className = 'video-watermark';
        watermark.innerHTML = `
            <div style="position: absolute; top: 20px; right: 20px; color: rgba(255,255,255,0.3); font-size: 14px; z-index: 9999; pointer-events: none;">
                ${userData ? userData.email : 'محتوى محمي'} | ${new Date().toLocaleString('ar-EG')}
            </div>
        `;
        
        const videoContainer = document.querySelector('#youtube-player-wrapper');
        if (videoContainer && !videoContainer.querySelector('.video-watermark')) {
            videoContainer.appendChild(watermark);
        }
    };
    
    // تطبيق الـ watermark بعد تحميل الفيديو
    setTimeout(addVideoWatermark, 2000);
};

// تحديث أزرار مشاهدة الدروس
document.querySelectorAll('.play-lesson-btn').forEach(button => {
    button.addEventListener('click', async () => {
        const lessonId = button.dataset.lessonId; // تأكد من إضافة data-lesson-id في HTML
        const lessonTitle = button.dataset.lessonTitle;
        
        // جلب رابط الفيديو المحمي من الخادم
        const videoUrl = await fetchSecureVideoUrl(lessonId);
        
        if (videoUrl) {
            openVideoPlayer(videoUrl, lessonTitle);
        }
    });
});
    // ===================================
    // ==   7. أحداث الكيبورد للمشغل    ==
    // ===================================

    document.addEventListener('keydown', (e) => {
        // تعمل فقط عند فتح المشغل
        if (!videoModal.classList.contains('hidden')) {
            switch(e.code) {
                case 'Escape':
                    closeVideoPlayer();
                    break;
            }
        }
    });

    // ===================================
    // ==        8. تشغيل الصفحة        ==
    // ===================================

    const initPage = () => {

        
        // التحقق من وجود معرف الكورس
        if (!courseId) {
            showNotification('معرف الكورس غير موجود', 'error');
            setTimeout(() => {
                window.location.href = './courses.html';
            }, 2000);
            return;
        }

        // إعداد المكونات
        setupNavbar();
        fetchCourseDetails();
        preventScreenCapture();
        preventScreenRecording();
        detectDevTools();
        preventScreenCapture();
        preventScreenRecording();
        detectDevTools();
        advancedDevToolsProtection();
        preventYouTubeRedirect();
        comprehensivePageProtection();
        // إعداد أحداث المشغل
        closeModalBtn.addEventListener('click', closeVideoPlayer);
        
        // منع إغلاق المودال عند النقر خارجه
        videoModal.addEventListener('click', (e) => {
            e.stopPropagation();
            // لا نفعل شيء - المشغل لا يُغلق إلا بالزر
        });

        // رسالة ترحيب
        setTimeout(() => {
            showNotification('مرحباً بك في منصة التعلم المطورة! 🎓', 'success');
        }, 1500);
    };

    // بدء تشغيل الصفحة
    initPage();
});