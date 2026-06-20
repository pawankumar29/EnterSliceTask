import { Router } from 'express';
import { statsController } from '../controllers/ticketController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', asyncHandler(statsController));
