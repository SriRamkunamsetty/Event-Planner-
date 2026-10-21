/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Main entry point for the Atelier Chronos full-stack Express + Vite application.
 * In development, mounts Vite in middlewareMode. In production, serves static assets from dist/.
 */

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createPlannerApp } from './api/index';

const filename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(filename);

export async function startServer(): Promise<void> {
  const app = createPlannerApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(currentDirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.DEFAULT_APP_PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    // Standard informational startup announcement
  });
}

void startServer();
