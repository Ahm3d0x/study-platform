document.addEventListener('DOMContentLoaded', () => {
    // ... (تحديد العناصر الأساسية بدون تغيير)
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleLink = document.getElementById('toggle-link');
    const notificationContainer = document.getElementById('notification-container');

    // --- وظيفة إظهار الإشعارات (بدون تغيير) ---
    const showNotification = (message, type = 'success') => {
        // ... (الكود كما هو)
        const notification = document.createElement('div');
        let baseClasses = 'p-4 rounded-lg shadow-lg text-white text-sm animate-pulse';
        let colorClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `${baseClasses} ${colorClasses}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => { notification.remove(); }, 3000);
    };

    // --- وظيفة جديدة لتبديل رؤية كلمة المرور ---
    const setupPasswordToggle = (inputId, toggleId) => {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);

        toggleIcon.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                // (اختياري) تغيير الأيقونة إلى عين مشطوبة
                toggleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.127 2.454.364m-6.046 2.046a.75.75 0 00-1.06 1.06L9 12l-1.654 1.654a.75.75 0 001.06 1.06L12 13.06l1.654 1.654a.75.75 0 001.06-1.06L13.06 12l1.654-1.654a.75.75 0 00-1.06-1.06L12 10.94l-1.654-1.654z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 12c-.244-1.127-.69-2.2-1.28-3.197m-2.24-2.24A14.952 14.952 0 0012 5c-4.478 0-8.268 2.943-9.542 7 .384 1.25.9 2.424 1.51 3.518" /></svg>`;
            } else {
                passwordInput.type = 'password';
                // (اختياري) إرجاع الأيقونة الأصلية
                toggleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
            }
        });
    };

    // تطبيق الوظيفة على حقلي كلمة المرور
    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('register-password', 'toggle-register-password');


    // --- منطق التبديل بين الفورمين (بدون تغيير) ---
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
        if (registerForm.classList.contains('hidden')) {
            toggleLink.textContent = 'ليس لديك حساب؟ قم بإنشاء واحد';
        } else {
            toggleLink.textContent = ' لديك حساب بالفعل؟ قم بتسجيل الدخول';
        }
    });


    // --- منطق فورم تسجيل الدخول (بدون تغيير) ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error-toast'); // Using the correct ID if you have it

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'فشل تسجيل الدخول');
            }
            
            // عند النجاح، قم بتخزين التوكن وإعادة التوجيه
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            // توجيه المستخدم إلى لوحة التحكم الصحيحة بناءً على دوره
            if (data.user.role === 'instructor') {
                window.location.href = 'dashboard/dashboard.html'; // المسار الصحيح للوحة التحكم
            } else {
                // يمكنك إضافة رابط لصفحة الطالب هنا لاحقًا
                window.location.href = 'courses/courses.html'; 
            }

        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // --- منطق فورم إنشاء الحساب (مُحدّث للتحقق من تطابق كلمة المرور) ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const full_name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value; // <-- الحصول على قيمة التأكيد
        const role = document.getElementById('register-role').value;

        // التحقق من تطابق كلمتي المرور
        if (password !== confirmPassword) {
            showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return; // إيقاف التنفيذ
        }

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name, email, password, role })
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message); }

            showNotification('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.', 'success');
            toggleLink.click();
            registerForm.reset();

        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
});