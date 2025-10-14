import * as monaco from "monaco-editor";
import type { PreviewManager } from "./PreviewManager";

export class EditorManager {
  private static instance: EditorManager | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private partner: PreviewManager | null = null;
  private isScrollSyncing: boolean = false;
  private currentFilePath: string | null = null;
  private isDirty: boolean = false;

  private constructor(container: HTMLElement) {
    this.editor = monaco.editor.create(container, {
      value: "# Markdown Editor",
      language: "markdown",
      theme: "vs-dark",
      wordWrap: "on",
      scrollBeyondLastLine: false,
    });

    // listeners
    this.editor.onDidScrollChange((e) => {
      if (this.isScrollSyncing) {
        return;
      }
      if (!this.partner) {
        return;
      }

      this.isScrollSyncing = true;

      const scrollTop = e.scrollTop;
      const scrollHeight = this.editor.getScrollHeight();
      const clientHeight = this.editor.getDomNode()?.clientHeight ?? 1;
      const ratio = scrollTop / (scrollHeight - clientHeight);

      this.partner.syncScroll(ratio);
      this.isScrollSyncing = false;
    });

    this.editor.onDidChangeModelContent(() => {
      this.isDirty = true;
    });
  }

  public static getInstance(container: HTMLElement): EditorManager {
    if (!EditorManager.instance) {
      EditorManager.instance = new EditorManager(container);
    }
    return EditorManager.instance;
  }
  // getters
  public getEditor(): monaco.editor.IStandaloneCodeEditor {
    return this.editor;
  }
  public getCurrentFilePath(): string | null {
    return this.currentFilePath;
  }
  public isModified(): boolean {
    return this.isDirty;
  }
  // setters
  public setCurrentFilePath(path: string): void {
    this.currentFilePath = path;
  }
  public setPartner(partner: PreviewManager): void {
    this.partner = partner;
  }

  /**
   * Carga el editor con el contenido y path pasados por parámetro.
   * Resetea el flag de "dirty" a false y mueve el scroll al inicio.
   * @param path
   * @param content
   */
  public loadFromPath(path: string, content: string): void {
    this.currentFilePath = path;
    const model = this.editor.getModel();
    if (model) {
      model.setValue(content);
    }
    this.isDirty = false;
    this.editor.setScrollTop(0);
  }

  /**
   * Guarda el contenido actual del editor en el path actual (currentFilePath).
   * Resetea el flag de "dirty" a false.
   *
   * @returns Promise<{ ok: boolean; error?: string }>
   */
  public async saveToCurrentPath(): Promise<{ ok: boolean; error?: string }> {
    if (!this.currentFilePath) {
      return { ok: false, error: "no_path" };
    }

    const res = await window.api.saveFile(
      this.currentFilePath,
      this.editor.getValue()
    );
    if (res.ok) {
      this.isDirty = false;
      return { ok: true };
    }
    return { ok: false, error: res.error ?? "unknown" };
  }

  /**
   * Mueve el scroll del editor de acuerdo al ratio pasado por parámetro
   *
   * @param ratio
   */
  public syncScroll(ratio: number): void {
    this.isScrollSyncing = true;

    const scrollHeight = this.editor.getScrollHeight();
    const clientHeight = this.editor.getDomNode()?.clientHeight ?? 1;
    const target = ratio * (scrollHeight - clientHeight);
    this.editor.setScrollTop(target);

    this.isScrollSyncing = false;
  }
}
