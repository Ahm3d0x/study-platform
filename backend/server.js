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
// app.get('/api/courses/:id', (req, res) => {
//     const courseId = req.params.id;
//     let courseData;
  
//     // الخطوة 1: جلب بيانات الكورس الأساسية وبيانات المحاضر
//     const courseSql = `
//       SELECT 
//         c.id, c.title, c.description, u.full_name AS instructor_name 
//       FROM courses c 
//       JOIN users u ON c.instructor_id = u.id 
//       WHERE c.id = ?
//     `;
  
//     db.query(courseSql, [courseId], (err, courseResult) => {
//       if (err) {
//         return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
//       }
//       if (courseResult.length === 0) {
//         return res.status(404).json({ message: 'الكورس غير موجود' });
//       }
//       courseData = courseResult[0];
  
//       // الخطوة 2: جلب قائمة الدروس المرتبطة بالكورس
//       const lessonsSql = 'SELECT id, title, video_url, lesson_order FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC';
//       db.query(lessonsSql, [courseId], (err, lessonsResult) => {
//         if (err) {
//           return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
//         }
        
//         // الخطوة 3: دمج النتائج وإرسالها
//         courseData.lessons = lessonsResult;
//         res.status(200).json(courseData);
//       });
//     });
//   });

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



// API Endpoint لتحديث بيانات المستخدم (الاسم والإيميل)
app.put('/api/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { full_name, email, currentPassword } = req.body;

  // التحقق من وجود كلمة المرور الحالية للتأكيد
  if (!currentPassword) {
    return res.status(400).json({ message: 'كلمة المرور الحالية مطلوبة لتأكيد هويتك' });
  }

  // الخطوة 1: جلب بيانات المستخدم الحالية من قاعدة البيانات
  const getUserSql = 'SELECT * FROM users WHERE id = ?';
  db.query(getUserSql, [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: 'خطأ في العثور على المستخدم' });
    }
    
    const user = results[0];

    // الخطوة 2: التحقق من أن كلمة المرور الحالية صحيحة
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    // الخطوة 3: تحديث البيانات في قاعدة البيانات
    const updateUserSql = 'UPDATE users SET full_name = ?, email = ? WHERE id = ?';
    // نستخدم البيانات الجديدة إذا تم توفيرها، وإلا نستخدم القديمة
    const newFullName = full_name || user.full_name;
    const newEmail = email || user.email;

    db.query(updateUserSql, [newFullName, newEmail, userId], (err, result) => {
      if (err) {
        // التعامل مع خطأ تكرار الإيميل إذا حاول المستخدم التغيير لإيميل موجود
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'هذا الإيميل مستخدم بالفعل' });
        }
        return res.status(500).json({ message: 'خطأ أثناء تحديث البيانات' });
      }
      res.status(200).json({ message: 'تم تحديث بياناتك بنجاح' });
    });
  });
});


// API Endpoint لتغيير كلمة مرور المستخدم
app.put('/api/profile/password', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // التحقق من تطابق كلمة المرور الجديدة وتأكيدها
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
  }

  // الخطوة 1: جلب بيانات المستخدم
  const getUserSql = 'SELECT password FROM users WHERE id = ?';
  db.query(getUserSql, [userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: 'خطأ في العثور على المستخدم' });
    }

    // الخطوة 2: التحقق من كلمة المرور الحالية
    const isPasswordMatch = await bcrypt.compare(currentPassword, results[0].password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    // الخطوة 3: تشفير كلمة المرور الجديدة وتحديثها
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updatePasswordSql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(updatePasswordSql, [hashedNewPassword, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'خطأ أثناء تغيير كلمة المرور' });
      }
      res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });
    });
  });
});

// API Endpoint لتعديل بيانات كورس (محمي لمالك الكورس فقط)
app.put('/api/courses/:id', authenticateToken, isInstructor, (req, res) => {
  const courseId = req.params.id;
  const instructorId = req.user.id;
  const { title, description } = req.body;

  // الخطوة 1: التحقق من أن المحاضر هو مالك الكورس
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

    // الخطوة 2: إذا تم التحقق من الملكية، قم بتحديث بيانات الكورس
    const updateCourseSql = 'UPDATE courses SET title = ?, description = ? WHERE id = ?';
    db.query(updateCourseSql, [title, description, courseId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء تحديث الكورس' });
      }
      res.status(200).json({ message: 'تم تحديث الكورس بنجاح!' });
    });
  });
});

