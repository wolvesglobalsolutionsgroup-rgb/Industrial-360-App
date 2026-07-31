import { useProject } from '../ProjectContext';

export class MissingProjectContextError extends Error {
  constructor(missing: 'orgId' | 'projectId' | 'both') {
    super(
      missing === 'both'
        ? 'No hay organización ni proyecto activo. Selecciona un proyecto para continuar.'
        : missing === 'orgId'
        ? 'No hay organización activa en la sesión. Verifica tu autenticación.'
        : 'No hay proyecto activo seleccionado. Selecciona un proyecto para continuar.'
    );
    this.name = 'MissingProjectContextError';
  }
}

export interface RequiredProjectContext {
  orgId: string;
  projectId: string;
}

export function useRequiredProject(
  options: { allowAllSentinel?: boolean } = { allowAllSentinel: true }
): RequiredProjectContext {
  const { currentOrganization, currentProject } = useProject();

  const orgId = currentOrganization?.id;
  const projectId = currentProject?.id;

  if (!orgId && !projectId) {
    throw new MissingProjectContextError('both');
  }
  if (!orgId) {
    throw new MissingProjectContextError('orgId');
  }
  if (!projectId) {
    throw new MissingProjectContextError('projectId');
  }
  if (projectId === 'all' && options.allowAllSentinel === false) {
    throw new MissingProjectContextError('projectId');
  }

  return { orgId, projectId };
}
