import { Request, Response, NextFunction } from 'express';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { logger } from '../logger';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Middleware para verificar la autenticación del ID Token mediante Firebase Admin SDK.
 * - Exige la cabecera Authorization: Bearer <idToken>
 * - Verifica el token con admin.auth().verifyIdToken(idToken, true) (checkRevoked = true)
 * - Retorna 401 si falta el token, es inválido o fue revocado.
 * - Retorna 403 si el token no contiene el claim orgId.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers as any).Authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'No autorizado: Cabecera Authorization: Bearer <idToken> es requerida.',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    res.status(401).json({
      error: 'No autorizado: Token de identificación no proporcionado.',
    });
    return;
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken, true);

    if (!decodedToken || !decodedToken.orgId) {
      res.status(403).json({
        error: 'Prohibido: El token verificado no contiene claims de organización (orgId).',
      });
      return;
    }

    req.user = decodedToken;
    next();
  } catch (error: any) {
    logger.warn('Error al verificar idToken en requireAuth:', error?.message || error);
    res.status(401).json({
      error: 'No autorizado: Token de identificación inválido o revocado.',
      details: error?.message,
    });
    return;
  }
}
