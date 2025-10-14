import type { EditorManager } from "./EditorManager";
import type { PreviewManager } from "./PreviewManager";
import { buildFileTree } from "../utils/treeBuilder";
import { renderTreeNode } from "../utils/treeRenderer";
import { loadFileIntoEditor } from "../utils/fileLoader";

/**
 * Administrador de la barra lateral de exploración de archivos.
 * Gestiona la visualización del árbol de archivos y la interacción con el sistema de archivos.
 * Implementa el patrón Singleton para garantizar una única instancia.
 *
 * @example
 * ```typescript
 * const sidebar = SidebarManager.getInstance(sidebarElement);
 * sidebar.setPartners(editorManager, previewManager);
 * await sidebar.openFolder();
 * ```
 */
export class SidebarManager {
  private static instance: SidebarManager | null = null;
  private container: HTMLElement;
  private currentFolderPath: string | null = null;
  private fileEntries: FileEntry[] = [];
  private editorManager: EditorManager | null = null;
  private previewManager: PreviewManager | null = null;

  private constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  /**
   * Obtiene la instancia única de SidebarManager (patrón Singleton).
   *
   * @param container - Elemento HTML contenedor de la barra lateral
   * @returns Instancia única de SidebarManager
   */
  public static getInstance(container: HTMLElement): SidebarManager {
    if (!SidebarManager.instance) {
      SidebarManager.instance = new SidebarManager(container);
    }
    return SidebarManager.instance;
  }

  /**
   * Establece las referencias a los administradores del editor y preview.
   * Estos son necesarios para cargar archivos cuando el usuario hace click en ellos.
   *
   * @param editorManager - Instancia del administrador del editor
   * @param previewManager - Instancia del administrador del preview
   */
  public setPartners(
    editorManager: EditorManager,
    previewManager: PreviewManager
  ): void {
    this.editorManager = editorManager;
    this.previewManager = previewManager;
  }

  /**
   * Abre un diálogo para seleccionar una carpeta y muestra su contenido.
   * Escanea recursivamente todos los archivos Markdown e imágenes.
   *
   * @returns Promise que se resuelve cuando la carpeta se ha cargado y renderizado
   */
  public async openFolder(): Promise<void> {
    const result = await window.api.openFolder();
    if (!result.ok) {
      return;
    }

    this.currentFolderPath = result.path;
    const contentsResult = await window.api.readFolderContents(result.path);

    if (!contentsResult.ok) {
      alert("Error al leer el contenido de la carpeta: " + contentsResult.error);
      return;
    }

    this.fileEntries = contentsResult.entries;
    this.render();
  }

  /**
   * Renderiza la estructura de archivos en la barra lateral.
   * Si no hay carpeta abierta, muestra un mensaje vacío.
   */
  private render(): void {
    this.container.innerHTML = "";

    if (!this.currentFolderPath || this.fileEntries.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.renderFileTree();
  }

  /**
   * Renderiza el mensaje de estado vacío cuando no hay carpeta abierta.
   */
  private renderEmptyState(): void {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "sidebar-empty";
    emptyMessage.textContent = "No folder opened";
    this.container.appendChild(emptyMessage);
  }

  /**
   * Renderiza el árbol de archivos en la barra lateral.
   * Construye el árbol desde las entradas planas y lo visualiza.
   */
  private renderFileTree(): void {
    const tree = buildFileTree(this.fileEntries);
    const treeElement = renderTreeNode(tree, 0, (filePath) => {
      void this.handleFileClick(filePath);
    });
    this.container.appendChild(treeElement);
  }

  /**
   * Maneja el evento de click en un archivo Markdown.
   * Carga el archivo en el editor y actualiza el preview.
   *
   * @param filePath - Ruta absoluta del archivo a abrir
   */
  private async handleFileClick(filePath: string): Promise<void> {
    if (!this.editorManager || !this.previewManager) {
      return;
    }

    await loadFileIntoEditor(filePath, this.editorManager, this.previewManager);
  }
}
