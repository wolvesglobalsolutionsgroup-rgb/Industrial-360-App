import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSetDoc = vi.fn();
const mockDocRef = {
  set: mockSetDoc,
  get: vi.fn(),
};

const mockDoc = vi.fn(() => mockDocRef);
const mockCollection = vi.fn(() => ({
  doc: vi.fn(() => mockDocRef),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    doc: mockDoc,
    collection: mockCollection,
  }),
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  },
}));

const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
const mockRevokeRefreshTokens = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    setCustomUserClaims: mockSetCustomUserClaims,
    revokeRefreshTokens: mockRevokeRefreshTokens,
  }),
}));

import { provisionFounderQaAccess } from '../../index';

describe('Sprint IC360-S14.2A: provisionFounderQaAccess Cloud Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Rechaza llamadas no autenticadas', async () => {
    const context: any = { auth: null };
    await expect(
      (provisionFounderQaAccess as any).run({ targetOrgId: 'prointeca-demo' }, context)
    ).rejects.toThrow('El usuario debe estar autenticado');
  });

  it('2. Rechaza intentos de provisionar en tenants no calificados como QA (e.g. org_prod_real)', async () => {
    const context: any = {
      auth: { uid: 'usr_founder', token: { email: 'founder@example.com' } },
    };

    await expect(
      (provisionFounderQaAccess as any).run(
        { targetOrgId: 'org_prod_real', action: 'provision' },
        context
      )
    ).rejects.toThrow("El tenant 'org_prod_real' no está clasificado como un entorno QA");
  });

  it('3. Rechaza roles no permitidos (e.g. platformAdmin)', async () => {
    const context: any = {
      auth: { uid: 'usr_founder', token: { email: 'founder@example.com' } },
    };

    await expect(
      (provisionFounderQaAccess as any).run(
        { targetOrgId: 'prointeca-demo', role: 'platformAdmin', action: 'provision' },
        context
      )
    ).rejects.toThrow("Rol no válido para entorno QA: 'platformAdmin'");
  });

  it('4. Provisiona exitosamente una membership QA y asigna Custom Claims', async () => {
    const context: any = {
      auth: { uid: 'usr_founder_123', token: { email: 'founder@prointeca.com' } },
      rawRequest: { ip: '127.0.0.1' },
    };

    const res = await (provisionFounderQaAccess as any).run(
      { targetOrgId: 'prointeca-demo', role: 'gerente', action: 'provision' },
      context
    );

    expect(res.success).toBe(true);
    expect(res.orgId).toBe('prointeca-demo');
    expect(res.role).toBe('gerente');

    // Verifica la asignación de claims en Admin SDK
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('usr_founder_123', {
      orgId: 'prointeca-demo',
      role: 'gerente',
    });

    // Verifica revocación de tokens para forzar refresh
    expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('usr_founder_123');

    // Verifica escritura de membership y audit log
    expect(mockDoc).toHaveBeenCalledWith('organizations/prointeca-demo/memberships/usr_founder_123');
    expect(mockCollection).toHaveBeenCalledWith('organizations/prointeca-demo/audit_logs');
  });

  it('5. Revoca el acceso QA de forma reversible y limpia claims', async () => {
    const context: any = {
      auth: { uid: 'usr_founder_123', token: { email: 'founder@prointeca.com' } },
    };

    const res = await (provisionFounderQaAccess as any).run(
      { targetOrgId: 'prointeca-demo', action: 'revoke' },
      context
    );

    expect(res.success).toBe(true);
    expect(res.action).toBe('revoke');

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('usr_founder_123', {
      orgId: '',
      role: '',
    });

    expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('usr_founder_123');
  });
});
