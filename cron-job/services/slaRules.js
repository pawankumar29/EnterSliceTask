
import { env } from "../config/env.js";

export const priorities = ["low", "medium", "high", "urgent"];

export const getSlaHours = (priority) => env.sla.windowsHours[priority];



export const nextPriority = (priority) => {
  const index = priorities.indexOf(priority);
  if (index === -1 || index === priorities.length - 1) return priority;
  return priorities[index + 1];
};


