import { PrismaClient, Role, RequestType, RequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ----------------------------------------
// Static data — IIT Sfax (International Institute of Technology, Sfax)
// ----------------------------------------

const DEPARTMENTS = [
  { code: 'CS', name: 'Computer Science' },
  { code: 'EE', name: 'Electrical Engineering' },
  { code: 'IE', name: 'Industrial Engineering' },
  { code: 'TEL', name: 'Telecommunications Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
] as const;

const SUBJECTS_BY_DEPT: Record<string, string[]> = {
  CS: ['Data Structures & Algorithms', 'Database Systems', 'Web Development', 'Operating Systems', 'Software Engineering', 'Artificial Intelligence'],
  EE: ['Circuit Analysis', 'Power Systems', 'Control Systems', 'Digital Electronics', 'Signal Processing'],
  IE: ['Production Planning', 'Quality Management', 'Supply Chain Management', 'Industrial Automation', 'Ergonomics'],
  TEL: ['Wireless Networks', 'Telecom Protocols', 'Fiber Optics', 'Mobile Communications', 'Network Security'],
  ME: ['Thermodynamics', 'Fluid Mechanics', 'CAD/CAM', 'Mechanics of Materials', 'Manufacturing Processes'],
};

const TIME_SLOTS = [
  { startTime: '08:30', endTime: '10:00' },
  { startTime: '10:15', endTime: '11:45' },
  { startTime: '13:00', endTime: '14:30' },
  { startTime: '14:45', endTime: '16:15' },
];

const HODS = [
  { code: 'CS', fullName: 'Dr. Sami Bouazizi', email: 'sami.bouazizi@iitsfax.tn' },
  { code: 'EE', fullName: 'Dr. Emna Khelifi', email: 'emna.khelifi@iitsfax.tn' },
  { code: 'IE', fullName: 'Dr. Walid Trabelsi', email: 'walid.trabelsi@iitsfax.tn' },
  { code: 'TEL', fullName: 'Dr. Rania Ferjani', email: 'rania.ferjani@iitsfax.tn' },
  { code: 'ME', fullName: 'Dr. Hedi Mejri', email: 'hedi.mejri@iitsfax.tn' },
];

const FACULTY = [
  // Computer Science
  { code: 'CS', fullName: 'Ahmed Ben Salah', email: 'ahmed.bensalah@iitsfax.tn' },
  { code: 'CS', fullName: 'Yassine Gharbi', email: 'yassine.gharbi@iitsfax.tn' },
  { code: 'CS', fullName: 'Mouna Sassi', email: 'mouna.sassi@iitsfax.tn' },
  // Electrical Engineering
  { code: 'EE', fullName: 'Sarra Trabelsi', email: 'sarra.trabelsi@iitsfax.tn' },
  { code: 'EE', fullName: 'Karim Jaziri', email: 'karim.jaziri@iitsfax.tn' },
  { code: 'EE', fullName: 'Ines Hammami', email: 'ines.hammami@iitsfax.tn' },
  // Industrial Engineering
  { code: 'IE', fullName: 'Firas Ouali', email: 'firas.ouali@iitsfax.tn' },
  { code: 'IE', fullName: 'Rim Belhadj', email: 'rim.belhadj@iitsfax.tn' },
  { code: 'IE', fullName: 'Omar Zaidi', email: 'omar.zaidi@iitsfax.tn' },
  // Telecommunications
  { code: 'TEL', fullName: 'Nour Chaabane', email: 'nour.chaabane@iitsfax.tn' },
  { code: 'TEL', fullName: 'Aymen Riahi', email: 'aymen.riahi@iitsfax.tn' },
  { code: 'TEL', fullName: 'Syrine Ayadi', email: 'syrine.ayadi@iitsfax.tn' },
  // Mechanical Engineering
  { code: 'ME', fullName: 'Bilel Mahjoub', email: 'bilel.mahjoub@iitsfax.tn' },
  { code: 'ME', fullName: 'Asma Guesmi', email: 'asma.guesmi@iitsfax.tn' },
  { code: 'ME', fullName: 'Wassim Kallel', email: 'wassim.kallel@iitsfax.tn' },
];

const EVENTS = [
  { code: 'CS', title: 'AI & Machine Learning Workshop', description: 'Hands-on workshop on applied ML for final-year students', daysFromNow: 12 },
  { code: 'CS', title: 'Coding Bootcamp Kickoff', description: 'Two-week intensive bootcamp for the software engineering track', daysFromNow: 25 },
  { code: 'EE', title: 'Smart Grid Seminar', description: 'Guest lecture on renewable energy integration', daysFromNow: 8 },
  { code: 'IE', title: 'Industrial Visit — STEG Plant', description: 'Field visit for third-year Industrial Engineering students', daysFromNow: 18 },
  { code: 'TEL', title: '5G Networks Conference', description: 'Departmental conference on next-generation telecom infrastructure', daysFromNow: 30 },
  { code: 'ME', title: 'CAD/CAM Lab Certification', description: 'Certification exam for the CAD/CAM practical module', daysFromNow: 15 },
  { code: 'CS', title: 'Faculty Orientation Day', description: 'Welcome session for newly joined academic staff', daysFromNow: 3 },
  { code: 'EE', title: 'Departmental Council Meeting', description: 'Monthly review of course progress and scheduling', daysFromNow: 6 },
];

function daysFromNowUTC(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Starting the seeding process for IIT Sfax...');

  // 1. Clean up old data — order matters (respect foreign key dependencies)
  try {
    await prisma.scheduleException.deleteMany();
    await prisma.modificationRequest.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
  } catch (e) {
    console.log('⚠️ Tables were already empty, or some data could not be cleared.');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Departments
  const departmentByCode: Record<string, { id: string; name: string; code: string }> = {};
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.create({ data: dept });
    departmentByCode[dept.code] = created;
  }
  console.log(`✅ ${DEPARTMENTS.length} departments created (IIT Sfax).`);

  // 3. Admin
  await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@iitsfax.tn',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // 4. Heads of Department
  const hodByCode: Record<string, { id: string; email: string; fullName: string }> = {};
  for (const hod of HODS) {
    const created = await prisma.user.create({
      data: {
        fullName: hod.fullName,
        email: hod.email,
        password: hashedPassword,
        role: Role.HOD,
        departmentId: departmentByCode[hod.code].id,
      },
    });
    hodByCode[hod.code] = created;
  }
  console.log(`✅ ${HODS.length} Heads of Department created.`);

  // 5. Faculty members
  const facultyByEmail: Record<string, { id: string; email: string; fullName: string; code: string }> = {};
  for (const f of FACULTY) {
    const created = await prisma.user.create({
      data: {
        fullName: f.fullName,
        email: f.email,
        password: hashedPassword,
        role: Role.FACULTY,
        departmentId: departmentByCode[f.code].id,
      },
    });
    facultyByEmail[f.email] = { ...created, code: f.code };
  }
  console.log(`✅ ${FACULTY.length} faculty members created.`);

  // 6. Weekly recurring schedules — each faculty member gets 3 slots across
  //    the week, using real subjects from their department's catalog.
  const schedulesByFacultyEmail: Record<
    string,
    { id: string; dayOfWeek: number; startTime: string; endTime: string; subject: string | null }[]
  > = {};

  let dayCursor = 1;
  for (const f of FACULTY) {
    const subjects = SUBJECTS_BY_DEPT[f.code];
    const facultyUser = facultyByEmail[f.email];
    const slotsForThisTeacher: (typeof schedulesByFacultyEmail)[string] = [];

    for (let i = 0; i < 3; i++) {
      const day = ((dayCursor - 1) % 5) + 1; // cycle through Mon–Fri
      const timeSlot = TIME_SLOTS[(dayCursor + i) % TIME_SLOTS.length];
      const subject = subjects[(dayCursor + i) % subjects.length];

      const created = await prisma.schedule.create({
        data: {
          userId: facultyUser.id,
          dayOfWeek: day,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subject,
        },
      });
      slotsForThisTeacher.push(created);
      dayCursor++;
    }
    schedulesByFacultyEmail[f.email] = slotsForThisTeacher;
  }
  console.log(`✅ ${FACULTY.length * 3} weekly schedule slots created (3 per faculty member).`);

  // 7. Modification requests — a realistic mix of types and statuses,
  //    spread across departments, so every dashboard has something to show.
  type RequestSeed = {
    facultyEmail: string;
    type: RequestType;
    status: RequestStatus;
    reason: string;
    proposedInDays: number;
    useOwnSchedule?: boolean; // if true, picks one of this faculty member's real slots for MODIFICATION
    reviewedByHodCode?: string;
    reviewedDaysAgo?: number;
  };

  const REQUEST_SEEDS: RequestSeed[] = [
    // --- Computer Science ---
    { facultyEmail: 'ahmed.bensalah@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Conflict with a PhD committee meeting', proposedInDays: 4, useOwnSchedule: true },
    { facultyEmail: 'yassine.gharbi@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.PENDING, reason: 'Extra revision session before the midterm exam', proposedInDays: 6 },
    { facultyEmail: 'mouna.sassi@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.PENDING, reason: 'Attending an international conference next week, compensating with an extra session', proposedInDays: 9 },
    { facultyEmail: 'ahmed.bensalah@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.APPROVED, reason: 'Makeup session for the cancelled Data Structures lecture', proposedInDays: -5, reviewedByHodCode: 'CS', reviewedDaysAgo: 6 },
    { facultyEmail: 'yassine.gharbi@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.REJECTED, reason: 'Requested compensation week overlaps with final exams', proposedInDays: -3, reviewedByHodCode: 'CS', reviewedDaysAgo: 4 },

    // --- Electrical Engineering ---
    { facultyEmail: 'sarra.trabelsi@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Lab equipment maintenance scheduled on the usual session day', proposedInDays: 5, useOwnSchedule: true },
    { facultyEmail: 'karim.jaziri@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.APPROVED, reason: 'Extra lab hours to finish the Power Systems project', proposedInDays: -2, reviewedByHodCode: 'EE', reviewedDaysAgo: 3 },
    { facultyEmail: 'ines.hammami@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.PENDING, reason: 'Medical appointment conflicting with Thursday session', proposedInDays: 10 },

    // --- Industrial Engineering ---
    { facultyEmail: 'firas.ouali@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.APPROVED, reason: 'Swapping session to accompany students on the industrial visit', proposedInDays: -7, useOwnSchedule: true, reviewedByHodCode: 'IE', reviewedDaysAgo: 8 },
    { facultyEmail: 'rim.belhadj@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.PENDING, reason: 'Additional workshop on Lean Manufacturing techniques', proposedInDays: 14 },
    { facultyEmail: 'omar.zaidi@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Requesting to move session due to a supplier meeting', proposedInDays: 8, useOwnSchedule: true },

    // --- Telecommunications ---
    { facultyEmail: 'nour.chaabane@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.APPROVED, reason: 'Compensating for the missed session during the 5G conference', proposedInDays: -4, reviewedByHodCode: 'TEL', reviewedDaysAgo: 5 },
    { facultyEmail: 'aymen.riahi@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Requesting to move the session due to a departmental jury', proposedInDays: 7, useOwnSchedule: true },
    { facultyEmail: 'syrine.ayadi@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.REJECTED, reason: 'Requested additional day conflicts with lab availability', proposedInDays: -6, reviewedByHodCode: 'TEL', reviewedDaysAgo: 7 },

    // --- Mechanical Engineering ---
    { facultyEmail: 'bilel.mahjoub@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Swapping day to attend a manufacturing equipment training', proposedInDays: 3, useOwnSchedule: true },
    { facultyEmail: 'asma.guesmi@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.APPROVED, reason: 'Extra CAD/CAM lab session for exam preparation', proposedInDays: -1, reviewedByHodCode: 'ME', reviewedDaysAgo: 2 },
    { facultyEmail: 'wassim.kallel@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.PENDING, reason: 'Compensation arrangement for an upcoming professional certification exam', proposedInDays: 11 },
  ];

  for (const seed of REQUEST_SEEDS) {
    const faculty = facultyByEmail[seed.facultyEmail];
    const ownSlots = schedulesByFacultyEmail[seed.facultyEmail];
    const pickedSlot = seed.useOwnSchedule ? ownSlots[0] : undefined;

    await prisma.modificationRequest.create({
      data: {
        userId: faculty.id,
        type: seed.type,
        status: seed.status,
        scheduleId: pickedSlot?.id,
        originalDate: pickedSlot ? daysFromNowUTC(-7) : undefined,
        proposedDate: daysFromNowUTC(seed.proposedInDays),
        reason: seed.reason,
        reviewedById: seed.reviewedByHodCode ? hodByCode[seed.reviewedByHodCode].id : undefined,
        reviewedAt: seed.reviewedDaysAgo !== undefined ? daysFromNowUTC(-seed.reviewedDaysAgo) : undefined,
      },
    });
  }
  console.log(`✅ ${REQUEST_SEEDS.length} modification requests created (mixed types & statuses, all 5 departments).`);

  // 8. Events — institution and department-level, spread across the coming weeks
  for (const event of EVENTS) {
    await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        eventDate: daysFromNowUTC(event.daysFromNow),
        departmentId: departmentByCode[event.code].id,
      },
    });
  }
  console.log(`✅ ${EVENTS.length} events created across departments.`);

  // 9. Summary
  console.log('\n📋 Login credentials (all accounts share the password: password123)\n');
  console.log(`   Admin: admin@iitsfax.tn`);
  for (const hod of HODS) console.log(`   HOD (${hod.code}):  ${hod.email}  — ${hod.fullName}`);
  for (const f of FACULTY) console.log(`   Faculty (${f.code}): ${f.email}  — ${f.fullName}`);

  console.log('\n🎉 Seeding completed successfully for IIT Sfax!');
}

main()
  .catch((e) => {
    console.error('❌ Error while running the seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });