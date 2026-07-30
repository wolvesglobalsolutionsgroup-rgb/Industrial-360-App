import * as functionsLogger from 'firebase-functions/logger';
import { sanitizeData, sanitizeString } from '../../src/lib/logger';

export const logger = {
  info(message: string, ...args: any[]) {
    const cleanMsg = sanitizeString(message);
    const cleanArgs = args.map((a) => sanitizeData(a));
    functionsLogger.info(cleanMsg, ...cleanArgs);
  },
  warn(message: string, ...args: any[]) {
    const cleanMsg = sanitizeString(message);
    const cleanArgs = args.map((a) => sanitizeData(a));
    functionsLogger.warn(cleanMsg, ...cleanArgs);
  },
  error(message: string | Error, ...args: any[]) {
    const cleanArgs = args.map((a) => sanitizeData(a));
    if (message instanceof Error) {
      const sanitizedErr = sanitizeData(message);
      functionsLogger.error(sanitizeString(message.message), sanitizedErr, ...cleanArgs);
    } else {
      functionsLogger.error(sanitizeString(String(message)), ...cleanArgs);
    }
  },
  sanitizeData,
  sanitizeString
};
