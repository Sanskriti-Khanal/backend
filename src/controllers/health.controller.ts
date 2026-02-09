import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '@utils/response.util';

export class HealthController {
  /**
   * Basic health check
   * GET /api/v1/health
   */
  check = async (req: Request, res: Response): Promise<void> => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
    };

    // If database is not connected, return 503
    const statusCode = health.services.database === 'connected' ? 200 : 503;
    res.status(statusCode).json(health);
  };

  /**
   * Detailed health check for monitoring
   * GET /api/v1/health/detailed
   */
  detailed = async (req: Request, res: Response): Promise<void> => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          host: mongoose.connection.host || 'unknown',
          name: mongoose.connection.name || 'unknown',
          readyState: mongoose.connection.readyState,
        },
      },
    };

    const statusCode = health.services.database.status === 'connected' ? 200 : 503;
    res.status(statusCode).json(health);
  };
}

