// server.js

// 1. استدعاء المكتبات
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 2. إعداد السيرفر
const app = express();
const PORT = 3000; // هنشغل السيرفر على بورت 3000

app.use(express.json());
app.use(cors());

// 4. إعداد الاتصال بقاعدة البيانات
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // غالبًا بيكون root في XAMPP
  password: '',   // الباسورد بيكون فاضي في XAMPP لو مش غيرته
  database: 'learning_platform'
});

// 5. محاولة الاتصال بقاعدة البيانات
db.connect((err) => {
  if (err) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err);
    return;
  }
  console.log('تم الاتصال بقاعدة البيانات بنجاح! ✅');
});

// 6. تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});



// --- API Endpoints ---

// API Endpoint لتسجيل مستخدم جديد
app.post('/api/register', async (req, res) => {
  // 1. استلام البيانات من الطلب القادم (Request)
  const { full_name, email, password, role } = req.body;

  // 2. التحقق من أن كل البيانات المطلوبة موجودة
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: 'الرجاء إدخال جميع الحقول المطلوبة' });
  }

  try {
    // 3. تشفير كلمة المرور قبل تخزينها
    const hashedPassword = await bcrypt.hash(password, 10); // 10 هي درجة قوة التشفير

    // 4. تجهيز بيانات المستخدم لإضافتها لقاعدة البيانات
    const newUser = {
      full_name,
      email,
      password: hashedPassword,
      role,
    };

    // 5. كتابة أمر الـ SQL لإضافة المستخدم
    const sql = 'INSERT INTO users SET ?';

    // 6. تنفيذ الأمر على قاعدة البيانات
    db.query(sql, newUser, (err, result) => {
      if (err) {
        // التعامل مع خطأ تكرار الإيميل
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'هذا الإيميل مسجل بالفعل' });
        }
        // التعامل مع أي أخطاء أخرى
        console.error('خطأ في قاعدة البيانات:', err);
        return res.status(500).json({ message: 'حدث خطأ ما، يرجى المحاولة مرة أخرى' });
      }

      // 7. إرسال رسالة نجاح
      return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح!' });
    });
  } catch (error) {
    console.error('خطأ في التشفير:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء معالجة طلبك' });
  }
});


app.post('/api/login', (req, res) => {
    // 1. استلام الإيميل وكلمة المرور من الطلب
    const { email, password } = req.body;
  
    // 2. التحقق من وجود البيانات
    if (!email || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال الإيميل وكلمة المرور' });
    }
  
    // 3. البحث عن المستخدم في قاعدة البيانات عن طريق الإيميل
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error('خطأ في قاعدة البيانات:', err);
        return res.status(500).json({ message: 'حدث خطأ ما' });
      }
  
      // 4. إذا لم يتم العثور على المستخدم
      if (results.length === 0) {
        return res.status(401).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
      }
  
      const user = results[0];
  
      // 5. مقارنة كلمة المرور المدخلة بالكلمة المشفرة في قاعدة البيانات
      const isPasswordMatch = await bcrypt.compare(password, user.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
      }
  
      // 6. إذا كانت كلمة المرور صحيحة، قم بإنشاء توكن (JWT)
      const token = jwt.sign(
        { id: user.id, role: user.role }, // البيانات التي ستخزنها في التوكن
        'Ahmed-pass-321', // كلمة سر خاصة بالتوكن (غيّرها لأي شيء صعب)
        { expiresIn: '1h' } // مدة صلاحية التوكن (ساعة واحدة)
      );
  
      // 7. إرسال التوكن للمستخدم
      res.status(200).json({
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      });
    });
  });

  // =============================================
// Middleware للتحقق من التوكن (حارس الأمن)
// =============================================
const authenticateToken = (req, res, next) => {
    // 1. استخلاص التوكن من هيدر الطلب
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
    // 2. إذا لم يكن هناك توكن، أرجع خطأ
    if (token == null) {
      return res.sendStatus(401); // Unauthorized
    }
  
    // 3. التحقق من صحة التوكن
    jwt.verify(token, 'Ahmed-pass-321', (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden (Token is not valid)
      }
      // 4. إذا كان التوكن صحيحًا، احفظ بيانات المستخدم في الطلب
      req.user = user;
      next(); // اسمح للطلب بالمرور إلى الوظيفة التالية
    });
  };
  
  // 3. المسار المحمي الجديد (ضعه هنا)
  app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({
      message: "أهلاً بك في صفحتك الشخصية",
      user: req.user
    });
  });
  
  // Middleware للتحقق من أن المستخدم هو محاضر
const isInstructor = (req, res, next) => {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'ممنوع الوصول. هذه الوظيفة للمحاضرين فقط.' });
    }
    next();
  };
   // API Endpoint لإنشاء كورس جديد (محمي للمحاضرين فقط)
app.post('/api/courses', authenticateToken, isInstructor, (req, res) => {
    // 1. استلام بيانات الكورس من الطلب
    const { title, description } = req.body;
  
    // 2. التحقق من وجود العنوان
    if (!title) {
      return res.status(400).json({ message: 'عنوان الكورس مطلوب' });
    }
  
    // 3. استخلاص id المحاضر من التوكن (الذي وضعه authenticateToken)
    const instructor_id = req.user.id;
  
    // 4. تجهيز بيانات الكورس
    const newCourse = {
      title,
      description,
      instructor_id
    };
  
    // 5. إضافة الكورس إلى قاعدة البيانات
    const sql = 'INSERT INTO courses SET ?';
    db.query(sql, newCourse, (err, result) => {
      if (err) {
        console.error('خطأ في قاعدة البيانات:', err);
        return res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الكورس' });
      }
      res.status(201).json({ message: 'تم إنشاء الكورس بنجاح!', courseId: result.insertId });
    });
  });


  // API Endpoint لإضافة درس جديد إلى كورس (محمي لمالك الكورس فقط)
