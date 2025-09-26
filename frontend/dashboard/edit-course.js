document.addEventListener('DOMContentLoaded', () => {
    // 1. التحقق وتحديد المتغيرات
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!authToken || !userData || userData.role !== 'instructor') {
        window.location.href = '../index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    if (!courseId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. تحديد عناصر الصفحة
    const editCourseForm = document.getElementById('edit-course-form');
    const courseTitleInput = document.getElementById('course-title');
    const courseDescriptionInput = document.getElementById('course-description');
    const notificationContainer = document.getElementById('notification-container');

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `p-4 rounded-lg shadow-lg text-white text-sm animate-pulse ${colorClasses}`;
        notification.textContent = message;
        if(notificationContainer) notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // 3. جلب البيانات الحالية وملء الفورم
    const fetchCourseData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}`);
            if (!response.ok) throw new Error('لا يمكن العثور على الكورس');
            const course = await response.json();
            
            courseTitleInput.value = course.title;
            courseDescriptionInput.value = course.description;
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // 4. منطق إرسال الفورم
    editCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = courseTitleInput.value;
        const description = courseDescriptionInput.value;

        try {
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, description })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            showNotification('تم تحديث الكورس بنجاح!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // 5. تشغيل الصفحة
    fetchCourseData();
});

