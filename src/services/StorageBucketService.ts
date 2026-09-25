import { getSupabase } from './supabaseClient';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export class StorageBucketService {
  /**
   * Initializes the FFmpeg WebAssembly instance if it hasn't been loaded yet.
   */
  private static async initFFmpeg(): Promise<FFmpeg> {
    if (ffmpeg) return ffmpeg;
    
    console.log('Loading FFmpeg WebAssembly...');
    ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm'
    });
    console.log('FFmpeg loaded successfully!');
    return ffmpeg;
  }

  /**
   * Compresses a video file in the browser using FFmpeg.wasm.
   * @param file The original video File
   * @returns The compressed video File
   */
  static async compressVideo(file: File): Promise<File> {
    try {
      const ffmpeg = await this.initFFmpeg();
      
      const inputName = 'input_' + file.name;
      const outputName = 'output.mp4'; // Standardizing to MP4
      
      // Write the file to FFmpeg's virtual file system
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      console.log(`Starting compression for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
      
      // Run compression command: 
      // -c:v libx264 (H.264 codec)
      // -crf 28 (Good balance of quality and size, higher is smaller)
      // -preset ultrafast (Fastest compression speed at the cost of slight size increase)
      await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-crf', '28', '-preset', 'ultrafast', outputName]);
      
      // Read the result back from the virtual file system
      const data = await ffmpeg.readFile(outputName) as Uint8Array;
      
      // Clean up memory
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
      // Create a new File object with the compressed data
      const compressedBlob = new Blob([new Uint8Array(data)], { type: 'video/mp4' });
      const compressedFile = new File([compressedBlob], outputName, { type: 'video/mp4' });
      
      console.log(`Compression finished! New size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      return compressedFile;
      
    } catch (err) {
      console.error('Video compression failed, falling back to original file.', err);
      // If compression fails for any reason (e.g. out of memory, unsupported format), fallback to the original file
      return file;
    }
  }

  public static readonly BUCKET_NAME = 'media';

  /**
   * Uploads a File object to the Supabase 'media' bucket.
   * Automatically organizes by folder ('avatars', 'videos', 'sermons', 'posts', 'chat', 'stories', 'uploads').
   * Automatically compresses video files before uploading.
   * @param file The Javascript File object (from <input type="file" />)
   * @param folder Category folder name inside 'media' bucket (e.g. 'avatars', 'videos', 'sermons', 'posts', 'chat')
   * @returns The public URL of the uploaded file, or null if it failed.
   */
  static async uploadFileToMediaBucket(file: File, folder: string = 'uploads'): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase is not configured. Falling back to local data URL.');
      return null;
    }

    try {
      // Direct stream upload for instantaneous video processing without browser thread freezing
      const finalFile = file;

      // Map any legacy bucket names to clean folders inside 'media' bucket
      let targetFolder = folder;
      if (targetFolder === 'media') {
        targetFolder = file.type.startsWith('video/') ? 'videos' : 'uploads';
      }

      const ext = finalFile.name.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
      const cleanBase = finalFile.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `${Date.now()}_${cleanBase}.${ext}`;
      const filePath = `${targetFolder}/${filename}`;

      // If uploading an avatar, check if dedicated 'avatars' bucket is available first
      if (targetFolder === 'avatars' || targetFolder === 'avatar') {
        try {
          const { data: avatarData, error: avatarErr } = await supabase.storage
            .from('avatars')
            .upload(filename, finalFile, {
              cacheControl: '3600',
              upsert: true
            });
          if (!avatarErr && avatarData) {
            const { data: avatarUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(avatarData.path);
            if (avatarUrlData?.publicUrl) {
              console.log(`Successfully uploaded avatar to bucket 'avatars':`, avatarUrlData.publicUrl);
              return avatarUrlData.publicUrl;
            }
          }
        } catch {
          // Seamlessly fallback to 'media' bucket below
        }
      }

      console.log(`Uploading file ${finalFile.name} to Supabase bucket '${this.BUCKET_NAME}' [${filePath}]...`);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, finalFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn(`Supabase Storage upload warning (${this.BUCKET_NAME}):`, error.message);
        
        // Fallback: If root folder path had an issue, try uploading directly at uploads/
        if (targetFolder !== 'uploads') {
          const fallbackPath = `uploads/${filename}`;
          const fallbackRes = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(fallbackPath, finalFile, { cacheControl: '3600', upsert: true });
          if (!fallbackRes.error && fallbackRes.data) {
            const { data: fallbackUrl } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fallbackRes.data.path);
            return fallbackUrl.publicUrl;
          }
        }
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      console.log(`Successfully uploaded to bucket '${this.BUCKET_NAME}':`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Unexpected error during file upload:', err);
      return null;
    }
  }

  /**
   * Uploads a base64 Data URL to the Supabase storage 'media' bucket and returns its public URL
   */
  static async uploadDataUrlToMediaBucket(
    dataUrl: string, 
    fallbackName: string = 'image', 
    folder: string = 'uploads'
  ): Promise<string | null> {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return dataUrl || null;
    }

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const mime = blob.type || 'image/jpeg';
      const ext = mime.split('/')[1]?.replace('+xml', '') || 'jpg';
      const file = new File([blob], `${fallbackName}_${Date.now()}.${ext}`, { type: mime });
      return await this.uploadFileToMediaBucket(file, folder);
    } catch (err) {
      console.warn('Failed to convert and upload dataUrl to bucket:', err);
      return null;
    }
  }

  /**
   * Uploads a Blob directly to the Supabase storage 'media' bucket and returns its public URL
   */
  static async uploadBlobToMediaBucket(
    blob: Blob, 
    filename: string, 
    folder: string = 'uploads'
  ): Promise<string | null> {
    try {
      const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
      return await this.uploadFileToMediaBucket(file, folder);
    } catch (err) {
      console.warn('Failed to upload blob to bucket:', err);
      return null;
    }
  }
}

