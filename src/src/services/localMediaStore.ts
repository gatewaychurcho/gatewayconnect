/**
 * Local Media Store for Gateway Church Zimbabwe
 * Uses IndexedDB to safely store large audio, video, and document files (sermons, recordings, archives)
 * completely locally in the browser, avoiding localStorage 5MB quota restrictions.
 */

const DB_NAME = 'GatewayConnectMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'sermon_media';

interface StoredMediaRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  duration?: string;
  created_at: string;
}

// In-memory cache of generated object URLs for fast synchronous access
const objectUrlCache = new Map<string, string>();

class LocalMediaStoreService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Saves a sermon audio or video file to IndexedDB.
   * Returns a persistent object URL for immediate and future playback.
   */
  async saveSermonMedia(
    id: string,
    fileOrBlob: Blob | File,
    metadata?: { name?: string; type?: string; size?: number; duration?: string }
  ): Promise<string> {
    try {
      const db = await this.getDB();
      const name = metadata?.name || (fileOrBlob instanceof File ? fileOrBlob.name : `media_${id}`);
      const type = metadata?.type || fileOrBlob.type || 'audio/mpeg';
      const size = metadata?.size || fileOrBlob.size;

      const record: StoredMediaRecord = {
        id,
        blob: fileOrBlob,
        name,
        type,
        size,
        duration: metadata?.duration,
        created_at: new Date().toISOString()
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Revoke old object URL if exists
      if (objectUrlCache.has(id)) {
        try {
          URL.revokeObjectURL(objectUrlCache.get(id)!);
        } catch {
          // ignore
        }
      }

      // Create and cache new object URL
      const objectUrl = URL.createObjectURL(fileOrBlob);
      objectUrlCache.set(id, objectUrl);
      return objectUrl;
    } catch (err) {
      console.error('[LocalMediaStore] Failed to save media:', err);
      // Fallback: create temporary in-memory object URL
      const tempUrl = URL.createObjectURL(fileOrBlob);
      objectUrlCache.set(id, tempUrl);
      return tempUrl;
    }
  }

  /**
   * Alias for saveSermonMedia to support general media file storage.
   */
  async saveMedia(
    id: string,
    fileOrBlob: Blob | File,
    metadata?: { name?: string; type?: string; size?: number; duration?: string }
  ): Promise<string> {
    return this.saveSermonMedia(id, fileOrBlob, metadata);
  }

  /**
   * Retrieves an object URL for playback by sermon ID.
   */
  async getSermonMediaUrl(id: string): Promise<string | null> {
    if (objectUrlCache.has(id)) {
      return objectUrlCache.get(id)!;
    }

    try {
      const db = await this.getDB();
      const record = await new Promise<StoredMediaRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (record && record.blob) {
        const objectUrl = URL.createObjectURL(record.blob);
        objectUrlCache.set(id, objectUrl);
        return objectUrl;
      }
      return null;
    } catch (err) {
      console.warn('[LocalMediaStore] Failed to retrieve media for ID:', id, err);
      return null;
    }
  }

  /**
   * Synchronously checks if an object URL is already cached in memory.
   */
  getCachedMediaUrl(id: string): string | undefined {
    return objectUrlCache.get(id);
  }

  /**
   * Retrieves the raw Blob for download or export.
   */
  async getSermonMediaBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      const record = await new Promise<StoredMediaRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      return record?.blob || null;
    } catch {
      return null;
    }
  }

  /**
   * Deletes a local sermon media entry from IndexedDB.
   */
  async deleteSermonMedia(id: string): Promise<void> {
    if (objectUrlCache.has(id)) {
      try {
        URL.revokeObjectURL(objectUrlCache.get(id)!);
      } catch {
        // ignore
      }
      objectUrlCache.delete(id);
    }

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[LocalMediaStore] Failed to delete media for ID:', id, err);
    }
  }

  /**
   * Checks if media is stored locally in IndexedDB.
   */
  async hasLocalMedia(id: string): Promise<boolean> {
    if (objectUrlCache.has(id)) return true;
    try {
      const db = await this.getDB();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count(id);
        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Compresses an image client-side to ensure it safely fits in localStorage without quota errors.
   */
  compressImage(file: File, maxWidth = 1000, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const LocalMediaStore = new LocalMediaStoreService();
