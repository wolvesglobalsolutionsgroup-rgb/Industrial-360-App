"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mockSetDoc = vitest_1.vi.fn();
const mockDocRef = {
    set: mockSetDoc,
    get: vitest_1.vi.fn(),
};
const mockDoc = vitest_1.vi.fn(() => mockDocRef);
const mockCollection = vitest_1.vi.fn(() => ({
    doc: vitest_1.vi.fn(() => mockDocRef),
}));
vitest_1.vi.mock('firebase-admin/firestore', () => ({
    getFirestore: () => ({
        doc: mockDoc,
        collection: mockCollection,
    }),
    FieldValue: {
        serverTimestamp: () => 'SERVER_TIMESTAMP',
    },
}));
const mockSetCustomUserClaims = vitest_1.vi.fn().mockResolvedValue(undefined);
const mockRevokeRefreshTokens = vitest_1.vi.fn().mockResolvedValue(undefined);
vitest_1.vi.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        setCustomUserClaims: mockSetCustomUserClaims,
        revokeRefreshTokens: mockRevokeRefreshTokens,
    }),
}));
const index_1 = require("../../index");
(0, vitest_1.describe)('Sprint IC360-S14.2A: provisionFounderQaAccess Cloud Function', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('1. Rechaza llamadas no autenticadas', async () => {
        const context = { auth: null };
        await (0, vitest_1.expect)(index_1.provisionFounderQaAccess({ targetOrgId: 'prointeca-demo' }, context)).rejects.toThrow('El usuario debe estar autenticado');
    });
    (0, vitest_1.it)('2. Rechaza intentos de provisionar en tenants no calificados como QA (e.g. org_prod_real)', async () => {
        const context = {
            auth: { uid: 'usr_founder', token: { email: 'founder@example.com' } },
        };
        await (0, vitest_1.expect)(index_1.provisionFounderQaAccess({ targetOrgId: 'org_prod_real', action: 'provision' }, context)).rejects.toThrow("El tenant 'org_prod_real' no está clasificado como un entorno QA");
    });
    (0, vitest_1.it)('3. Rechaza roles no permitidos (e.g. platformAdmin)', async () => {
        const context = {
            auth: { uid: 'usr_founder', token: { email: 'founder@example.com' } },
        };
        await (0, vitest_1.expect)(index_1.provisionFounderQaAccess({ targetOrgId: 'prointeca-demo', role: 'platformAdmin', action: 'provision' }, context)).rejects.toThrow("Rol no válido para entorno QA: 'platformAdmin'");
    });
    (0, vitest_1.it)('4. Provisiona exitosamente una membership QA y asigna Custom Claims', async () => {
        const context = {
            auth: { uid: 'usr_founder_123', token: { email: 'founder@prointeca.com' } },
            rawRequest: { ip: '127.0.0.1' },
        };
        const res = await index_1.provisionFounderQaAccess({ targetOrgId: 'prointeca-demo', role: 'gerente', action: 'provision' }, context);
        (0, vitest_1.expect)(res.success).toBe(true);
        (0, vitest_1.expect)(res.orgId).toBe('prointeca-demo');
        (0, vitest_1.expect)(res.role).toBe('gerente');
        // Verifica la asignación de claims en Admin SDK
        (0, vitest_1.expect)(mockSetCustomUserClaims).toHaveBeenCalledWith('usr_founder_123', {
            orgId: 'prointeca-demo',
            role: 'gerente',
        });
        // Verifica revocación de tokens para forzar refresh
        (0, vitest_1.expect)(mockRevokeRefreshTokens).toHaveBeenCalledWith('usr_founder_123');
        // Verifica escritura de membership y audit log
        (0, vitest_1.expect)(mockDoc).toHaveBeenCalledWith('organizations/prointeca-demo/memberships/usr_founder_123');
        (0, vitest_1.expect)(mockCollection).toHaveBeenCalledWith('organizations/prointeca-demo/audit_logs');
    });
    (0, vitest_1.it)('5. Revoca el acceso QA de forma reversible y limpia claims', async () => {
        const context = {
            auth: { uid: 'usr_founder_123', token: { email: 'founder@prointeca.com' } },
        };
        const res = await index_1.provisionFounderQaAccess({ targetOrgId: 'prointeca-demo', action: 'revoke' }, context);
        (0, vitest_1.expect)(res.success).toBe(true);
        (0, vitest_1.expect)(res.action).toBe('revoke');
        (0, vitest_1.expect)(mockSetCustomUserClaims).toHaveBeenCalledWith('usr_founder_123', {
            orgId: '',
            role: '',
        });
        (0, vitest_1.expect)(mockRevokeRefreshTokens).toHaveBeenCalledWith('usr_founder_123');
    });
});
//# sourceMappingURL=founderQaAccess.test.js.map