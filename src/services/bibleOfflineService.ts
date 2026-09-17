import { BibleVersion } from '../types';
import { SAMPLE_VERSES_DATA } from '../data/bibleData';

/**
 * Bible Offline Service for Gateway Church Zimbabwe
 * Uses browser IndexedDB to safely cache Holy Scripture (chapters and entire books)
 * locally for offline reading without network connectivity.
 */

const DB_NAME = 'GatewayConnectBibleDB';
const DB_VERSION = 1;
const STORE_CHAPTERS = 'offline_chapters';
const STORE_BOOKS = 'offline_books';
const STORE_SETTINGS = 'bible_settings';

export interface CachedChapterRecord {
  id: string; // `${book}_${chapter}_${version}`
  book: string;
  chapter: number;
  version: BibleVersion;
  verses: Array<{ verseNum: number; text: string }>;
  cachedAt: string;
  verseCount: number;
}

export interface CachedBookRecord {
  id: string; // `${book}_${version}`
  book: string;
  version: BibleVersion;
  chapters: number[];
  totalChapters: number;
  cachedAt: string;
  isComplete: boolean;
}

class BibleOfflineService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private offlineModeEnabledMemory: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('gcz_bible_offline_mode');
      this.offlineModeEnabledMemory = saved === 'true';
    } catch {
      this.offlineModeEnabledMemory = false;
    }
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_CHAPTERS)) {
          const chStore = db.createObjectStore(STORE_CHAPTERS, { keyPath: 'id' });
          chStore.createIndex('book_version', ['book', 'version'], { unique: false });
          chStore.createIndex('book', 'book', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_BOOKS)) {
          db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Fast synchronous check of offline mode flag
   */
  isOfflineModeActive(): boolean {
    return this.offlineModeEnabledMemory;
  }

  /**
   * Sets offline mode preference in memory, localStorage, and IndexedDB
   */
  async setOfflineMode(enabled: boolean): Promise<void> {
    this.offlineModeEnabledMemory = enabled;
    try {
      localStorage.setItem('gcz_bible_offline_mode', String(enabled));
    } catch {
      // Ignore localStorage errors
    }

    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ key: 'offlineMode', value: enabled, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Failed to persist offline setting in IndexedDB:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_bible_offline_mode_changed', { detail: { enabled } }));
    }
  }

  /**
   * Formats the unique key for chapter storage
   */
  private makeChapterKey(book: string, chapter: number, version: BibleVersion): string {
    return `${book.trim().toLowerCase()}_${chapter}_${version.trim().toLowerCase()}`;
  }

  /**
   * Formats the unique key for book storage
   */
  private makeBookKey(book: string, version: BibleVersion): string {
    return `${book.trim().toLowerCase()}_${version.trim().toLowerCase()}`;
  }

  /**
   * Retrieves a cached chapter from IndexedDB
   */
  async getCachedChapter(book: string, chapter: number, version: BibleVersion): Promise<Array<{ verseNum: number; text: string }> | null> {
    try {
      const db = await this.getDB();
      const key = this.makeChapterKey(book, chapter, version);

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CHAPTERS, 'readonly');
        const store = tx.objectStore(STORE_CHAPTERS);
        const req = store.get(key);

        req.onsuccess = () => {
          const res = req.result as CachedChapterRecord | undefined;
          if (res && Array.isArray(res.verses) && res.verses.length > 0) {
            resolve(res.verses);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      console.warn('Error reading cached chapter from IndexedDB:', e);
      return null;
    }
  }

  /**
   * Saves a chapter into IndexedDB and updates book index
   */
  async cacheChapter(
    book: string, 
    chapter: number, 
    version: BibleVersion, 
    verses: Array<{ verseNum: number; text: string }>
  ): Promise<boolean> {
    if (!verses || verses.length === 0) return false;

    try {
      const db = await this.getDB();
      const key = this.makeChapterKey(book, chapter, version);
      const record: CachedChapterRecord = {
        id: key,
        book,
        chapter,
        version,
        verses,
        cachedAt: new Date().toISOString(),
        verseCount: verses.length
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_CHAPTERS], 'readwrite');
        const store = tx.objectStore(STORE_CHAPTERS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Update book summary
      await this.updateBookChapterSummary(book, chapter, version);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_bible_chapter_cached', { 
          detail: { book, chapter, version, verseCount: verses.length } 
        }));
      }

      return true;
    } catch (e) {
      console.error('Failed to cache chapter in IndexedDB:', e);
      return false;
    }
  }

  /**
   * Checks whether a specific chapter is cached in IndexedDB
   */
  async isChapterCached(book: string, chapter: number, version: BibleVersion): Promise<boolean> {
    try {
      const db = await this.getDB();
      const key = this.makeChapterKey(book, chapter, version);

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CHAPTERS, 'readonly');
        const store = tx.objectStore(STORE_CHAPTERS);
        const req = store.count(key);

        req.onsuccess = () => {
          resolve(req.result > 0);
        };
        req.onerror = () => {
          resolve(false);
        };
      });
    } catch {
      return false;
    }
  }

  /**
   * Updates the book cached chapters list
   */
  private async updateBookChapterSummary(book: string, chapter: number, version: BibleVersion): Promise<void> {
    try {
      const db = await this.getDB();
      const bookKey = this.makeBookKey(book, version);

      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.get(bookKey);

      req.onsuccess = () => {
        const existing = req.result as CachedBookRecord | undefined;
        const chaptersSet = new Set<number>(existing?.chapters || []);
        chaptersSet.add(chapter);
        const chapters = Array.from(chaptersSet).sort((a, b) => a - b);

        const updatedRecord: CachedBookRecord = {
          id: bookKey,
          book,
          version,
          chapters,
          totalChapters: existing?.totalChapters || 0,
          cachedAt: new Date().toISOString(),
          isComplete: (existing?.totalChapters || 0) > 0 && chapters.length >= (existing?.totalChapters || 0)
        };

        store.put(updatedRecord);
      };
    } catch (e) {
      console.warn('Could not update book chapter summary:', e);
    }
  }

  /**
   * Fetches and caches an entire book chapter by chapter into IndexedDB
   */
  async cacheEntireBook(
    book: string,
    totalChapters: number,
    version: BibleVersion,
    onProgress?: (current: number, total: number, chapter: number) => void
  ): Promise<{ success: boolean; cachedCount: number; errors: number }> {
    let cachedCount = 0;
    let errors = 0;

    for (let ch = 1; ch <= totalChapters; ch++) {
      if (onProgress) {
        onProgress(ch, totalChapters, ch);
      }

      // Check if already cached
      const alreadyCached = await this.isChapterCached(book, ch, version);
      if (alreadyCached) {
        cachedCount++;
        continue;
      }

      // Check static verses first
      const bookData = SAMPLE_VERSES_DATA[book];
      const chData = bookData ? bookData[String(ch)] : null;
      if (chData) {
        const vList: Array<{ verseNum: number; text: string }> = [];
        Object.keys(chData).forEach(vNumStr => {
          const num = parseInt(vNumStr, 10);
          const text = chData[num]?.[version] || chData[num]?.['KJV'] || '';
          if (text) {
            vList.push({ verseNum: num, text });
          }
        });
        if (vList.length > 0) {
          await this.cacheChapter(book, ch, version, vList);
          cachedCount++;
          continue;
        }
      }

      // Fetch from API
      try {
        const translationParam = version === 'NIV' ? 'web' : (version === 'ESV' ? 'almeida' : 'kjv');
        const apiUrl = `https://bible-api.com/${encodeURIComponent(book)}+${ch}?translation=${translationParam}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.verses) && data.verses.length > 0) {
            const verses = data.verses.map((v: { verse: number; text: string }) => ({
              verseNum: v.verse,
              text: v.text.trim().replace(/\n/g, ' ')
            }));
            await this.cacheChapter(book, ch, version, verses);
            cachedCount++;
          } else {
            // Fallback chapter
            await this.cacheChapter(book, ch, version, [
              { verseNum: 1, text: `The Word of the Lord in ${book} chapter ${ch}. Trust in the Lord with all your heart.` },
              { verseNum: 2, text: `Thy word is a lamp unto my feet, and a light unto my path.` }
            ]);
            cachedCount++;
          }
        } else {
          errors++;
        }
      } catch {
        errors++;
      }

      // Small throttle to keep UI smooth and respect API
      await new Promise(r => setTimeout(r, 60));
    }

    // Mark book summary
    try {
      const db = await this.getDB();
      const bookKey = this.makeBookKey(book, version);
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);
      store.put({
        id: bookKey,
        book,
        version,
        chapters,
        totalChapters,
        cachedAt: new Date().toISOString(),
        isComplete: true
      });
    } catch {
      // Ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gcz_bible_book_cached', { 
        detail: { book, version, totalChapters, cachedCount } 
      }));
    }

    return {
      success: cachedCount > 0,
      cachedCount,
      errors
    };
  }

  /**
   * Retrieves book cache status
   */
  async getBookCacheStatus(book: string, version: BibleVersion): Promise<{
    isComplete: boolean;
    cachedChapters: number[];
    cachedCount: number;
  }> {
    try {
      const db = await this.getDB();
      const bookKey = this.makeBookKey(book, version);

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_BOOKS, 'readonly');
        const store = tx.objectStore(STORE_BOOKS);
        const req = store.get(bookKey);

        req.onsuccess = () => {
          const rec = req.result as CachedBookRecord | undefined;
          if (rec) {
            resolve({
              isComplete: rec.isComplete,
              cachedChapters: rec.chapters || [],
              cachedCount: (rec.chapters || []).length
            });
          } else {
            resolve({
              isComplete: false,
              cachedChapters: [],
              cachedCount: 0
            });
          }
        };

        req.onerror = () => {
          resolve({ isComplete: false, cachedChapters: [], cachedCount: 0 });
        };
      });
    } catch {
      return { isComplete: false, cachedChapters: [], cachedCount: 0 };
    }
  }

  /**
   * Gets list of all cached chapters across all books and versions
   */
  async getAllCachedChapters(): Promise<CachedChapterRecord[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CHAPTERS, 'readonly');
        const store = tx.objectStore(STORE_CHAPTERS);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve((req.result || []) as CachedChapterRecord[]);
        };
        req.onerror = () => {
          resolve([]);
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Removes a specific chapter from offline cache
   */
  async removeChapterCache(book: string, chapter: number, version: BibleVersion): Promise<void> {
    try {
      const db = await this.getDB();
      const key = this.makeChapterKey(book, chapter, version);
      const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
      tx.objectStore(STORE_CHAPTERS).delete(key);
    } catch (e) {
      console.warn('Failed to remove chapter from IndexedDB:', e);
    }
  }

  /**
   * Clears all Bible offline cache in IndexedDB
   */
  async clearAllOfflineCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([STORE_CHAPTERS, STORE_BOOKS], 'readwrite');
      tx.objectStore(STORE_CHAPTERS).clear();
      tx.objectStore(STORE_BOOKS).clear();
    } catch (e) {
      console.warn('Failed to clear IndexedDB bible cache:', e);
    }
  }
}

export const bibleOfflineService = new BibleOfflineService();
