import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase-admin/auth', () => {
  const verifyIdTokenMock = vi.fn();
  return {
    getAuth: () => ({
      verifyIdToken: verifyIdTokenMock,
    }),
  };
});

vi.mock('firebase-admin/firestore', () => {
  const runTransactionMock = vi.fn();
  const docMock = vi.fn(() => ({ id: 'mock_doc_id' }));
  const collectionMock = vi.fn(() => ({ doc: docMock }));
  return {
    getFirestore: () => ({
      collection: collectionMock,
      runTransaction: runTransactionMock,
    }),
    FieldValue: {
      serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
    },
  };
});

import { requireAuth } from '../requireAuth';
import { rateLimit, checkRateLimit } from '../rateLimit';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

describe('Middleware requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Retorna status 401 si falta la cabecera Authorization', async () => {
    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('No autorizado') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('Retorna status 401 si la cabecera no tiene formato Bearer', async () => {
    const req: any = { headers: { authorization: 'Basic 12345' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('Retorna status 401 si verifyIdToken falla o lanza un error', async () => {
    const authMock = getAuth() as any;
    authMock.verifyIdToken.mockRejectedValueOnce(new Error('Token revocado'));

    const req: any = { headers: { authorization: 'Bearer invalid_token' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('inválido o revocado') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('Retorna status 403 si el token no contiene el claim orgId', async () => {
    const authMock = getAuth() as any;
    authMock.verifyIdToken.mockResolvedValueOnce({
      uid: 'user_123',
      email: 'user@example.com',
      role: 'gerente',
      // orgId falta deliberadamente
    });

    const req: any = { headers: { authorization: 'Bearer token_without_org' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('orgId') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('Llama a next() y adjunta req.user cuando el token es válido y tiene orgId', async () => {
    const authMock = getAuth() as any;
    const decodedToken = {
      uid: 'usr_prointeca',
      email: 'admin@prointeca.com',
      orgId: 'prointeca',
      role: 'gerente',
    };
    authMock.verifyIdToken.mockResolvedValueOnce(decodedToken);

    const req: any = { headers: { authorization: 'Bearer valid_token' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(req.user).toEqual(decodedToken);
    expect(next).toHaveBeenCalled();
  });
});

describe('Middleware rateLimit & checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checkRateLimit permite peticiones cuando el conteo está por debajo del límite', async () => {
    const dbMock = getFirestore() as any;
    dbMock.runTransaction.mockImplementation(async (cb: any) => {
      const transactionMock = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ count: 5 }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return cb(transactionMock);
    });

    const res = await checkRateLimit('usr_123', 'callGeminiProxy', 20);

    expect(res.allowed).toBe(true);
    expect(res.currentCount).toBe(6);
  });

  it('checkRateLimit rechaza peticiones cuando el conteo alcanza o supera el límite (ej. 20 para Gemini, 5 para sendEmail)', async () => {
    const dbMock = getFirestore() as any;
    dbMock.runTransaction.mockImplementation(async (cb: any) => {
      const transactionMock = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ count: 20 }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return cb(transactionMock);
    });

    const resGemini = await checkRateLimit('usr_123', 'callGeminiProxy', 20);
    expect(resGemini.allowed).toBe(false);

    dbMock.runTransaction.mockImplementation(async (cb: any) => {
      const transactionMock = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ count: 5 }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return cb(transactionMock);
    });

    const resEmail = await checkRateLimit('usr_123', 'sendEmail', 5);
    expect(resEmail.allowed).toBe(false);
  });

  it('rateLimit middleware retorna 429 cuando la tasa es excedida', async () => {
    const dbMock = getFirestore() as any;
    dbMock.runTransaction.mockImplementation(async (cb: any) => {
      const transactionMock = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ count: 20 }),
        }),
        update: vi.fn(),
      };
      return cb(transactionMock);
    });

    const middleware = rateLimit({ operation: 'callGeminiProxy', maxRequests: 20 });
    const req: any = { user: { uid: 'usr_overlimit', orgId: 'orgA' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Demasiadas peticiones'),
      operation: 'callGeminiProxy',
      maxRequests: 20,
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
