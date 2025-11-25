import { db } from './db';
import { photos, type Photo as DbPhoto, type NewPhoto } from './schema';
import { eq, sql } from 'drizzle-orm';

export interface Photo {
  id: string;
  url: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  width: number;
  height: number;
  blurDataUrl?: string;
  uploadedAt: string;
  groupId?: string | null;
  groupName?: string | null;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

export interface PhotoGroup {
  groupId: string;
  groupName: string;
  photoCount: number;
  coverPhoto: Photo;
}

/**
 * Read all photos from database
 */
export async function getPhotos(): Promise<Photo[]> {
  try {
    const result = await db.select().from(photos);
    return result.map(photo => ({
      ...photo,
      description: photo.description ?? undefined,
      blurDataUrl: photo.blurDataUrl ?? undefined,
      uploadedAt: photo.uploadedAt.toISOString(),
      position: photo.position ?? undefined,
    }));
  } catch (error) {
    console.error('Error reading photos:', error);
    return [];
  }
}

/**
 * Normalize a string for slug comparison (lowercase, replace non-alphanumeric with dashes)
 */
function normalizeForSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Get photos by group name (matches both exact name and slugified URL)
 */
export async function getPhotosByGroup(groupName: string): Promise<Photo[]> {
  try {
    // Normalize the search term for slug matching
    const normalizedSearch = normalizeForSlug(groupName);

    // Get all photos and filter by normalized group name
    const allPhotos = await db.select().from(photos);
    const matchingPhotos = allPhotos.filter(photo => {
      if (!photo.groupName) return false;
      const normalizedGroup = normalizeForSlug(photo.groupName);
      return normalizedGroup === normalizedSearch;
    });

    return matchingPhotos.map(photo => ({
      ...photo,
      description: photo.description ?? undefined,
      blurDataUrl: photo.blurDataUrl ?? undefined,
      uploadedAt: photo.uploadedAt.toISOString(),
      position: photo.position ?? undefined,
    }));
  } catch (error) {
    console.error('Error getting photos by group:', error);
    return [];
  }
}

/**
 * Get unique photo groups with cover photo (first uploaded in each group)
 */
export async function getPhotoGroups(): Promise<PhotoGroup[]> {
  try {
    const allPhotos = await getPhotos();
    const groupsMap = new Map<string, { photos: Photo[]; groupName: string }>();

    for (const photo of allPhotos) {
      if (photo.groupId && photo.groupName) {
        if (!groupsMap.has(photo.groupId)) {
          groupsMap.set(photo.groupId, { photos: [], groupName: photo.groupName });
        }
        groupsMap.get(photo.groupId)!.photos.push(photo);
      }
    }

    const groups: PhotoGroup[] = [];
    for (const [groupId, { photos: groupPhotos, groupName }] of groupsMap) {
      // Sort by uploadedAt to get first photo as cover
      groupPhotos.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      groups.push({
        groupId,
        groupName,
        photoCount: groupPhotos.length,
        coverPhoto: groupPhotos[0],
      });
    }

    // Sort groups by most recent upload
    groups.sort((a, b) => new Date(b.coverPhoto.uploadedAt).getTime() - new Date(a.coverPhoto.uploadedAt).getTime());

    return groups;
  } catch (error) {
    console.error('Error getting photo groups:', error);
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
 * Delete a photo and return its URL for blob cleanup
 */
export async function deletePhoto(id: string): Promise<string | null> {
  try {
    const result = await db
      .delete(photos)
      .where(eq(photos.id, id))
      .returning({ url: photos.url });

    return result[0]?.url || null;
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
