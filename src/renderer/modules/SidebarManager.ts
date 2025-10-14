import type { EditorManager } from "./EditorManager";
import type { PreviewManager } from "./PreviewManager";

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

  public static getInstance(container: HTMLElement): SidebarManager {
    if (!SidebarManager.instance) {
      SidebarManager.instance = new SidebarManager(container);
    }
    return SidebarManager.instance;
  }

  public setPartners(
    editorManager: EditorManager,
    previewManager: PreviewManager
  ): void {
    this.editorManager = editorManager;
    this.previewManager = previewManager;
  }

  /**
   * Abre una carpeta y muestra su contenido
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
   * Renderiza la estructura de archivos en la barra lateral
   */
  private render(): void {
    this.container.innerHTML = "";

    if (!this.currentFolderPath || this.fileEntries.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "sidebar-empty";
      emptyMessage.textContent = "No folder opened";
      this.container.appendChild(emptyMessage);
      return;
    }

    // Organizar archivos en una estructura de árbol
    const tree = this.buildTree(this.fileEntries);
    const treeElement = this.renderTree(tree);
    this.container.appendChild(treeElement);
  }

  /**
   * Construye un árbol de archivos desde una lista plana
   */
  private buildTree(entries: FileEntry[]): TreeNode {
    const root: TreeNode = {
      name: "",
      path: "",
      type: "directory",
      children: [],
    };

    // Ordenar entries: directorios primero, luego archivos alfabéticamente
    const sortedEntries = [...entries].sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") {
        return -1;
      }
      if (a.type !== "directory" && b.type === "directory") {
        return 1;
      }
      return a.relativePath.localeCompare(b.relativePath);
    });

    for (const entry of sortedEntries) {
      const parts = entry.relativePath.split(/[\\/]/);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
          // Es un archivo o directorio final
          if (!current.children) {
            current.children = [];
          }
          current.children.push({
            name: entry.name,
            path: entry.path,
            type: entry.type,
            children: entry.type === "directory" ? [] : undefined,
          });
        } else {
          // Es una carpeta intermedia
          if (!current.children) {
            current.children = [];
          }
          let existing = current.children.find(
            (child) => child.name === part && child.type === "directory"
          );
          if (!existing) {
            existing = {
              name: part,
              path: "",
              type: "directory",
              children: [],
            };
            current.children.push(existing);
          }
          current = existing;
        }
      }
    }

    return root;
  }

  /**
   * Renderiza un nodo del árbol como HTML
   */
  private renderTree(node: TreeNode, level: number = 0): HTMLElement {
    const container = document.createElement("div");
    container.className = "tree-container";

    if (node.children) {
      for (const child of node.children) {
        const item = document.createElement("div");
        item.className = "tree-item";
        item.style.paddingLeft = `${level * 12}px`;

        if (child.type === "directory") {
          const icon = document.createElement("span");
          icon.className = "tree-icon";
          icon.textContent = "📁 ";
          item.appendChild(icon);

          const label = document.createElement("span");
          label.className = "tree-label";
          label.textContent = child.name;
          item.appendChild(label);

          container.appendChild(item);

          // Renderizar hijos
          if (child.children && child.children.length > 0) {
            const subTree = this.renderTree(child, level + 1);
            container.appendChild(subTree);
          }
        } else if (child.type === "markdown") {
          const icon = document.createElement("span");
          icon.className = "tree-icon";
          icon.textContent = "📄 ";
          item.appendChild(icon);

          const label = document.createElement("span");
          label.className = "tree-label tree-label-clickable";
          label.textContent = child.name;
          item.appendChild(label);

          // Agregar evento de click para abrir el archivo
          item.addEventListener("click", () => {
            void this.openFile(child.path);
          });

          container.appendChild(item);
        } else if (child.type === "image") {
          const icon = document.createElement("span");
          icon.className = "tree-icon";
          icon.textContent = "🖼️ ";
          item.appendChild(icon);

          const label = document.createElement("span");
          label.className = "tree-label";
          label.textContent = child.name;
          item.appendChild(label);

          container.appendChild(item);
        }
      }
    }

    return container;
  }

  /**
   * Abre un archivo y carga su contenido en el editor
   */
  private async openFile(filePath: string): Promise<void> {
    if (!this.editorManager || !this.previewManager) {
      return;
    }

    const result = await window.api.readFile(filePath);
    if (!result.ok) {
      if (result.error === "file_too_large") {
        alert(
          "El archivo es demasiado grande (máx 2 MB). Cambia a uno más pequeño."
        );
      } else {
        alert("Error al leer el archivo: " + result.error);
      }
      return;
    }

    this.editorManager.loadFromPath(filePath, result.content);
    this.previewManager.updatePreview(this.editorManager.getEditor().getValue());
  }
}

interface TreeNode {
  name: string;
  path: string;
  type: "directory" | "markdown" | "image";
  children?: TreeNode[];
}
