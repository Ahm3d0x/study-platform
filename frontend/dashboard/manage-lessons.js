document.addEventListener('DOMContentLoaded', () => {
    // 1. التحقق وتحديد المتغيرات
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!authToken || !userData || userData.role !== 'instructor') {
        window.location.href = '../login/index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    if (!courseId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. تحديد عناصر الصفحة
    const courseTitleHeading = document.getElementById('course-title-heading');
    const lessonsList = document.getElementById('lessons-list');
    const notificationContainer = document.getElementById('notification-container');
    
    // عناصر نوافذ Modal
    const addLessonModal = document.getElementById('add-lesson-modal');
    const addLessonForm = document.getElementById('add-lesson-form');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const showAddModalBtn = document.getElementById('show-add-modal-btn');

    const editLessonModal = document.getElementById('edit-lesson-modal');
    const editLessonForm = document.getElementById('edit-lesson-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    const deleteLessonModal = document.getElementById('delete-lesson-modal');
    const confirmDeleteLessonBtn = document.getElementById('confirm-delete-lesson-btn');
    const cancelDeleteLessonBtn = document.getElementById('cancel-delete-lesson-btn');
    let lessonIdToDelete = null;
    
    // 3. الوظائف المساعدة
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `p-4 rounded-lg shadow-lg text-white text-sm animate-pulse ${colorClasses}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // 4. جلب وعرض بيانات الكورس والدروس
    const fetchCourseData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('فشل في جلب بيانات الكورس');
            const course = await response.json();
            
            courseTitleHeading.textContent = `إدارة دروس: "${course.title}"`;
            renderLessons(course.lessons);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const renderLessons = (lessons) => {
        lessonsList.innerHTML = '';
        if (!lessons || lessons.length === 0) {
            lessonsList.innerHTML = `<p class="text-gray-400">لا توجد دروس في هذا الكورس بعد.</p>`;
            return;
        }
        lessons.forEach(lesson => {
            const lessonItem = `
                <li class="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                    <div><span class="font-bold text-white">${lesson.lesson_order}. ${lesson.title}</span></div>
                    <div class="space-x-2 space-x-reverse">
                        <button data-lesson='${JSON.stringify(lesson)}' class="edit-lesson-btn text-sm text-primary hover:underline">تعديل</button>
                        <button data-lesson-id="${lesson.id}" class="delete-lesson-btn text-sm text-red-500 hover:underline">حذف</button>
                    </div>
                </li>
            `;
            lessonsList.innerHTML += lessonItem;
        });

        // ربط الأحداث بعد عرض الدروس
        lessonsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-lesson-btn')) {
                openDeleteModal(e.target.dataset.lessonId);
            }
            if (e.target.classList.contains('edit-lesson-btn')) {
                openEditModal(JSON.parse(e.target.dataset.lesson));
            }
        });
    };

    // 5. منطق إضافة درس جديد
    addLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('add-lesson-title').value;
        const video_url = document.getElementById('add-lesson-url').value;
        const lesson_order = document.getElementById('add-lesson-order').value;
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}/lessons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ title, video_url, lesson_order })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            showNotification('تمت إضافة الدرس بنجاح', 'success');
            addLessonForm.reset();
            closeModal(addLessonModal);
            fetchCourseData();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // 6. منطق نوافذ التعديل والحذف
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');

    const openEditModal = (lesson) => {
        document.getElementById('edit-lesson-id').value = lesson.id;
        document.getElementById('edit-lesson-title').value = lesson.title;
        document.getElementById('edit-lesson-url').value = lesson.video_url;
        document.getElementById('edit-lesson-order').value = lesson.lesson_order;
        openModal(editLessonModal);
    };
    const closeEditModal = () => closeModal(editLessonModal);

    const openDeleteModal = (lessonId) => {
        lessonIdToDelete = lessonId;
        openModal(deleteLessonModal);
    };
    const closeDeleteModal = () => {
        lessonIdToDelete = null;
        closeModal(deleteLessonModal);
    };

    editLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lessonId = document.getElementById('edit-lesson-id').value;
        const title = document.getElementById('edit-lesson-title').value;
        const video_url = document.getElementById('edit-lesson-url').value;
        const lesson_order = document.getElementById('edit-lesson-order').value;
        try {
            const response = await fetch(`http://localhost:3000/api/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ title, video_url, lesson_order })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            showNotification('تم تعديل الدرس بنجاح', 'success');
            closeEditModal();
            fetchCourseData();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
    
    const handleDeleteLesson = async () => {
        if (!lessonIdToDelete) return;
        try {
            const response = await fetch(`http://localhost:3000/api/lessons/${lessonIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            showNotification('تم حذف الدرس بنجاح', 'success');
            fetchCourseData();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            closeDeleteModal();
        }
    };
    
    // 7. ربط الأحداث
    showAddModalBtn.addEventListener('click', () => openModal(addLessonModal));
    cancelAddBtn.addEventListener('click', () => closeModal(addLessonModal));
    cancelEditBtn.addEventListener('click', closeEditModal);
    confirmDeleteLessonBtn.addEventListener('click', handleDeleteLesson);
    cancelDeleteLessonBtn.addEventListener('click', closeDeleteModal);

    // 8. تشغيل الصفحة
    fetchCourseData();
});

