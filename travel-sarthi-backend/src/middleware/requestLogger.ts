import pinoHttp from 'pino-http';
import { logger } from '../shared/logger';
import { randomUUID } from 'crypto';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const existing = req.headers['x-request-id'];
    if (typeof existing === 'string' && existing.length > 0) return existing;
    return randomUUID();
  },
  customLogLevel: (_req, res, err) => {
    if (err !== undefined || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  quietReqLogger: true,
});
