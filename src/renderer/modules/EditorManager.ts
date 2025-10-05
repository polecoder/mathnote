import * as monaco from "monaco-editor";
import type { PreviewManager } from "./PreviewManager";

export class EditorManager {
  private static instance: EditorManager | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private partner: PreviewManager | null = null;
  private isScrollSyncing: boolean = false;

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
  }

  public static getInstance(container: HTMLElement): EditorManager {
    if (!EditorManager.instance) {
      EditorManager.instance = new EditorManager(container);
    }
    return EditorManager.instance;
  }

  public getEditor(): monaco.editor.IStandaloneCodeEditor {
    return this.editor;
  }

  public setPartner(partner: PreviewManager): void {
    this.partner = partner;
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
