import type { TreeNode } from "./treeBuilder";

/**
 * Renderiza un nodo del árbol de archivos como elementos HTML DOM.
 * Crea una representación visual del árbol con iconos y eventos de click.
 *
 * @param node - Nodo del árbol a renderizar
 * @param level - Nivel de indentación (0 para la raíz)
 * @param onFileClick - Callback que se ejecuta cuando se hace click en un archivo
 * @returns Elemento HTML div con el árbol renderizado
 *
 * @example
 * ```typescript
 * const tree = buildFileTree(entries);
 * const element = renderTreeNode(tree, 0, (path) => console.log(path));
 * container.appendChild(element);
 * ```
 */
export function renderTreeNode(
  node: TreeNode,
  level: number,
  onFileClick: (filePath: string) => void
): HTMLElement {
  const container = document.createElement("div");
  container.className = "tree-container";

  // Si el nodo no tiene hijos, retornar contenedor vacío
  if (!node.children) {
    return container;
  }

  // Renderizar cada hijo
  for (const child of node.children) {
    const childElement = createTreeItem(child, level, onFileClick);
    container.appendChild(childElement);

    // Si el hijo es un directorio con hijos, renderizar recursivamente
    if (child.type === "directory" && child.children && child.children.length > 0) {
      const subTree = renderTreeNode(child, level + 1, onFileClick);
      container.appendChild(subTree);
    }
  }

  return container;
}

/**
 * Crea un elemento HTML para un item del árbol (archivo o carpeta).
 *
 * @param node - Nodo del árbol a renderizar
 * @param level - Nivel de indentación
 * @param onFileClick - Callback para clicks en archivos
 * @returns Elemento HTML div representando el item
 */
function createTreeItem(
  node: TreeNode,
  level: number,
  onFileClick: (filePath: string) => void
): HTMLElement {
  const item = document.createElement("div");
  item.className = "tree-item";
  item.style.paddingLeft = `${level * 12}px`;

  // Agregar icono según el tipo
  const icon = createIcon(node.type);
  item.appendChild(icon);

  // Agregar etiqueta con el nombre
  const label = createLabel(node);
  item.appendChild(label);

  // Agregar evento de click si es un archivo Markdown
  if (node.type === "markdown") {
    item.addEventListener("click", () => {
      onFileClick(node.path);
    });
  }

  return item;
}

/**
 * Crea el elemento span con el icono apropiado según el tipo de archivo.
 *
 * @param type - Tipo de archivo/carpeta ("directory", "markdown", o "image")
 * @returns Elemento span con el icono
 */
function createIcon(type: "directory" | "markdown" | "image"): HTMLSpanElement {
  const icon = document.createElement("span");
  icon.className = "tree-icon";

  switch (type) {
    case "directory":
      icon.textContent = "📁 ";
      break;
    case "markdown":
      icon.textContent = "📄 ";
      break;
    case "image":
      icon.textContent = "🖼️ ";
      break;
  }

  return icon;
}

/**
 * Crea el elemento span con la etiqueta del nombre del archivo.
 *
 * @param node - Nodo del árbol
 * @returns Elemento span con el nombre del archivo/carpeta
 */
function createLabel(node: TreeNode): HTMLSpanElement {
  const label = document.createElement("span");
  label.className = "tree-label";

  // Archivos Markdown son clickeables
  if (node.type === "markdown") {
    label.classList.add("tree-label-clickable");
  }

  label.textContent = node.name;

  return label;
}
