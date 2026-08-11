import { PrismaClient, Role, RequestType, RequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { startOfWeek } from '../src/common/utils/date.util';

const prisma = new PrismaClient();

// ----------------------------------------
// Unified department setup for demo/testing
// All faculty + the primary HoD belong to this single department.
// ----------------------------------------

const UNIFIED_DEPARTMENT = {
  code: 'CS',
  name: 'Computer Science (Informatique)',
} as const;

const PRIMARY_HOD = {
  fullName: 'Dr. Sami Bouazizi',
  email: 'sami.bouazizi@iitsfax.tn',
};

const SUBJECTS = [
  'Data Structures & Algorithms',
  'Database Systems',
  'Web Development',
  'Operating Systems',
  'Software Engineering',
  'Artificial Intelligence',
  'Circuit Analysis',
  'Production Planning',
  'Wireless Networks',
  'Thermodynamics',
];

const TIME_SLOTS = [
  { startTime: '08:30', endTime: '10:00' },
  { startTime: '10:15', endTime: '11:45' },
  { startTime: '13:00', endTime: '14:30' },
  { startTime: '14:45', endTime: '16:15' },
];

const FACULTY = [
  { fullName: 'Ahmed Ben Salah', email: 'ahmed.bensalah@iitsfax.tn' },
  { fullName: 'Yassine Gharbi', email: 'yassine.gharbi@iitsfax.tn' },
  { fullName: 'Mouna Sassi', email: 'mouna.sassi@iitsfax.tn' },
  { fullName: 'Sarra Trabelsi', email: 'sarra.trabelsi@iitsfax.tn' },
  { fullName: 'Karim Jaziri', email: 'karim.jaziri@iitsfax.tn' },
  { fullName: 'Ines Hammami', email: 'ines.hammami@iitsfax.tn' },
  { fullName: 'Firas Ouali', email: 'firas.ouali@iitsfax.tn' },
  { fullName: 'Rim Belhadj', email: 'rim.belhadj@iitsfax.tn' },
  { fullName: 'Omar Zaidi', email: 'omar.zaidi@iitsfax.tn' },
  { fullName: 'Nour Chaabane', email: 'nour.chaabane@iitsfax.tn' },
  { fullName: 'Aymen Riahi', email: 'aymen.riahi@iitsfax.tn' },
  { fullName: 'Syrine Ayadi', email: 'syrine.ayadi@iitsfax.tn' },
  { fullName: 'Bilel Mahjoub', email: 'bilel.mahjoub@iitsfax.tn' },
  { fullName: 'Asma Guesmi', email: 'asma.guesmi@iitsfax.tn' },
  { fullName: 'Wassim Kallel', email: 'wassim.kallel@iitsfax.tn' },
];

const EVENTS = [
  { title: 'AI & Machine Learning Workshop', description: 'Hands-on workshop on applied ML for final-year students', daysFromNow: 12 },
  { title: 'Coding Bootcamp Kickoff', description: 'Two-week intensive bootcamp for the software engineering track', daysFromNow: 25 },
  { title: 'Faculty Orientation Day', description: 'Welcome session for newly joined academic staff', daysFromNow: 3 },
  { title: 'Departmental Council Meeting', description: 'Monthly review of course progress and scheduling', daysFromNow: 6 },
  { title: 'Smart Grid Seminar', description: 'Guest lecture on renewable energy integration', daysFromNow: 8 },
  { title: 'Industrial Visit — STEG Plant', description: 'Field visit for third-year students', daysFromNow: 18 },
  { title: '5G Networks Conference', description: 'Conference on next-generation telecom infrastructure', daysFromNow: 30 },
  { title: 'CAD/CAM Lab Certification', description: 'Certification exam for the CAD/CAM practical module', daysFromNow: 15 },
];

function daysFromNowUTC(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

function dateForDayInWeek(dayOfWeek: number, weekStart: Date): Date {
  const monday = startOfWeek(weekStart);
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const result = new Date(monday);
  result.setUTCDate(result.getUTCDate() + offset);
  result.setUTCHours(9, 0, 0, 0);
  return result;
}

function pickNonWorkingDay(
  recurringDays: number[],
  weekAnchor: Date,
): { proposedDate: Date; dayOfWeek: number } {
  const weekStart = startOfWeek(weekAnchor);
  for (const day of [1, 2, 3, 4, 5, 6]) {
    if (!recurringDays.includes(day)) {
      return { proposedDate: dateForDayInWeek(day, weekStart), dayOfWeek: day };
    }
  }
  return { proposedDate: dateForDayInWeek(0, weekStart), dayOfWeek: 0 };
}

async function main() {
  console.log('🌱 Starting unified-department seed for IIT Sfax...');

  try {
    await prisma.scheduleException.deleteMany();
    await prisma.modificationRequest.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
  } catch {
    console.log('⚠️ Tables were already empty, or some data could not be cleared.');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  const department = await prisma.department.create({ data: UNIFIED_DEPARTMENT });
  console.log(`✅ Unified department created: ${department.name}`);

  await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@iitsfax.tn',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const primaryHod = await prisma.user.create({
    data: {
      fullName: PRIMARY_HOD.fullName,
      email: PRIMARY_HOD.email,
      password: hashedPassword,
      role: Role.HOD,
      departmentId: department.id,
    },
  });
  console.log(`✅ Primary HoD created: ${PRIMARY_HOD.email}`);

  const facultyByEmail: Record<
    string,
    { id: string; email: string; fullName: string }
  > = {};

  for (const f of FACULTY) {
    const created = await prisma.user.create({
      data: {
        fullName: f.fullName,
        email: f.email,
        password: hashedPassword,
        role: Role.FACULTY,
        departmentId: department.id,
      },
    });
    facultyByEmail[f.email] = created;
  }
  console.log(`✅ ${FACULTY.length} faculty members assigned to ${department.name}.`);

  const schedulesByFacultyEmail: Record<
    string,
    { id: string; dayOfWeek: number; startTime: string; endTime: string; subject: string | null }[]
  > = {};

  let dayCursor = 1;
  for (const f of FACULTY) {
    const facultyUser = facultyByEmail[f.email];
    const slotsForThisTeacher: (typeof schedulesByFacultyEmail)[string] = [];

    for (let i = 0; i < 3; i++) {
      const day = ((dayCursor - 1) % 5) + 1;
      const timeSlot = TIME_SLOTS[(dayCursor + i) % TIME_SLOTS.length];
      const subject = SUBJECTS[(dayCursor + i) % SUBJECTS.length];

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
  console.log(`✅ ${FACULTY.length * 3} weekly schedule slots created.`);

  type RequestSeed = {
    facultyEmail: string;
    type: RequestType;
    status: RequestStatus;
    reason: string;
    proposedInDays: number;
    useOwnSchedule?: boolean;
    reviewedDaysAgo?: number;
  };

  const REQUEST_SEEDS: RequestSeed[] = [
    { facultyEmail: 'ahmed.bensalah@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Conflict with a PhD committee meeting', proposedInDays: 4, useOwnSchedule: true },
    { facultyEmail: 'yassine.gharbi@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.PENDING, reason: 'Extra revision session before the midterm exam', proposedInDays: 6 },
    { facultyEmail: 'mouna.sassi@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.PENDING, reason: 'Attending an international conference next week', proposedInDays: 9 },
    { facultyEmail: 'sarra.trabelsi@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Lab equipment maintenance on the usual session day', proposedInDays: 5, useOwnSchedule: true },
    { facultyEmail: 'karim.jaziri@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.APPROVED, reason: 'Extra lab hours to finish the project', proposedInDays: -2, reviewedDaysAgo: 3 },
    { facultyEmail: 'firas.ouali@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.APPROVED, reason: 'Swapping session for an industrial visit', proposedInDays: -7, useOwnSchedule: true, reviewedDaysAgo: 8 },
    { facultyEmail: 'nour.chaabane@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.APPROVED, reason: 'Compensating for a missed conference session', proposedInDays: -4, reviewedDaysAgo: 5 },
    { facultyEmail: 'bilel.mahjoub@iitsfax.tn', type: RequestType.MODIFICATION, status: RequestStatus.PENDING, reason: 'Swapping day for equipment training', proposedInDays: 3, useOwnSchedule: true },
    { facultyEmail: 'yassine.gharbi@iitsfax.tn', type: RequestType.COMPENSATION, status: RequestStatus.REJECTED, reason: 'Compensation week overlaps with final exams', proposedInDays: -3, reviewedDaysAgo: 4 },
    { facultyEmail: 'syrine.ayadi@iitsfax.tn', type: RequestType.ADDITIONAL, status: RequestStatus.REJECTED, reason: 'Additional day conflicts with lab availability', proposedInDays: -6, reviewedDaysAgo: 7 },
  ];

  for (const seed of REQUEST_SEEDS) {
    const faculty = facultyByEmail[seed.facultyEmail];
    const ownSlots = schedulesByFacultyEmail[seed.facultyEmail];
    const pickedSlot = seed.useOwnSchedule ? ownSlots[0] : undefined;
    const recurringDays = ownSlots.map((slot) => slot.dayOfWeek);
    const weekAnchor = daysFromNowUTC(seed.proposedInDays);

    let originalDate: Date | undefined;
    let proposedDate: Date;

    if (seed.type === RequestType.MODIFICATION && pickedSlot) {
      const weekStart = startOfWeek(weekAnchor);
      originalDate = dateForDayInWeek(pickedSlot.dayOfWeek, weekStart);
      const swapTarget = pickNonWorkingDay(recurringDays, weekStart);
      proposedDate = swapTarget.proposedDate;
    } else {
      proposedDate = pickNonWorkingDay(recurringDays, weekAnchor).proposedDate;
    }

    await prisma.modificationRequest.create({
      data: {
        userId: faculty.id,
        type: seed.type,
        status: seed.status,
        scheduleId: pickedSlot?.id,
        originalDate,
        proposedDate,
        reason: seed.reason,
        reviewedById: seed.reviewedDaysAgo !== undefined ? primaryHod.id : undefined,
        reviewedAt: seed.reviewedDaysAgo !== undefined ? daysFromNowUTC(-seed.reviewedDaysAgo) : undefined,
        reviewComment:
          seed.status === RequestStatus.REJECTED
            ? 'Request cannot be accommodated in the current schedule window.'
            : undefined,
      },
    });
  }
  console.log(`✅ ${REQUEST_SEEDS.length} modification requests created (all under unified department).`);

  for (const event of EVENTS) {
    await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        eventDate: daysFromNowUTC(event.daysFromNow),
        departmentId: department.id,
      },
    });
  }
  console.log(`✅ ${EVENTS.length} events created under ${department.name}.`);

  console.log('\n📋 Login credentials (password for all: password123)\n');
  console.log('   Admin:  admin@iitsfax.tn');
  console.log(`   HoD:    ${PRIMARY_HOD.email}  — ${PRIMARY_HOD.fullName}`);
  console.log(`   Dept:   ${department.name} (${department.code})`);
  console.log(`   Faculty: ${FACULTY.length} members, all in the same department`);
  console.log('\n🎉 Unified seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error while running the seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
