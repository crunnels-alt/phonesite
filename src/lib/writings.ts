import { db } from './db';
import { writings, type Writing as DbWriting, type NewWriting } from './schema';
import { eq } from 'drizzle-orm';

export interface Writing {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
  category: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

/**
 * Read all writings from database
 */
export async function getWritings(): Promise<Writing[]> {
  try {
    const result = await db.select().from(writings);
    return result.map(({ createdAt, updatedAt, ...writing }) => ({
      ...writing,
      position: writing.position ?? undefined,
    }));
  } catch (error) {
    console.error('Error reading writings:', error);
    return [];
  }
}

/**
 * Add a new writing to the database
 */
export async function addWriting(writing: NewWriting): Promise<void> {
  try {
    await db.insert(writings).values(writing);
  } catch (error) {
    console.error('Error adding writing:', error);
    throw error;
  }
}

/**
 * Update an existing writing
 */
export async function updateWriting(id: string, updates: Partial<DbWriting>): Promise<void> {
  try {
    const result = await db
      .update(writings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(writings.id, id));

    if (!result.rowCount) {
      throw new Error('Writing not found');
    }
  } catch (error) {
    console.error('Error updating writing:', error);
    throw error;
  }
}

/**
 * Delete a writing
 */
export async function deleteWriting(id: string): Promise<void> {
  try {
    await db.delete(writings).where(eq(writings.id, id));
  } catch (error) {
    console.error('Error deleting writing:', error);
    throw error;
  }
}
