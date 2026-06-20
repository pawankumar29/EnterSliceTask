import { env } from "../config/env.js";
import { pool, withTransaction } from "../db/pool.js";
import { getSlaHours, nextPriority } from "./slaRules.js";

const openStatuses = ["open", "in_progress"];

const formatTitle = (ticket) => `#${ticket.id} "${ticket.subject}"`;

const eventExists = async (connection, ticketId, eventType) => {
  const [rows] = await connection.execute(
    "SELECT id FROM sla_events WHERE ticket_id = ? AND event_type = ? LIMIT 1",
    [ticketId, eventType],
  );
  return rows.length > 0;
};

const insertEventOnce = async (connection, ticketId, eventType) => {
  const [result] = await connection.execute(
    "INSERT IGNORE INTO sla_events (ticket_id, event_type) VALUES (?, ?)",
    [ticketId, eventType],
  );
  return result.affectedRows === 1;
};

const markWarningIfNeeded = async (connection, ticket, now) => {
  const totalMs = getSlaHours(ticket.priority) * 60 * 60 * 1000;
  const warningStartsAt = new Date(
    new Date(ticket.slaDueAt).getTime() - totalMs * env.sla.warningRatio,
  );
  if (now < warningStartsAt || now >= new Date(ticket.slaDueAt)) return null;

  const inserted = await insertEventOnce(connection, ticket.id, "warning");
  if (!inserted) return null;
  const minutesLeft = Math.max(
    0,
    Math.round((new Date(ticket.slaDueAt).getTime() - now.getTime()) / 60000),
  );
  return `SLA WARNING: ticket ${formatTitle(ticket)} has ${minutesLeft} min left`;
};

const breachAndEscalateIfNeeded = async (connection, ticket, now) => {
  if (now < new Date(ticket.slaDueAt)) return [];

  const logs = [];
  const breachedInserted = await insertEventOnce(connection, ticket.id, "breached");
  if (breachedInserted) {
    logs.push(`SLA BREACH: ticket ${formatTitle(ticket)} passed due time`);
  }

  const alreadyEscalated =
    ticket.isEscalated || (await eventExists(connection, ticket.id, "escalated"));
  if (alreadyEscalated) return logs;

  const fromPriority = ticket.priority;
  const toPriority = nextPriority(fromPriority);
  await connection.execute(
    "UPDATE tickets SET priority = ?, is_escalated = TRUE WHERE id = ? AND is_escalated = FALSE",
    [toPriority, ticket.id],
  );
  const escalatedInserted = await insertEventOnce(connection, ticket.id, "escalated");

  if (escalatedInserted) {
    const suffix =
      fromPriority === toPriority
        ? "already urgent; marked escalated"
        : `escalated ${fromPriority} -> ${toPriority}`;
    logs.push(`SLA ESCALATED: ticket ${formatTitle(ticket)} ${suffix}`);
  }

  return logs;
};

export const runSlaCheck = async () => {
  const [tickets] = await pool.execute(
    `SELECT id, subject, priority, status, sla_due_at AS slaDueAt, is_escalated AS isEscalated, created_at AS createdAt
     FROM tickets WHERE status IN (?, ?) ORDER BY sla_due_at ASC`,
    openStatuses,
  );

  const logs = [];
  const now = new Date();

  for (const ticket of tickets) {
    const ticketLogs = await withTransaction(async (connection) => {
      const [lockedRows] = await connection.execute(
        `SELECT id, subject, priority, status, sla_due_at AS slaDueAt, is_escalated AS isEscalated, created_at AS createdAt
         FROM tickets WHERE id = ? FOR UPDATE`,
        [ticket.id],
      );
      const lockedTicket = lockedRows[0];
      if (!lockedTicket || !openStatuses.includes(lockedTicket.status)) return [];

      const warning = await markWarningIfNeeded(connection, lockedTicket, now);
      const breachLogs = await breachAndEscalateIfNeeded(connection, lockedTicket, now);
      return [warning, ...breachLogs].filter(Boolean);
    });

    logs.push(...ticketLogs);
  }

  if (!logs.length) {
    console.log(`SLA CHECK: ${tickets.length} active tickets scanned; no new actions`);
  } else {
    logs.forEach((line) => console.log(line));
  }

  return { scanned: tickets.length, actions: logs };
};