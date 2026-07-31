"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('firebase-admin/auth', () => {
    const verifyIdTokenMock = vitest_1.vi.fn();
    return {
        getAuth: () => ({
            verifyIdToken: verifyIdTokenMock,
        }),
    };
});
vitest_1.vi.mock('firebase-admin/firestore', () => {
    const runTransactionMock = vitest_1.vi.fn();
    const docMock = vitest_1.vi.fn(() => ({ id: 'mock_doc_id' }));
    const collectionMock = vitest_1.vi.fn(() => ({ doc: docMock }));
    return {
        getFirestore: () => ({
            collection: collectionMock,
            runTransaction: runTransactionMock,
        }),
        FieldValue: {
            serverTimestamp: vitest_1.vi.fn(() => 'MOCK_TIMESTAMP'),
        },
    };
});
const requireAuth_1 = require("../requireAuth");
const rateLimit_1 = require("../rateLimit");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, vitest_1.describe)('Middleware requireAuth', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('Retorna status 401 si falta la cabecera Authorization', async () => {
        const req = { headers: {} };
        const res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        const next = vitest_1.vi.fn();
        await (0, requireAuth_1.requireAuth)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ error: vitest_1.expect.stringContaining('No autorizado') }));
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('Retorna status 401 si la cabecera no tiene formato Bearer', async () => {
        const req = { headers: { authorization: 'Basic 12345' } };
        const res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        const next = vitest_1.vi.fn();
        await (0, requireAuth_1.requireAuth)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('Retorna status 401 si verifyIdToken falla o lanza un error', async () => {
        const authMock = (0, auth_1.getAuth)();
        authMock.verifyIdToken.mockRejectedValueOnce(new Error('Token revocado'));
        const req = { headers: { authorization: 'Bearer invalid_token' } };
        const res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        const next = vitest_1.vi.fn();
        await (0, requireAuth_1.requireAuth)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ error: vitest_1.expect.stringContaining('inválido o revocado') }));
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('Retorna status 403 si el token no contiene el claim orgId', async () => {
        const authMock = (0, auth_1.getAuth)();
        authMock.verifyIdToken.mockResolvedValueOnce({
            uid: 'user_123',
            email: 'user@example.com',
            role: 'gerente',
            // orgId falta deliberadamente
        });
        const req = { headers: { authorization: 'Bearer token_without_org' } };
        const res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        const next = vitest_1.vi.fn();
        await (0, requireAuth_1.requireAuth)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ error: vitest_1.expect.stringContaining('orgId') }));
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('Llama a next() y adjunta req.user cuando el token es válido y tiene orgId', async () => {
        const authMock = (0, auth_1.getAuth)();
        const decodedToken = {
            uid: 'usr_prointeca',
            email: 'admin@prointeca.com',
            orgId: 'prointeca',
            role: 'gerente',
        };
        authMock.verifyIdToken.mockResolvedValueOnce(decodedToken);
        const req = { headers: { authorization: 'Bearer valid_token' } };
        const res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        const next = vitest_1.vi.fn();
        await (0, requireAuth_1.requireAuth)(req, res, next);
        (0, vitest_1.expect)(req.user).toEqual(decodedToken);
        (0, vitest_1.expect)(next).toHaveBeenCalled();
    });
});
(0, vitest_1.describe)('Middleware rateLimit & checkRateLimit', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('checkRateLimit permite peticiones cuando el conteo está por debajo del límite', async () => {
        const dbMock = (0, firestore_1.getFirestore)();
        dbMock.runTransaction.mockImplementation(async (cb) => {
            const transactionMock = {
                get: vitest_1.vi.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ count: 5 }),
                }),
                update: vitest_1.vi.fn(),
                set: vitest_1.vi.fn(),
            };
            return cb(transactionMock);
        });
        const res = await (0, rateLimit_1.checkRateLimit)('usr_123', 'callGeminiProxy', 20);
        (0, vitest_1.expect)(res.allowed).toBe(true);
        (0, vitest_1.expect)(res.currentCount).toBe(6);
    });
    (0, vitest_1.it)('checkRateLimit rechaza peticiones cuando el conteo alcanza o supera el límite (ej. 20 para Gemini, 5 para sendEmail)', async () => {
        const dbMock = (0, firestore_1.getFirestore)();
        dbMock.runTransaction.mockImplementation(async (cb) => {
            const transactionMock = {
                get: vitest_1.vi.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ count: 20 }),
                }),
                update: vitest_1.vi.fn(),
                set: vitest_1.vi.fn(),
            };
            return cb(transactionMock);
        });
        const resGemini = await (0, rateLimit_1.checkRateLimit)('usr_123', 'callGeminiProxy', 20);
        (0, vitest_1.expect)(resGemini.allowed).toBe(false);
        dbMock.runTransaction.mockImplementation(async (cb) => {
            const transactionMock = {
                get: vitest_1.vi.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ count: 5 }),
                }),
                update: vitest_1.vi.fn(),
                set: vitest_1.vi.fn(),
            };
            return cb(transactionMock);
        });
        const resEmail = await (0, rateLimit_1.checkRateLimit)('usr_123', 'sendEmail', 5);
        (0, vitest_1.expect)(resEmail.allowed).toBe(false);
    });
    (0, vitest_1.it)('rateLimit middleware retorna 429 cuando la tasa es excedida', async () => {
        const dbMock = (0, firestore_1.getFirestore)();
        dbMock.runTransaction.mockImplementation(async (cb) => {
            const transactionMock = {
                get: vitest_1.vi.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ count: 20 }),
                }),
                update: vitest_1.vi.fn(),
            };
            return cb(transactionMock);
        });
        const middleware = (0, rateLimit_1.rateLimit)({ operation: 'callGeminiProxy', maxRequests: 20 });
        const req = { user: { uid: 'usr_overlimit', orgId: 'orgA' } };
        const res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        const next = vitest_1.vi.fn();
        await middleware(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(429);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            error: vitest_1.expect.stringContaining('Demasiadas peticiones'),
            operation: 'callGeminiProxy',
            maxRequests: 20,
        }));
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=middleware.test.js.map