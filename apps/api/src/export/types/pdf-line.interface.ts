/*
 * One block of text in journal.pdf, already in words the PDF's font can
 * draw. What each kind looks like is decided where the PDF is drawn.
 */
export interface PdfLine {
  kind: 'title' | 'note' | 'day' | 'mood' | 'time' | 'words';
  text: string;
}
