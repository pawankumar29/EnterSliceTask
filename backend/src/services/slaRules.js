import { env } from '../config/env.js';

export const priorities = ['low', 'medium', 'high', 'urgent'];
export const statuses = ['open', 'in_progress', 'resolved', 'closed'];

export const getSlaHours = (priority) => env.sla.windowsHours[priority];

export const calculateSlaDueAt = (priority, from = new Date()) => {
  const hours = getSlaHours(priority);
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
};

export const nextPriority = (priority) => {
  const index = priorities.indexOf(priority);
  if (index === -1 || index === priorities.length - 1) return priority;
  return priorities[index + 1];
};

export const statusTransitions = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['open', 'resolved', 'closed'],
  resolved: ['closed', 'open'],
  closed: [],
};

export const assertStatusTransition = (from, to) => {
  if (from === to) return;
  if (!statusTransitions[from]?.includes(to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
};
