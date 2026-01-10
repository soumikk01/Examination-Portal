import { z } from 'zod';

export const studentSchema = z.object({
    collegeId: z.string().min(1, "College ID is required"),
    name: z.string().min(1, "Name is required"),
    department: z.string().optional().nullable(),
    studentRoll: z.string().optional().nullable(),
    studentReg: z.string().optional().nullable(),
    examinationSem: z.string().optional().nullable(),
    batch: z.string().optional().nullable()
});

export const examSchema = z.object({
    examId: z.string().min(1, "Exam ID is required"),
    subject: z.string().min(1, "Subject is required"),
    score: z.number().min(0, "Score must be positive").optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    time: z.string().optional(),
    room: z.string().optional(),
    examType: z.enum(['Regular', 'Supply', 'Re-evaluation']).default('Regular'),
    examCategory: z.enum(['ODD', 'EVEN']).default('ODD')
});

export const verificationSchema = z.object({
    collegeId: z.string().min(1),
    verification: z.string().length(3, "Verification code must be 3 digits")
});
