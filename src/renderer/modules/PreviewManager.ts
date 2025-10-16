import type { EditorManager } from "./EditorManager";
import { MarkdownManager } from "./markdown/MarkdownManager";

export class PreviewManager {
  private static instance: PreviewManager | null = null;
  private container: HTMLElement;
  private partner: EditorManager | null = null;
  private markdownManager: MarkdownManager;
  private isScrollSyncing: boolean = false;

  private constructor(container: HTMLElement) {
    this.container = container;
    this.markdownManager = MarkdownManager.getInstance();

    // listeners
    this.container.addEventListener("scroll", () => {
      if (this.isScrollSyncing) {
        return;
      }
      if (!this.partner) {
        return;
      }

      this.isScrollSyncing = true;

      const scrollTop = this.container.scrollTop;
      const ratio =
        scrollTop / (this.container.scrollHeight - this.container.clientHeight);
      this.partner.syncScroll(ratio);

      this.isScrollSyncing = false;
    });
  }

  public static getInstance(container: HTMLElement): PreviewManager {
    if (!PreviewManager.instance) {
      PreviewManager.instance = new PreviewManager(container);
    }
    return PreviewManager.instance;
  }

  // setters
  public setPartner(partner: EditorManager): void {
    this.partner = partner;
  }

  /**
   * Mueve el scroll del preview de acuerdo al ratio pasado por parámetro
   *
   * @param ratio
   */
  public syncScroll(ratio: number): void {
    this.isScrollSyncing = true;

    const target =
      ratio * (this.container.scrollHeight - this.container.clientHeight);
    this.container.scrollTop = target;

    this.isScrollSyncing = false;
  }

  /**
   * Actualiza la preview en el contenedor renderizando los bloques de matemática en base al contenido pasado por parámetro
   *
   * @param value
   */
  public updatePreview(value: string): void {
    this.container.innerHTML =
      this.markdownManager.markdownToHTMLwithMath(value);
  }
}
