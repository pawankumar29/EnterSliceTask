import cron from "node-cron";
import { env } from "../config/env.js";

let running = false;

export const startSlaCron = () => {
  if (!cron.validate(env.sla.cronSchedule)) {
    throw new Error(`Invalid SLA_CRON_SCHEDULE: ${env.sla.cronSchedule}`);
  }

  console.log(`SLA cron scheduled: ${env.sla.cronSchedule}`);
  cron.schedule(env.sla.cronSchedule, async () => {
    if (running) {
      console.log("SLA CHECK: previous run still active; skipping overlap");
      return;
    }
    running = true;
    try {
        console.log("cron verify");
    } catch (error) {
      console.error("SLA CHECK failed", error);
    } finally {
      running = false;
    }
  });
};
