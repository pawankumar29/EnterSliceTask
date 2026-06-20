import { pool, withTransaction } from '../db/pool.js';
import { HttpError, notFound } from '../utils/httpError.js';
import {
  assignSchema,
  commentSchema,
  createTicketSchema,
  listTicketsSchema,
  statusSchema,
} from '../validations/ticketSchemas.js';
import { calculateSlaDueAt, assertStatusTransition } from './slaRules.js';

const ticketFields = `
  t.id, t.subject, t.description, t.priority, t.status, t.assigned_agent_id AS assignedAgentId,
  a.name AS assignedAgentName, t.sla_due_at AS slaDueAt, t.is_escalated AS isEscalated,
  t.created_at AS createdAt, t.updated_at AS updatedAt,
  EXISTS(SELECT 1 FROM sla_events se WHERE se.ticket_id = t.id AND se.event_type = 'breached') AS isBreached,
  EXISTS(SELECT 1 FROM sla_events se WHERE se.ticket_id = t.id AND se.event_type = 'warning') AS isAtRisk
`;

export const listAgents = async () => {
  const [rows] = await pool.execute('SELECT id, name, email, created_at AS createdAt FROM agents ORDER BY name');
  return rows;
};

const ensureAgentExists = async (connection, agentId) => {
  if (agentId === null || agentId === undefined) return;
  const [rows] = await connection.execute('SELECT id FROM agents WHERE id = ?', [agentId]);
  if (!rows.length) throw notFound('Agent not found');
};

export const createTicket = async (payload) => {
  const input = createTicketSchema.parse(payload);
  const slaDueAt = calculateSlaDueAt(input.priority);

  return withTransaction(async (connection) => {
    await ensureAgentExists(connection, input.assignedAgentId);
    const [result] = await connection.execute(
      `INSERT INTO tickets (subject, description, priority, assigned_agent_id, sla_due_at)
       VALUES (?, ?, ?, ?, ?)`,
      [input.subject, input.description, input.priority, input.assignedAgentId ?? null, slaDueAt],
    );
    return getTicketById(result.insertId, connection);
  });
};

export const listTickets = async (query) => {
  const input = listTicketsSchema.parse(query);
  const filters = [];
  const values = [];

  if (input.status) {
    filters.push('t.status = ?');
    values.push(input.status);
  }
  if (input.priority) {
    filters.push('t.priority = ?');
    values.push(input.priority);
  }
  if (input.search) {
    filters.push('t.subject LIKE ?');
    values.push(`%${input.search}%`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const offset = (input.page - 1) * input.pageSize;
  const [rows] = await pool.query(
    `SELECT ${ticketFields}
     FROM tickets t
     LEFT JOIN agents a ON a.id = t.assigned_agent_id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, Number(input.pageSize), Number(offset)],
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM tickets t
     ${where}`,
    values,
  );

  return {
    data: rows,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / input.pageSize),
    },
  };
};

export const getTicketById = async (id, connection = pool) => {
  const [rows] = await connection.execute(
    `SELECT ${ticketFields}
     FROM tickets t
     LEFT JOIN agents a ON a.id = t.assigned_agent_id
     WHERE t.id = ?`,
    [id],
  );
  if (!rows.length) throw notFound('Ticket not found');
  return rows[0];
};

export const getTicketDetails = async (id, connection = pool) => {
  const ticket = await getTicketById(id, connection);
  const [comments] = await connection.execute(
    `SELECT id, ticket_id AS ticketId, author, message, created_at AS createdAt
     FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC, id ASC`,
    [id],
  );
  const [slaEvents] = await connection.execute(
    `SELECT id, ticket_id AS ticketId, event_type AS eventType, created_at AS createdAt
     FROM sla_events WHERE ticket_id = ? ORDER BY created_at ASC, id ASC`,
    [id],
  );
  return { ...ticket, comments, slaEvents };
};

export const updateTicketStatus = async (id, payload) => {
  const input = statusSchema.parse(payload);
  return withTransaction(async (connection) => {
    const ticket = await getTicketById(id, connection);
    try {
      assertStatusTransition(ticket.status, input.status);
    } catch (error) {
      throw new HttpError(409, error.message);
    }
    await connection.execute('UPDATE tickets SET status = ? WHERE id = ?', [input.status, id]);
    return getTicketDetails(id, connection);
  });
};

export const assignTicket = async (id, payload) => {
  const input = assignSchema.parse(payload);
  return withTransaction(async (connection) => {
    await getTicketById(id, connection);
    await ensureAgentExists(connection, input.assignedAgentId);
    await connection.execute('UPDATE tickets SET assigned_agent_id = ? WHERE id = ?', [input.assignedAgentId, id]);
    return getTicketDetails(id, connection);
  });
};

export const addComment = async (id, payload) => {
  const input = commentSchema.parse(payload);
  return withTransaction(async (connection) => {
    await getTicketById(id, connection);
    const [result] = await connection.execute(
      'INSERT INTO ticket_comments (ticket_id, author, message) VALUES (?, ?, ?)',
      [id, input.author, input.message],
    );
    const [rows] = await connection.execute(
      `SELECT id, ticket_id AS ticketId, author, message, created_at AS createdAt
       FROM ticket_comments WHERE id = ?`,
      [result.insertId],
    );
    return rows[0];
  });
};

export const getDashboardStats = async () => {
  const [statusCounts] = await pool.execute('SELECT status, COUNT(*) AS count FROM tickets GROUP BY status');
  const [priorityCounts] = await pool.execute('SELECT priority, COUNT(*) AS count FROM tickets GROUP BY priority');
  const [[sla]] = await pool.execute(
    `SELECT
       SUM(CASE WHEN breached.id IS NOT NULL AND t.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) AS breached,
       SUM(CASE WHEN warning.id IS NOT NULL AND breached.id IS NULL AND t.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) AS atRisk
     FROM tickets t
     LEFT JOIN sla_events breached ON breached.ticket_id = t.id AND breached.event_type = 'breached'
     LEFT JOIN sla_events warning ON warning.ticket_id = t.id AND warning.event_type = 'warning'`,
  );
  return { statusCounts, priorityCounts, breached: Number(sla.breached || 0), atRisk: Number(sla.atRisk || 0) };
};