// API Endpoint لحذف كورس (محمي لمالك الكورس فقط)
app.delete('/api/courses/:id', authenticateToken, isInstructor, (req, res) => {
  const courseId = req.params.id;
  const instructorId = req.user.id;

  // الخطوة 1: التحقق من أن المحاضر هو مالك الكورس
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

    // الخطوة 2: إذا تم التحقق من الملكية، قم بحذف الكورس
    const deleteCourseSql = 'DELETE FROM courses WHERE id = ?';
    db.query(deleteCourseSql, [courseId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء حذف الكورس' });
      }
      res.status(200).json({ message: 'تم حذف الكورس بنجاح!' });
    });
  });
});

// API Endpoint لتعديل بيانات درس (محمي لمالك الكورس فقط)
app.put('/api/lessons/:id', authenticateToken, isInstructor, (req, res) => {
  const lessonId = req.params.id;
  const instructorId = req.user.id;
  const { title, video_url, lesson_order } = req.body;

  // الخطوة 1: التحقق من أن المحاضر يملك الكورس الذي ينتمي إليه هذا الدرس
  const checkOwnershipSql = `
    SELECT c.instructor_id 
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = ?
  `;
  db.query(checkOwnershipSql, [lessonId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'الدرس غير موجود' });
    }
    if (results[0].instructor_id !== instructorId) {
      return res.status(403).json({ message: 'ممنوع الوصول. أنت لا تملك الكورس الخاص بهذا الدرس.' });
    }

    // الخطوة 2: إذا تم التحقق من الملكية، قم بتحديث بيانات الدرس
    const updateLessonSql = 'UPDATE lessons SET title = ?, video_url = ?, lesson_order = ? WHERE id = ?';
    db.query(updateLessonSql, [title, video_url, lesson_order, lessonId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء تحديث الدرس' });
      }
      res.status(200).json({ message: 'تم تحديث الدرس بنجاح!' });
    });
  });
});


// API Endpoint لحذف درس (محمي لمالك الكورس فقط)
app.delete('/api/lessons/:id', authenticateToken, isInstructor, (req, res) => {
  const lessonId = req.params.id;
  const instructorId = req.user.id;

  // الخطوة 1: التحقق من أن المحاضر يملك الكورس الذي ينتمي إليه هذا الدرس
  const checkOwnershipSql = `
    SELECT c.instructor_id 
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = ?
  `;
  db.query(checkOwnershipSql, [lessonId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'الدرس غير موجود' });
    }
    if (results[0].instructor_id !== instructorId) {
      return res.status(403).json({ message: 'ممنوع الوصول. أنت لا تملك الكورس الخاص بهذا الدرس.' });
    }

    // الخطوة 2: إذا تم التحقق من الملكية، قم بحذف الدرس
    const deleteLessonSql = 'DELETE FROM lessons WHERE id = ?';
    db.query(deleteLessonSql, [lessonId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء حذف الدرس' });
      }
      res.status(200).json({ message: 'تم حذف الدرس بنجاح!' });
    });
  });
});

