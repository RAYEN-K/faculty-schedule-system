import { PrismaClient, Role, RequestType, RequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بداية عملية تعبئة البيانات (Seeding)...');

  // 1. تنظيف البيانات القديمة
  try {
    await prisma.modificationRequest.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
  } catch (e) {
    console.log('⚠️ الجداول فارغة بالفعل أو لم يتم مسح بعض البيانات.');
  }

  // 2. تشفير كلمة السر الموحدة للتجربة ("password123")
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. إنشاء الأقسام (Departments)
  const deptCS = await prisma.department.create({
    data: {
      name: 'Informatique',
      code: 'INFO',
    },
  });

  const deptEE = await prisma.department.create({
    data: {
      name: 'Génie Électrique',
      code: 'EE',
    },
  });

  console.log('✅ تم إنشاء الأقسام.');

  // 4. إنشاء المستخدمين (Users)
  const admin = await prisma.user.create({
    data: {
      fullName: 'مدير النظام (Admin)',
      email: 'admin@faculty.tn',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const hodCS = await prisma.user.create({
    data: {
      fullName: 'د. رئيس قسم المعلوماتية',
      email: 'hod.info@faculty.tn',
      password: hashedPassword,
      role: Role.HOD,
      departmentId: deptCS.id,
    },
  });

  // 🟢 تم التغيير إلى Role.FACULTY
  const teacher1 = await prisma.user.create({
    data: {
      fullName: 'أحمد بن صالح (أستاذ)',
      email: 'ahmed@faculty.tn',
      password: hashedPassword,
      role: Role.FACULTY,
      departmentId: deptCS.id,
    },
  });

  // 🟢 تم التغيير إلى Role.FACULTY
  const teacher2 = await prisma.user.create({
    data: {
      fullName: 'سارة الطرابلسي (أستاذة)',
      email: 'sarra@faculty.tn',
      password: hashedPassword,
      role: Role.FACULTY,
      departmentId: deptEE.id,
    },
  });

  console.log('✅ تم إنشاء المستخدمين بالحسابات التالية:');
  console.log('   - Admin: admin@faculty.tn | password123');
  console.log('   - HOD: hod.info@faculty.tn | password123');
  console.log('   - Faculty 1: ahmed@faculty.tn | password123');
  console.log('   - Faculty 2: sarra@faculty.tn | password123');

  // 5. إنشاء جدول حصص للأساتذة (Schedules)
  await prisma.schedule.createMany({
    data: [
      {
        userId: teacher1.id,
        dayOfWeek: 1, // الإثنين
        startTime: '08:30',
        endTime: '10:00',
      },
      {
        userId: teacher1.id,
        dayOfWeek: 3, // الأربعاء
        startTime: '10:15',
        endTime: '11:45',
      },
      {
        userId: teacher2.id,
        dayOfWeek: 2, // الثلاثاء
        startTime: '14:00',
        endTime: '15:30',
      },
    ],
  });

  console.log('✅ تم إضافة جدول الحصص التجريبي.');

  // 6. إنشاء طلب تعديل تجريبي (Modification Request)
  await prisma.modificationRequest.create({
    data: {
      userId: teacher1.id,
      type: RequestType.ADDITIONAL,
      status: RequestStatus.PENDING,
      proposedDate: new Date('2026-08-10T09:00:00Z'),
      reason: 'حصة تعويضية لمادة البرمجة',
    },
  });

  console.log('✅ تم إضافة طلبات التعديل التجريبية.');
  console.log('🎉 اكتملت عملية الـ Seeding بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ أثناء تنفيذ السكريبت:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });