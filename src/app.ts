import cors from 'cors';
import express, { type Application } from 'express';

import { env } from './config/env';
import { API_PREFIX } from './constants';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { experiencesRouter } from './modules/experiences/experiences.routes';
import { messagesRouter } from './modules/messages/messages.routes';
import { profileRouter } from './modules/profile/profile.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { skillsRouter } from './modules/skills/skills.routes';

/**
 * Express application factory (README §10 step 12).
 *
 * Wires CORS (CLIENT_URL), JSON body parsing, all module routers under
 * `/api`, a `GET /api/health` check, and the global error handler.
 */
export function createApp(): Application {
  const app = express();

  // --- Global middleware -------------------------------------------------

  // CORS: allow the frontend origin (README §10 step 12).
  app.use(
    cors({
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // Body parsing (JSON). A generous limit accommodates rich-text project content.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- Health check ------------------------------------------------------

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
    });
  });

  // --- Routes ------------------------------------------------------------

  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/profile`, profileRouter);
  app.use(`${API_PREFIX}/skills`, skillsRouter);
  app.use(`${API_PREFIX}/experiences`, experiencesRouter);
  app.use(`${API_PREFIX}/projects`, projectsRouter);
  app.use(`${API_PREFIX}/messages`, messagesRouter);

  // --- 404 + error handling (must be last) -------------------------------

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
