document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // ==   1. تحديد العناصر والمتغيرات    ==
    // ===================================
    const navLinksContainer = document.getElementById('nav-links');
    const myCoursesContainer = document.getElementById('my-courses-container');
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));

    // ===================================
    // ==       2. حماية الصفحة         ==
    // ===================================
    // إذا لم يكن هناك مستخدم مسجل أو كان محاضرًا، قم بإعادة التوجيه
    if (!authToken || !userData || userData.role !== 'student') {
        window.location.href = '../index.html';
        return;
    }

    // ===================================
    // ==      3. وظائف مساعدة         ==
    // ===================================
    const setupNavbar = () => {
        // هذا الكود مكرر، في مشروع حقيقي يتم وضعه في ملف منفصل
        let navHTML = `
            <span class="text-purple-300">أهلاً، ${userData.full_name}</span>
            <a href="../courses/courses.html" class="text-gray-300 hover:text-white">كل الكورسات</a>
            <button id="logout-btn" class="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">تسجيل الخروج</button>
        `;
        navLinksContainer.innerHTML = navHTML;

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '../index.html';
        });
    };

    // ===================================
    // ==   4. جلب وعرض الكورسات       ==
    // ===================================
    const fetchMyCourses = async () => {
        myCoursesContainer.innerHTML = `<p class="text-center col-span-full text-gray-400">جاري تحميل كورساتك...</p>`;
        try {
            const response = await fetch('http://localhost:3000/api/my-courses', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                throw new Error('فشل في جلب الكورسات');
            }
            const courses = await response.json();

            myCoursesContainer.innerHTML = ''; 

            if (courses.length === 0) {
                myCoursesContainer.innerHTML = '<p class="text-center col-span-full text-gray-400">أنت لم تلتحق بأي كورس بعد.</p>';
                return;
            }

            courses.forEach(course => {
                const courseCard = `
                    <div class="bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                        <div class="p-6">
                            <h2 class="text-2xl font-bold text-white mb-2">${course.title}</h2>
                            <p class="text-gray-400 mb-4 h-20 overflow-hidden">${course.description || 'لا يوجد وصف متاح.'}</p>
                            <div class="text-sm text-gray-500 mb-4">
                                <span>المحاضر:</span>
                                <span class="font-semibold text-primary">${course.instructor_name}</span>
                            </div>
                            <a href="../courses/details.html?id=${course.id}" class="block w-full text-center bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                الذهاب إلى الكورس
                            </a>
                        </div>
                    </div>
                `;
                myCoursesContainer.innerHTML += courseCard;
            });

        } catch (error) {
            myCoursesContainer.innerHTML = `<p class="text-center col-span-full text-red-500">${error.message}</p>`;
        }
    };

    // ===================================
    // ==        5. تشغيل الصفحة        ==
    // ===================================
    setupNavbar();
    fetchMyCourses();
});
