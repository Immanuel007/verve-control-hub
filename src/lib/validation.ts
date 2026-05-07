import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(255),
  password: z.string().min(8, 'Min 8 characters').max(72),
});

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Required').max(50),
    lastName: z.string().trim().min(1, 'Required').max(50),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Use international format e.g. +254712345678'),
    email: z.string().trim().email('Enter a valid email').max(255),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .max(72)
      .regex(/[A-Za-z]/, 'Must include a letter')
      .regex(/\d/, 'Must include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
