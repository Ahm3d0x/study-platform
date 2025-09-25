document.addEventListener('DOMContentLoaded', () => {
    // 1. تحديد العناصر والمتغيرات
    const createCourseForm = document.getElementById('create-course-form');
    const notificationContainer = document.getElementById('notification-container');
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));

    // 2. حماية الصفحة
    if (!authToken || !userData || userData.role !== 'instructor') {
        window.location.href = '../login/index.html';
        return;
    }

    // 3. وظيفة عرض الإشعارات
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `p-4 rounded-lg shadow-lg text-white text-sm animate-pulse ${colorClasses}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // (يمكن إضافة وظيفة setupNavbar هنا إذا كنت تريدها في هذه الصفحة)

    // 4. منطق إرسال الفورم
    createCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-description').value;

        try {
            const response = await fetch('http://localhost:3000/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, description })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل في إنشاء الكورس');
            }
            
            showNotification('تم إنشاء الكورس بنجاح! سيتم توجيهك الآن...', 'success');
            
            // الانتظار قليلاً قبل إعادة التوجيه ليرى المستخدم الإشعار
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
});

