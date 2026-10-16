/* A voice memo's audio: its bytes, and the MIME type it was recorded in. */
export interface AudioRecording {
  bytes: Buffer;
  type: string;
}