// API Endpoint لعرض الطلاب الملتحقين بكورس (محمي لمالك الكورس)
app.get('/api/courses/:id/students', authenticateToken, isInstructor, (req, res) => {
  const courseId = req.params.id;
  const instructorId = req.user.id;

  // الخطوة 1: التحقق من أن المحاضر هو مالك الكورس
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

    // الخطوة 2: جلب قائمة الطلاب الملتحقين بهذا الكورس
    const getStudentsSql = `
      SELECT u.id, u.full_name, u.email 
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.course_id = ?
    `;

    db.query(getStudentsSql, [courseId], (err, students) => {
      if (err) {
        return res.status(500).json({ message: 'خطأ أثناء جلب الطلاب' });
      }
      res.status(200).json(students);
    });
  });
});

  
  // =================================================================
  // ==   ENDPOINT جديد: جلب الكورسات الخاصة بالمحاضر المسجل دخوله   ==
  // =================================================================
  app.get('/api/instructor/courses', authenticateToken, isInstructor, (req, res) => {
    const instructorId = req.user.id;
  
    const sql = 'SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC';
    
    db.query(sql, [instructorId], (err, results) => {
      if (err) {
        console.error('Error fetching instructor courses:', err);
        return res.status(500).json({ message: 'حدث خطأ ما' });
      }
      res.status(200).json(results);
    });
  });
  
  const decodeTokenOptional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return next(); // إذا لم يوجد توكن، استمر بدون خطأ
    }
    jwt.verify(token, 'Ahmed-pass-321', (err, user) => {
        if (!err) {
            req.user = user; // إذا كان التوكن صحيحًا، أضف المستخدم للطلب
        }
        next();
    });
};
  app.get('/api/courses/:id', decodeTokenOptional, (req, res) => { // <-- استخدام الحارس الجديد
    const courseId = req.params.id;
    let courseData;

    // الخطوة 1: جلب بيانات الكورس (بدون تغيير)
    const courseSql = `SELECT c.id, c.title, c.description, u.full_name AS instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?`;
    db.query(courseSql, [courseId], (err, courseResult) => {
        if (err || courseResult.length === 0) {
            return res.status(404).json({ message: 'الكورس غير موجود' });
        }
        courseData = courseResult[0];

        // الخطوة 2: جلب الدروس (بدون تغيير)
        const lessonsSql = 'SELECT id, title, video_url, lesson_order FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC';
        db.query(lessonsSql, [courseId], (err, lessonsResult) => {
            if (err) { /* ... */ }
            courseData.lessons = lessonsResult;

            // ** الخطوة 3 (الجديدة): التحقق من حالة التحاق الطالب **
            courseData.isEnrolled = false; // القيمة الافتراضية
            if (req.user && req.user.role === 'student') {
                const enrollSql = 'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?';
                db.query(enrollSql, [req.user.id, courseId], (err, enrollResult) => {
                    if (enrollResult && enrollResult.length > 0) {
                        courseData.isEnrolled = true;
                    }
                    // إرسال الرد النهائي بعد التحقق
                    res.status(200).json(courseData);
                });
            } else {
                // إذا لم يكن هناك مستخدم مسجل، أرسل الرد مباشرة
                res.status(200).json(courseData);
            }
        });
    });
});


// --- API Endpoint لإضافة درس جديد (مُحدّث للتحقق من الترتيب) ---
app.post('/api/courses/:courseId/lessons', authenticateToken, isInstructor, (req, res) => {
  const { courseId } = req.params;
  const { title, video_url, lesson_order } = req.body;
  const instructorId = req.user.id;

  // ... (كود التحقق من الملكية كما هو)

  // ** الإضافة الجديدة: التحقق من عدم تكرار الترتيب **
  const checkOrderSql = 'SELECT id FROM lessons WHERE course_id = ? AND lesson_order = ?';
  db.query(checkOrderSql, [courseId, lesson_order], (err, results) => {
      if (err) return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
      if (results.length > 0) {
          return res.status(409).json({ message: 'هذا الترتيب مستخدم بالفعل في درس آخر بنفس الكورس.' });
      }

      // إذا كان الترتيب غير مكرر، أكمل عملية الإضافة
      const newLesson = { title, video_url, lesson_order, course_id: courseId };
      const addLessonSql = 'INSERT INTO lessons SET ?';
      db.query(addLessonSql, newLesson, (err, result) => {
          if (err) return res.status(500).json({ message: 'حدث خطأ أثناء إضافة الدرس' });
          res.status(201).json({ message: 'تم إضافة الدرس بنجاح!', lessonId: result.insertId });
      });
  });
});


// --- API Endpoint لتعديل بيانات درس (مُحدّث للتحقق من الترتيب) ---
app.put('/api/lessons/:id', authenticateToken, isInstructor, (req, res) => {
  const lessonId = req.params.id;
  const { title, video_url, lesson_order } = req.body;

  // ... (كود التحقق من الملكية كما هو)

  // ** الإضافة الجديدة: التحقق من عدم تكرار الترتيب عند التعديل **
  // (نتأكد أن الترتيب لا يستخدمه درس آخر غير الدرس الذي نعدله حاليًا)
  const checkOrderSql = 'SELECT id FROM lessons WHERE course_id = (SELECT course_id FROM lessons WHERE id = ?) AND lesson_order = ? AND id != ?';
  db.query(checkOrderSql, [lessonId, lesson_order, lessonId], (err, results) => {
      if (err) return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
      if (results.length > 0) {
          return res.status(409).json({ message: 'هذا الترتيب مستخدم بالفعل في درس آخر بنفس الكورس.' });
      }
      
      // إذا كان الترتيب سليمًا، أكمل عملية التحديث
      const updateLessonSql = 'UPDATE lessons SET title = ?, video_url = ?, lesson_order = ? WHERE id = ?';
      db.query(updateLessonSql, [title, video_url, lesson_order, lessonId], (err, result) => {
          if (err) return res.status(500).json({ message: 'حدث خطأ أثناء تحديث الدرس' });
          res.status(200).json({ message: 'تم تحديث الدرس بنجاح!' });
      });
  });
});