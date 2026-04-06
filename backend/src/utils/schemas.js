import { z } from 'zod';

const programEnum = z.enum(['BTECH', 'MTECH', 'DIPLOMA', 'MCA', 'BCA', 'BBA', 'MBA']);

export const studentSchema = z.object({
  collegeId: z.string().min(1, 'College ID is required'),
  name: z.string().min(1, 'Name is required'),
  department: z.string().optional().nullable(),
  degree: z.string().optional().nullable(),
  studentRoll: z.string().regex(/^\d{12}$/, 'Roll number must be 12 digits'),
  studentReg: z.string().optional().nullable(),
  examinationSem: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  program: programEnum.optional().nullable(),
  branch: z.string().optional().nullable(),
  semester: z.string().optional().nullable(),
});



// New bulk exam creation schema used by POST /exams
// Branch and semester are required here to match the Prisma Exam model,
// which defines both fields as non-nullable String columns.
export const examFormSchema = z.object({
  program: z.enum(['BTECH', 'MTECH', 'DIPLOMA', 'MCA', 'BCA', 'BBA', 'MBA']),
  branch: z.string().min(1, 'Branch is required'),
  semester: z.string().min(1, 'Semester is required'),
  examType: z.enum(['TEST_I', 'TEST_II', 'END_SEM']),
  examMode: z.enum(['REGULAR', 'BACKLOG']),
  examCategory: z.enum(['ODD', 'EVEN']),
  time: z.string().min(1).optional().nullable(),
  room: z.string().min(1).optional().nullable(),
  subjects: z
    .array(
      z.object({
        examId: z.string().min(1, 'Subject code is required'),
        subject: z.string().min(1, 'Subject name is required'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      }),
    )
    .min(1, 'At least one subject is required'),
  assignedStudents: z.array(z.string().min(1)).optional().default([]),
  includeScheduleOnly: z.boolean().optional().default(true),
});

export const verificationSchema = z.object({
  collegeId: z.string().min(1),
  verification: z
    .string()
    .regex(/^\d{12}$/, 'Roll number must be 12 digits'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
