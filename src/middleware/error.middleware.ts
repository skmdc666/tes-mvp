import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { ErrorResponse } from '../types/index';

/**
 * Global error handler middleware
 * Catches and formats errors consistently across the API
 */
export const errorHandler = (
  err: Error | any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const timestamp = new Date();
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let details: Record<string, unknown> | undefined;

  // Zod validation errors
  if (err instanceof z.ZodError) {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = err.flatten().fieldErrors;
  }
  // JSON parse errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON';
    code = 'INVALID_JSON';
  }
  // Custom API errors (with statusCode)
  else if ('statusCode' in err && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    message = err.message || message;
    code = err.code;
    details = err.details;
  }
  // Standard Node errors
  else if (err instanceof Error) {
    message = err.message;
    // Check for common error types
    if (err.name === 'UnauthorizedError') {
      statusCode = 401;
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
    }
  }

  const errorResponse: ErrorResponse = {
    error: message,
    code,
    details,
    timestamp,
  };

  // Log errors (except validation errors in production)
  if (statusCode >= 500 || process.env.NODE_ENV !== 'production') {
    console.error(`[${statusCode}] ${code || 'ERROR'} - ${message}`, {
      path: req.path,
      method: req.method,
      err: err instanceof Error ? err.message : err,
    });
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler
 * Catches requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    timestamp: new Date(),
  });
};

/**
 * Request validation error handler
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
