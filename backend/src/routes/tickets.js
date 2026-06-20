import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addCommentController,
  assignTicketController,
  createTicketController,
  getTicketController,
  listTicketsController,
  updateStatusController,
} from '../controllers/ticketController.js';

export const ticketRouter = Router();

ticketRouter.post('/', asyncHandler(createTicketController));
ticketRouter.get('/', asyncHandler(listTicketsController));
ticketRouter.get('/:id', asyncHandler(getTicketController));
ticketRouter.patch('/:id/status', asyncHandler(updateStatusController));
ticketRouter.patch('/:id/assign', asyncHandler(assignTicketController));
ticketRouter.post('/:id/comments', asyncHandler(addCommentController));
