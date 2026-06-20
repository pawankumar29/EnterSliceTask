import {
  addComment,
  assignTicket,
  createTicket,
  getDashboardStats,
  getTicketDetails,
  listAgents,
  listTickets,
  updateTicketStatus,
} from '../services/ticketService.js';
import { HttpError } from '../utils/httpError.js';

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid ticket id');
  }
  return id;
};

export const createTicketController = async (req, res) => {
  const ticket = await createTicket(req.body);
  res.status(201).json(ticket);
};

export const listTicketsController = async (req, res) => {
  res.json(await listTickets(req.query));
};

export const getTicketController = async (req, res) => {
  res.json(await getTicketDetails(parseId(req.params.id)));
};

export const updateStatusController = async (req, res) => {
  res.json(await updateTicketStatus(parseId(req.params.id), req.body));
};

export const assignTicketController = async (req, res) => {
  res.json(await assignTicket(parseId(req.params.id), req.body));
};

export const addCommentController = async (req, res) => {
  res.status(201).json(await addComment(parseId(req.params.id), req.body));
};

export const statsController = async (_req, res) => {
  res.json(await getDashboardStats());
};

export const listAgentsController = async (_req, res) => {
  res.json(await listAgents());
};
