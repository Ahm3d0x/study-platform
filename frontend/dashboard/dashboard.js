document.addEventListener('DOMContentLoaded', () => {
    // 1. التحقق وتحديد المتغيرات
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!authToken || !userData || userData.role !== 'instructor') {
        window.location.href = '../login/index.html';
        return;
    }

    // 2. تحديد عناصر الصفحة
    const navLinksContainer = document.getElementById('nav-links');
    const coursesContainer = document.getElementById('courses-container');
    const notificationContainer = document.getElementById('notification-container');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let courseIdToDelete = null;

    // 3. الوظائف المساعدة
    const showNotification = (message, type = 'success') => {
        if (!notificationContainer) return;
        const notification = document.createElement('div');
        const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `p-4 rounded-lg shadow-lg text-white text-sm animate-pulse ${colorClasses}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    const setupNavbar = () => {
        if (!navLinksContainer) return;
        navLinksContainer.innerHTML = `
            <a href="../courses/courses.html" class="text-gray-300 hover:text-white">كل الكورسات</a>
            <span class="text-primary">أهلاً، ${userData.full_name}</span>
            <button id="logout-btn" class="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">تسجيل الخروج</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '../login/index.html';
        });
    };

    // 4. جلب وعرض كورسات المحاضر
    const fetchInstructorCourses = async () => {
        if (!coursesContainer) return;
        coursesContainer.innerHTML = '<p class="text-gray-400 col-span-full text-center">جاري تحميل كورساتك...</p>';
        try {
            const response = await fetch('http://localhost:3000/api/instructor/courses', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('فشل في جلب الكورسات');
            
            const courses = await response.json();
            coursesContainer.innerHTML = '';

            if (courses.length === 0) {
                coursesContainer.innerHTML = '<p class="text-gray-400 col-span-full text-center">لم تقم بإنشاء أي كورسات بعد.</p>';
                return;
            }

            courses.forEach(course => {
                const courseCard = `
                    <div class="bg-gray-800 rounded-2xl shadow-lg flex flex-col justify-between">
                        <div class="p-6">
                            <h2 class="text-xl font-bold text-white mb-2">${course.title}</h2>
                            <p class="text-gray-400 text-sm h-16 overflow-hidden">${course.description || ''}</p>
                        </div>
                        <div class="bg-gray-700 p-4 grid grid-cols-3 gap-2 text-center">
                            <button data-course-id="${course.id}" class="edit-course-btn text-sm text-primary hover:underline">تعديل</button>
                            <button data-course-id="${course.id}" class="manage-lessons-btn text-sm text-white hover:underline">الدروس</button>
                            <button data-course-id="${course.id}" class="delete-btn text-sm text-red-500 hover:underline">حذف</button>
                        </div>
                    </div>
                `;
                coursesContainer.innerHTML += courseCard;
            });
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };
    
    // 5. منطق نافذة تأكيد الحذف
    const showDeleteModal = (courseId) => {
        courseIdToDelete = courseId;
        if(deleteModal) deleteModal.classList.remove('hidden');
    };

    const hideDeleteModal = () => {
        courseIdToDelete = null;
        if(deleteModal) deleteModal.classList.add('hidden');
    };

    const handleDelete = async () => {
        if (!courseIdToDelete) return;
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            showNotification('تم حذف الكورس بنجاح!', 'success');
            fetchInstructorCourses();
        } catch (error) {
            showNotification(error.message || 'فشل حذف الكورس', 'error');
        } finally {
            hideDeleteModal();
        }
    };

    // 6. ربط الأحداث
    if (coursesContainer) {
        coursesContainer.addEventListener('click', (e) => {
            const target = e.target;
            const courseId = target.dataset.courseId;

            if (target.classList.contains('delete-btn')) {
                showDeleteModal(courseId);
            } else if (target.classList.contains('manage-lessons-btn')) {
                window.location.href = `manage-lessons.html?courseId=${courseId}`;
            } else if (target.classList.contains('edit-course-btn')) {
                window.location.href = `edit-course.html?courseId=${courseId}`;
            }
        });
    }
    
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDelete);

    // 7. تشغيل الصفحة
    setupNavbar();
    fetchInstructorCourses();
});

