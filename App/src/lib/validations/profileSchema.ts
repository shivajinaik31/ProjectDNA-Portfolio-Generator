import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max, `Maximum ${max} characters`).optional().or(z.literal(''));

const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''));

const optionalYear = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === '') return true;

      const year = Number(value);
      const currentYear = new Date().getFullYear();

      return Number.isInteger(year) && year >= 1950 && year <= currentYear + 10;
    },
    'Enter a valid year'
  );

export const personalSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .regex(
      /^[A-Za-zÀ-ÿ\s.'-]+$/,
      'Name contains invalid characters'
    ),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number')
    .optional()
    .or(z.literal('')),

  location: optionalText(100),

  professional_title: optionalText(100),

  bio: optionalText(1000),
});

export const educationSchema = z.object({
  institution: optionalText(150),

  degree: optionalText(100),

  field_of_study: optionalText(100),

  start_year: optionalYear,

  end_year: optionalYear,

  grade: z
    .string()
    .trim()
    .regex(
      /^$|^(?:\d{1,2}(?:\.\d{1,2})?\s*(?:\/\s*10|%?)?)$/,
      'Enter a valid grade or percentage'
    ),

  description: optionalText(1000),
});

export const experienceSchema = z.object({
  company: optionalText(150),

  job_title: optionalText(100),

  employment_type: optionalText(50),

  start_date: z.string().optional().or(z.literal('')),

  end_date: z.string().optional().or(z.literal('')),

  currently_working: z.boolean(),

  description: optionalText(1500),
});

export const certificationSchema = z.object({
  name: optionalText(150),

  issuing_organization: optionalText(150),

  issue_date: z.string().optional().or(z.literal('')),

  expiry_date: z.string().optional().or(z.literal('')),

  credential_id: optionalText(100),

  credential_url: optionalUrl,
});

export const achievementSchema = z.object({
  title: optionalText(150),

  description: optionalText(1000),

  achievement_date: z.string().optional().or(z.literal('')),

  url: optionalUrl,
});

export const languageSchema = z.object({
  language: z
    .string()
    .trim()
    .min(1, 'Enter a language')
    .max(50, 'Language name is too long'),

  proficiency: optionalText(50),
});

export const linksSchema = z.object({
  github_url: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (z.string().url().safeParse(value).success &&
          /^https?:\/\/(www\.)?github\.com\//i.test(value)),
      'Enter a valid GitHub URL'
    )
    .optional()
    .or(z.literal('')),

  linkedin_url: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (z.string().url().safeParse(value).success &&
          /^https?:\/\/(www\.)?linkedin\.com\//i.test(value)),
      'Enter a valid LinkedIn URL'
    )
    .optional()
    .or(z.literal('')),

  portfolio_url: optionalUrl,
});