import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import compression from "compression";
import { errorHandler } from './middleware/errorHandler.js';

import { ticketRouter } from './routes/tickets.js';
import {agentRouter} from './routes/agents.js';
import { dashboardRouter } from './routes/dashboard.js';
import rateLimit from "express-rate-limit";



export const app = express();

app.use(helmet());

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(compression());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/tickets', ticketRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/agents', agentRouter);


app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);
