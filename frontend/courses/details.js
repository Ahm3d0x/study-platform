document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // ==   1. تحديد العناصر الأساسية    ==
    // ===================================
    const courseDetailsContainer = document.getElementById('course-details-container');
    const navLinksContainer = document.getElementById('nav-links');
    const notificationContainer = document.getElementById('notification-container');
    const videoModal = document.getElementById('video-player-modal');
    const videoPlayer = document.getElementById('course-video');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // ===================================
    // ==      2. متغيرات الحالة        ==
    // ===================================
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');

    // ===================================
    // ==      3. وظائف مساعدة         ==
    // ===================================

    // وظيفة عرض الإشعارات
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `p-4 rounded-lg shadow-lg text-white text-sm animate-pulse ${colorClasses}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // وظيفة إعداد شريط التنقل
    const setupNavbar = () => {
        let navHTML = '';
        if (authToken && userData) {
            navHTML = `
                <a href="../courses/courses.html" class="text-gray-300 hover:text-white">كل الكورسات</a>
                <a href="../dashboard/my-courses.html" class="text-gray-300 hover:text-white">كورساتي</a>
                ${userData.role === 'instructor' ? `<a href="../dashboard/dashboard.html" class="text-gray-300 hover:text-white">لوحة التحكم</a>` : ''}
                <button id="logout-btn" class="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">تسجيل الخروج</button>
            `;
        } else {
            navHTML = `<a href="../login/login_regist.html" class="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">دخول / تسجيل</a>`;
        }
        navLinksContainer.innerHTML = navHTML;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = '../login/login_regist.html';
            });
        }
    };

    // وظائف مشغل الفيديو
    const openVideoPlayer = (url) => {
        videoPlayer.src = url;
        videoModal.classList.remove('hidden');
        videoPlayer.play();
    };

    const closeVideoPlayer = () => {
        videoModal.classList.add('hidden');
        videoPlayer.pause();
        videoPlayer.src = '';
    };

    // ===================================
    // ==   4. الوظائف الأساسية للصفحة   ==
    // ===================================

    // وظيفة الالتحاق بالكورس
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
            if (!response.ok) { throw new Error(data.message); }

            showNotification('تم الالتحاق بالكورس بنجاح!', 'success');
            // تحديث الواجهة فورًا بعد الالتحاق
            fetchCourseDetails();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // وظيفة جلب وعرض تفاصيل الكورس
    const fetchCourseDetails = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) { throw new Error('لا يمكن العثور على الكورس'); }
            
            const course = await response.json();
            
            let lessonsHTML = '<p class="text-gray-400">لا توجد دروس متاحة في هذا الكورس بعد.</p>';
            if (course.lessons && course.lessons.length > 0) {
                lessonsHTML = course.lessons.map(lesson => `
                    <li class="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <span class="text-white">${lesson.title}</span>
                        <button data-video-url="${lesson.video_url}" class="play-lesson-btn text-primary hover:underline">مشاهدة الدرس</button>
                    </li>
                `).join('');
            }

            courseDetailsContainer.innerHTML = `
                <div class="bg-gray-800 rounded-2xl shadow-lg p-8">
                    <h1 class="text-4xl font-bold mb-2">${course.title}</h1>
                    <p class="text-lg text-purple-300 mb-6">بواسطة: ${course.instructor_name}</p>
                    <p class="text-gray-300 leading-relaxed mb-8">${course.description}</p>
                    <div id="enroll-button-container"></div>
                    <h2 class="text-3xl font-bold mt-12 mb-6 border-b-2 border-gray-700 pb-2">دروس الكورس</h2>
                    <ul class="space-y-4">${lessonsHTML}</ul>
                </div>
            `;
            
            const enrollContainer = document.getElementById('enroll-button-container');
            if (userData && userData.role === 'student') {
                if (course.isEnrolled) {
                    enrollContainer.innerHTML = `<button class="bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg cursor-not-allowed" disabled>أنت ملتحق بهذا الكورس</button>`;
                } else {
                    enrollContainer.innerHTML = `<button id="enroll-btn" class="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">التحق بالكورس الآن</button>`;
                    document.getElementById('enroll-btn').addEventListener('click', enrollInCourse);
                }
            }

            document.querySelectorAll('.play-lesson-btn').forEach(button => {
                button.addEventListener('click', () => {
                    openVideoPlayer(button.dataset.videoUrl);
                });
            });

        } catch (error) {
            courseDetailsContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        }
    };

    // ===================================
    // ==      5. وظائف الحماية         ==
    // ===================================
    const preventScreenshots = () => {
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') {
                document.body.style.display = 'none';
                // استخدام نظام الإشعارات بدلاً من alert
                showNotification('تصوير الشاشة غير مسموح به.', 'error');
                setTimeout(() => {
                    document.body.style.display = 'flex'; // أو 'block' حسب تصميمك
                }, 100);
            }
        });
    };

    // ===================================
    // ==        6. تشغيل الصفحة        ==
    // ===================================
    const initPage = () => {
        if (!courseId) {
            window.location.href = './courses.html';
            return;
        }
        setupNavbar();
        fetchCourseDetails();
        preventScreenshots();
        closeModalBtn.addEventListener('click', closeVideoPlayer);
    };

    initPage();
});

