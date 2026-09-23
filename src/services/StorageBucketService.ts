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

  /**
   * Uploads a File object to the Supabase 'media' bucket.
   * Automatically compresses video files before uploading.
   * @param file The Javascript File object (from <input type="file" />)
   * @param bucketName Optional bucket name, defaults to 'media'
   * @returns The public URL of the uploaded file, or null if it failed.
   */
    static async uploadFileToMediaBucket(file: File, bucketName: 'media' | 'avatars' = 'media'): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase is not configured. Cannot upload file.');
      return null;
    }

    try {
      let finalFile = file;
      
      if (file.type.startsWith('video/')) {
        finalFile = await this.compressVideo(file);
      }

      const ext = finalFile.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `uploads/${filename}`;

      console.log(`Uploading file ${finalFile.name} to Supabase bucket: ${bucketName}...`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, finalFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`Supabase Upload Error to bucket '${bucketName}':`, error);
        
        // Fallback: If 'media' bucket fails, try 'public' bucket if it exists, or just log clearly.
        // We will just alert the user or log it so they can see the exact reason (e.g. RLS policy or missing bucket).
        alert(`Upload Failed: ${error.message}. Please check if the '${bucketName}' bucket exists and is public in Supabase.`);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Unexpected error during file upload:', err);
      return null;
    }
  }
}

