import { db } from './db';
import { photos, type Photo as DbPhoto, type NewPhoto } from './schema';
import { eq } from 'drizzle-orm';

export interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
  uploadedAt: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

/**
 * Read all photos from database
 */
export async function getPhotos(): Promise<Photo[]> {
  try {
    const result = await db.select().from(photos);
    return result.map(photo => ({
      ...photo,
      uploadedAt: photo.uploadedAt.toISOString(),
      position: photo.position ?? undefined,
    }));
  } catch (error) {
    console.error('Error reading photos:', error);
    return [];
  }
}

/**
 * Add a new photo to the database
 */
export async function addPhoto(photo: NewPhoto): Promise<void> {
  try {
    await db.insert(photos).values(photo);
  } catch (error) {
    console.error('Error adding photo:', error);
    throw error;
  }
}

/**
 * Update an existing photo
 */
export async function updatePhoto(id: string, updates: Partial<DbPhoto>): Promise<void> {
  try {
    const result = await db
      .update(photos)
      .set(updates)
      .where(eq(photos.id, id));

    if (!result.rowCount) {
      throw new Error('Photo not found');
    }
  } catch (error) {
    console.error('Error updating photo:', error);
    throw error;
  }
}

/**
 * Delete a photo
 */
export async function deletePhoto(id: string): Promise<void> {
  try {
    await db.delete(photos).where(eq(photos.id, id));
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

/**
 * Auto-assign position for new photo in Montessori layout
 * This creates a pleasing scattered arrangement
 */
export async function autoAssignPosition(): Promise<Photo['position']> {
  const existingPhotos = await getPhotos();
  const photoIndex = existingPhotos.length;
  // Predefined positions for organic layout
  const positions = [
    { x: 10, y: 50, size: 'large' as const },
    { x: 45, y: 100, size: 'medium' as const },
    { x: 75, y: 200, size: 'small' as const },
    { x: 20, y: 400, size: 'medium' as const },
    { x: 60, y: 500, size: 'large' as const },
    { x: 85, y: 700, size: 'small' as const },
    { x: 15, y: 850, size: 'large' as const },
    { x: 50, y: 1000, size: 'medium' as const },
  ];

  // Cycle through positions, or generate new ones
  if (photoIndex < positions.length) {
    return positions[photoIndex];
  }

  // Generate new positions for additional photos
  return {
    x: Math.random() * 80 + 10, // 10-90% across
    y: Math.floor(photoIndex / 3) * 200 + (Math.random() * 100),
    size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
  };
}
