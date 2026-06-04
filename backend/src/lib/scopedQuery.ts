import type { Role } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Devuelve los IDs de proyectos visibles para un usuario.
 * Stevens (SUPERADMIN) ve TODOS los proyectos no eliminados.
 * Colaboradores SOLO ven los proyectos asignados en UserProjectAssignment.
 */
export async function getVisibleProjectIds(userId: string, role: Role): Promise<string[]> {
  if (role === 'SUPERADMIN') {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    return projects.map((p) => p.id);
  }

  const assignments = await prisma.userProjectAssignment.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return assignments.map((a) => a.projectId);
}

/**
 * IDs de tareas visibles para un usuario.
 * SUPERADMIN → devuelve [] (sin filtro: ve todas).
 * Colaboradores → tareas asignadas a él + tareas de sus proyectos visibles.
 */
export async function getVisibleTaskIds(userId: string, role: Role): Promise<string[]> {
  if (role === 'SUPERADMIN') return [];

  const projectIds = await getVisibleProjectIds(userId, role);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ assigneeId: userId }, { projectId: { in: projectIds } }],
      deletedAt: null,
    },
    select: { id: true },
  });
  return tasks.map((t) => t.id);
}

/** True si el usuario puede ver el proyecto indicado. */
export async function canSeeProject(
  userId: string,
  role: Role,
  projectId: string,
): Promise<boolean> {
  const ids = await getVisibleProjectIds(userId, role);
  return ids.includes(projectId);
}
