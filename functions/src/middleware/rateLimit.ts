import { Response, NextFunction } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AuthenticatedRequest } from './requireAuth';
import { logger } from '../logger';

export interface RateLimitOptions {
  operation: string;
  maxRequests: number;
  windowMs?: number; // Por defecto 60,000 ms (1 minuto)
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
}

/**
 * Función atómica para verificar y registrar el rate limiting en la colección Firestore /rate_limits/{uid}_{operation}_{windowKey}.
 * Utiliza transacciones de Firestore para garantizar coherencia en concurrencia.
 * 
 * Configuración de límites por defecto recomendados:
 * - callGeminiProxy: 20/min por uid
 * - sendEmail: 5/min por uid
 */
export async function checkRateLimit(
  uid: string,
  operation: string,
  maxRequests: number,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  if (!uid) {
    throw new Error('uid es requerido para verificar rate limit.');
  }

  const windowKey = Math.floor(Date.now() / windowMs);
  const docId = `${uid}_${operation}_${windowKey}`;
  const db = getFirestore();
  const docRef = db.collection('rate_limits').doc(docId);

  return db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(docRef);

    if (!docSnap.exists) {
      transaction.set(docRef, {
        uid,
        operation,
        count: 1,
        windowKey,
        createdAt: FieldValue.serverTimestamp(),
        // TTL a 5 minutos (300,000 ms) para limpieza automática por Firestore TTL
        expireAt: new Date(Date.now() + 300000),
      });
      return { allowed: true, currentCount: 1, limit: maxRequests };
    }

    const data = docSnap.data();
    const currentCount = data?.count || 0;

    if (currentCount >= maxRequests) {
      return { allowed: false, currentCount, limit: maxRequests };
    }

    transaction.update(docRef, {
      count: currentCount + 1,
    });

    return { allowed: true, currentCount: currentCount + 1, limit: maxRequests };
  });
}

/**
 * Middleware Express para rate limiting persistente en Firestore.
 * Requiere que la petición haya pasado por requireAuth para tener req.user.uid.
 */
export function rateLimit(options: RateLimitOptions) {
  const { operation, maxRequests, windowMs = 60000 } = options;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        error: 'No autorizado: req.user.uid es necesario para el rate limiting persistente.',
      });
      return;
    }

    try {
      const result = await checkRateLimit(uid, operation, maxRequests, windowMs);

      if (!result.allowed) {
        res.status(429).json({
          error: `Demasiadas peticiones: Has excedido el límite de ${maxRequests} peticiones por minuto para '${operation}'.`,
          operation,
          maxRequests,
          currentCount: result.currentCount,
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error(`Error procesando rate limit para operacion '${operation}':`, error?.message || error);
      res.status(500).json({
        error: 'Error interno en la verificación de límite de tasa de peticiones (rate limiting).',
      });
      return;
    }
  };
}
