import type { BrandKit, BrandKitResolver, DocumentType } from '../../types/brandkit';
import { PDVSA_PRESET } from '../brandkits/presets/pdvsa';

export class BrandKitRepository implements BrandKitResolver {
  async resolve(orgId: string, projectId: string | null, documentType: DocumentType): Promise<BrandKit> {
    if (!orgId) {
      throw new Error('[BrandKitRepository] orgId es obligatorio.');
    }

    // Retorna el preset PDVSA / EPC con la organización inyectada
    const now = new Date().toISOString();
    return {
      ...PDVSA_PRESET,
      id: `bk_${orgId}_${documentType.toLowerCase()}`,
      orgId,
      projectId: projectId || null,
      audit: {
        createdAt: now,
        createdBy: 'system',
        updatedAt: now,
        updatedBy: 'system',
        changeLog: [],
      },
      status: 'active',
      deletedAt: null,
    };
  }
}

export const brandkitRepository = new BrandKitRepository();