app.post('/api/courses/:courseId/lessons', authenticateToken, isInstructor, (req, res) => {
    const { courseId } = req.params; // الحصول على ID الكورس من الرابط
    const { title, video_url, lesson_order } = req.body;
    const instructorId = req.user.id; // الحصول على ID المحاضر من التوكن
  
    // التحقق من وجود البيانات الأساسية للدرس
    if (!title || !video_url || !lesson_order) {
      return res.status(400).json({ message: 'عنوان الدرس، رابط الفيديو، وترتيب الدرس حقول مطلوبة' });
    }
  
    // أولاً: نتأكد أن هذا المحاضر هو مالك الكورس
    const checkOwnershipSql = 'SELECT instructor_id FROM courses WHERE id = ?';
    db.query(checkOwnershipSql, [courseId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'الكورس غير موجود' });
      }
      if (results[0].instructor_id !== instructorId) {
        return res.status(403).json({ message: 'ممنوع الوصول. أنت لست مالك هذا الكورس.' });
      }
  
      // إذا تم التحقق من الملكية بنجاح، نقوم بإضافة الدرس
      const newLesson = {
        title,
        video_url,
        lesson_order,
        course_id: courseId
      };
  
      const addLessonSql = 'INSERT INTO lessons SET ?';
      db.query(addLessonSql, newLesson, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'حدث خطأ أثناء إضافة الدرس' });
        }
        res.status(201).json({ message: 'تم إضافة الدرس بنجاح!', lessonId: result.insertId });
      });
    });
  });

  // API Endpoint لجلب جميع الكورسات (عام)
app.get('/api/courses', (req, res) => {
  // نريد جلب بعض بيانات المحاضر مع الكورس ليكون العرض أفضل
  const sql = `
    SELECT 
      c.id, 
      c.title, 
      c.description, 
      u.full_name AS instructor_name 
    FROM courses c 
    JOIN users u ON c.instructor_id = u.id
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('خطأ في جلب الكورسات:', err);
      return res.status(500).json({ message: 'حدث خطأ ما' });
    }
    res.status(200).json(results);
  });
});

// API Endpoint لجلب تفاصيل كورس واحد مع دروسه (عام)
app.get('/api/courses/:id', (req, res) => {
    const courseId = req.params.id;
    let courseData;
  
    // الخطوة 1: جلب بيانات الكورس الأساسية وبيانات المحاضر
    const courseSql = `
      SELECT 
        c.id, c.title, c.description, u.full_name AS instructor_name 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id 
      WHERE c.id = ?
    `;
  
    db.query(courseSql, [courseId], (err, courseResult) => {
      if (err) {
        return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
      }
      if (courseResult.length === 0) {
        return res.status(404).json({ message: 'الكورس غير موجود' });
      }
      courseData = courseResult[0];
  
      // الخطوة 2: جلب قائمة الدروس المرتبطة بالكورس
      const lessonsSql = 'SELECT id, title, video_url, lesson_order FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC';
      db.query(lessonsSql, [courseId], (err, lessonsResult) => {
        if (err) {
          return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
        }
        
        // الخطوة 3: دمج النتائج وإرسالها
        courseData.lessons = lessonsResult;
        res.status(200).json(courseData);
      });
    });
  });

  // Middleware للتحقق من أن المستخدم هو طالب
const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'ممنوع الوصول. هذه الوظيفة للطلاب فقط.' });
    }
    next();
  };

  // API Endpoint لالتحاق طالب بكورس (محمي للطلاب فقط)
app.post('/api/courses/:courseId/enroll', authenticateToken, isStudent, (req, res) => {
    const courseId = req.params.courseId;
    const studentId = req.user.id; // ID الطالب من التوكن
  
    const enrollmentData = {
      student_id: studentId,
      course_id: courseId
    };
  
    const sql = 'INSERT INTO enrollments SET ?';
    db.query(sql, enrollmentData, (err, result) => {
      if (err) {
        // التعامل مع خطأ الالتحاق بنفس الكورس مرتين
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'أنت ملتحق بهذا الكورس بالفعل' });
        }
        console.error('خطأ في قاعدة البيانات:', err);
        return res.status(500).json({ message: 'حدث خطأ أثناء عملية الالتحاق' });
      }
      res.status(201).json({ message: 'تم الالتحاق بالكورس بنجاح!' });
    });
  });


  // API Endpoint لجلب الكورسات التي التحق بها الطالب (محمي للطلاب)
app.get('/api/my-courses', authenticateToken, isStudent, (req, res) => {
    const studentId = req.user.id;
  
    const sql = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        u.full_name AS instructor_name 
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE e.student_id = ?
    `;
  
    db.query(sql, [studentId], (err, results) => {
      if (err) {
        console.error('خطأ في جلب كورسات الطالب:', err);
        return res.status(500).json({ message: 'حدث خطأ ما' });
      }
      res.status(200).json(results);
    });
  });