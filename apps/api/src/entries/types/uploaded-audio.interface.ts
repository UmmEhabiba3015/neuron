/*
 * The one file of a voice memo's form, as multer hands it over: held in
 * memory, never on disk, until AudioStorage writes it. Only what the API
 * reads is named. The file's own name is never read.
 */
export interface UploadedAudio {
  buffer: Buffer;
  mimetype: string;
  size: number;
}
