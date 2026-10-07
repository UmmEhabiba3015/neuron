export interface Controller { destroy(): void }
export interface ComposerController extends Controller {
  focus(): void;
  reset(): void;
  setBusy(busy: boolean): void;
  sync(): void;
}
export interface ChoiceController extends Controller { select(value: string): void }
export interface NavigationController extends Controller { setCurrent(href: string): void }
export interface DialogController extends Controller {
  open(trigger?: Element | null): void;
  close(reason?: string): void;
}
export interface ComposerOptions {
  onSave?(entry: { value: string; excluded: boolean }): boolean | void | Promise<boolean | void>;
  onRecord?(): void;
  onMemoryChange?(excluded: boolean): void;
  savingMessage?: string;
  savedMessage?: string;
  errorMessage?: string;
}
export function createComposer(root: HTMLElement, options?: ComposerOptions): ComposerController;
export function createMoodChoice(root: HTMLElement, options?: { onChange?(value: string): void }): ChoiceController;
export function createTimelineView(root: HTMLElement, options?: { initialView?: string; onChange?(value: string): void }): ChoiceController;
export function createCalendarIndex(root: HTMLElement, options?: { onSelect?(date: string, target: Element | null): void }): ChoiceController;
export function createAudioControl(root: HTMLElement, options: { audio?: HTMLAudioElement; src?: string }): Controller & { audio: HTMLAudioElement };
export function createNavigation(root: HTMLElement, options?: { navigate?(href: string, options: { replace: false }): void }): NavigationController;
export function createBackControl(root: HTMLElement, options?: { onBack?(): void }): Controller;
export function createDialog(root: HTMLElement, options?: { onConfirm?(): void; onClose?(reason: string): void }): DialogController;
export function mountJournalComponents(root?: ParentNode, options?: Record<string, unknown>): { controllers: Controller[]; destroy(): void };

