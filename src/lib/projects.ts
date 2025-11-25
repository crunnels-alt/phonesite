import { db } from './db';
import { projects, type Project as DbProject, type NewProject } from './schema';
import { eq } from 'drizzle-orm';

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  tech: string;
  year: string;
  status: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

/**
 * Read all projects from database
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const result = await db.select().from(projects);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return result.map(({ createdAt, updatedAt, ...project }) => ({
      ...project,
      position: project.position ?? undefined,
    }));
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
}

/**
 * Add a new project to the database
 */
export async function addProject(project: NewProject): Promise<void> {
  try {
    await db.insert(projects).values(project);
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, updates: Partial<DbProject>): Promise<void> {
  try {
    const result = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id));

    if (!result.rowCount) {
      throw new Error('Project not found');
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await db.delete(projects).where(eq(projects.id, id));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}
