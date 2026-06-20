import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
};
