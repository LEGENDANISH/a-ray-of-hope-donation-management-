import { z } from "zod";

export const authSchema = z.object({
  username: z.string().min(1),
  accessKey: z.string().min(1),
});

export const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  campaignId: z.string().optional(),
});

export const donationSchema = z.object({
  amount: z.number().positive(),
  donorId: z.string(),
  campaignId: z.string().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).default("ACTIVE"),
});

export const donorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const beneficiarySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  contactInfo: z.string().optional(),
});
