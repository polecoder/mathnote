import * as monaco from "monaco-editor";
import type { PreviewManager } from "./PreviewManager";

export class EditorManager {
  private static instance: EditorManager | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private partner: PreviewManager | null = null;
  private isScrollSyncing: boolean = false;
  private models: Map<string, monaco.editor.ITextModel> = new Map();
  private activeModelUri: string | null = null;

  private constructor(container: HTMLElement) {
    this.editor = monaco.editor.create(container, {
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
  // getters
  public getEditor(): monaco.editor.IStandaloneCodeEditor {
    return this.editor;
  }
  public getActiveModelUri(): string | null {
    return this.activeModelUri;
  }

  // setters
  public setPartner(partner: PreviewManager): void {
    this.partner = partner;
  }

  /**
   * Sincroniza el desplazamiento del editor con el del preview.
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

  /**
   * Crea un modelo para una pestaña del editor y lo registra.
   * Si el modelo ya existe, no lo crea nuevamente y lo devuelve.
   * @param uriString La URI del modelo.
   * @param content El contenido del modelo.
   * @returns El modelo creado.
   */
  public createModel(
    uriString: string,
    content: string
  ): monaco.editor.ITextModel {
    const uri = monaco.Uri.parse(uriString);
    let model = this.models.get(uriString);
    if (!model) {
      model = monaco.editor.createModel(content, "markdown", uri);
      this.models.set(uriString, model);
    }
    return model;
  }

  /**
   * Cambia el modelo activo en el editor renderizando su contenido también en el preview.
   * Si el modelo no existe, no hace nada.
   * @param uriString La URI del modelo a activar.
   * @returns void
   */
  public switchToModel(uriString: string): void {
    const model = this.models.get(uriString);
    if (!model) return;
    this.activeModelUri = uriString;
    this.editor.setModel(model);
    // update preview
    this.partner?.updatePreview(this.editor.getValue());
  }

  /**
   * Elimina el modelo pasado por parámetro.
   * Si el modelo no existe, no hace nada.
   * @param uriString La URI del modelo a eliminar.
   * @returns void
   */
  public disposeModel(uriString: string) {
    const model = this.models.get(uriString);
    if (!model) return;
    model.dispose();
    this.models.delete(uriString);
    if (this.activeModelUri === uriString) {
      this.activeModelUri = null;
    }
  }

  /**
   * Guarda el modelo en la ruta especificada.
   * @param uriString La URI del modelo a guardar.
   * @param filePath La ruta del archivo donde se guardará el modelo.
   * @returns Un objeto que indica si la operación fue exitosa y un posible mensaje de error.
   */
  public async saveModelToPath(uriString: string, filePath?: string | null) {
    const model = this.models.get(uriString);
    if (!model) return { ok: false, error: "no_model" };
    const content = model.getValue();
    if (!filePath) return { ok: false, error: "no_path" };
    const res = await window.api.saveFile(filePath, content);
    return res;
  }
}
