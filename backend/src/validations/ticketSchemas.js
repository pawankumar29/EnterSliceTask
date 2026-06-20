import { z } from 'zod';
import { priorities, statuses } from '../services/slaRules.js';

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(180),
  description: z.string().trim().min(5),
  priority: z.enum(priorities),
  assignedAgentId: z.number().int().positive().nullable().optional(),
});

export const listTicketsSchema = z.object({
  status: z.enum(statuses).optional(),
  priority: z.enum(priorities).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});

export const statusSchema = z.object({ status: z.enum(statuses) });

export const assignSchema = z.object({
  assignedAgentId: z.number().int().positive().nullable(),
});

export const commentSchema = z.object({
  author: z.string().trim().min(2).max(120).default('customer'),
  message: z.string().trim().min(2),
});
