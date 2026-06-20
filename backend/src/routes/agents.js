import { Router } from 'express';
import { listAgentsController } from '../controllers/ticketController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const agentRouter = Router();

agentRouter.get('/', asyncHandler(listAgentsController));
