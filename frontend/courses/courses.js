document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.getElementById('nav-links');
    const coursesContainer = document.getElementById('courses-container');
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));

    // ===================================
    // ==  1. إعداد شريط التنقل (Navbar) ==
    // ===================================
    const setupNavbar = () => {
        let navHTML = '';
        if (authToken && userData) {
            // حالة المستخدم المسجل
            // تم تحديث الروابط هنا
            navHTML = `
                <span class="text-purple-300">أهلاً، ${userData.full_name}</span>
                <a href="../dashboard/my-courses.html" class="text-gray-300 hover:text-white">كورساتي</a>
                ${userData.role === 'instructor' ? `<a href="../dashboard/dashboard.html" class="text-gray-300 hover:text-white">لوحة التحكم</a>` : ''}
                <button id="logout-btn" class="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">تسجيل الخروج</button>
            `;
        } else {
            // حالة الزائر
            navHTML = `
                <a href="../index.html" class="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">دخول / تسجيل</a>
            `;
        }
        navLinksContainer.innerHTML = navHTML;

        // إضافة وظيفة لزر تسجيل الخروج إذا كان موجودًا
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = '../index.html';
            });
        }
    };

    // ===================================
    // ==   2. جلب وعرض الكورسات       ==
    // ===================================
    const fetchCourses = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/courses');
            if (!response.ok) {
                throw new Error('فشل في جلب الكورسات');
            }
            const courses = await response.json();

            coursesContainer.innerHTML = ''; // تفريغ الحاوية من رسالة التحميل

            if (courses.length === 0) {
                coursesContainer.innerHTML = '<p class="text-center col-span-full text-gray-400">لا توجد كورسات متاحة حاليًا.</p>';
                return;
            }

            courses.forEach(course => {
                // تم تحديث الرابط هنا ليمرر ID الكورس
                const courseCard = `
                    <div class="bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                        <div class="p-6">
                            <h2 class="text-2xl font-bold text-white mb-2">${course.title}</h2>
                            <p class="text-gray-400 mb-4 h-20 overflow-hidden">${course.description || 'لا يوجد وصف متاح.'}</p>
                            <div class="text-sm text-gray-500 mb-4">
                                <span>المحاضر:</span>
                                <span class="font-semibold text-primary">${course.instructor_name}</span>
                            </div>
                            <a href="../courses/details.html?id=${course.id}" class="block w-full text-center bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                عرض التفاصيل
                            </a>
                        </div>
                    </div>
                `;
                coursesContainer.innerHTML += courseCard;
            });

        } catch (error) {
            console.error('Error fetching courses:', error);
            coursesContainer.innerHTML = '<p class="text-center col-span-full text-red-500">حدث خطأ في تحميل الكورسات. تأكد من أن السيرفر يعمل.</p>';
        }
    };

    // ===================================
    // ==   3. تشغيل الوظائف           ==
    // ===================================
    setupNavbar();
    fetchCourses();
});

