import { Tab } from "../models/Tab";
import { TabManager, WELCOME_MODEL_URI } from "../modules/TabManager";

/**
 * Renderiza la barra de pestañas en el contenedor proporcionado y enlaza
 * los eventos de click/close con el TabManager.
 *
 * @param container Elemento HTML donde renderizar la barra de pestañas.
 * @param tabManager Instancia del TabManager para gestionar las pestañas.
 */
export function renderTabsView(
  container: HTMLElement,
  tabManager: TabManager
): void {
  if (!container) return;

  /**
   * Escucha los cambios en las pestañas y actualiza la UI en caso de que o:
   * - Cambie la lista de pestañas (abrir/cerrar)
   * - Cambie la pestaña activa
   */
  tabManager.onChange((tabs: Tab[], activeId: string | null) => {
    container.innerHTML = "";
    for (const t of tabs) {
      const div = document.createElement("div");
      div.className = `tab ${t.getId() === activeId ? "active" : ""} ${
        t.isTabDirty() ? "dirty" : ""
      }`;
      div.dataset.id = t.getId();

      const icon = document.createElement("img");
      icon.className = "icon";
      icon.alt = "file";
      icon.src = "./resources/images/markdown-logo.svg";

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = t.getName();

      const close = document.createElement("img");
      close.className = "close-icon";
      close.alt = "close";
      close.src = "./resources/images/cross.svg";

      div.appendChild(icon);
      div.appendChild(name);
      div.appendChild(close);

      div.addEventListener("click", () => {
        tabManager.switchTo(t.getId());
      });
      // disable close for welcome if it's the only tab (UI hint)
      if (t.getModelUri() === WELCOME_MODEL_URI && tabs.length === 1) {
        close.style.opacity = "0.4";
      } else {
        close.addEventListener("click", (e: MouseEvent) => {
          e.stopPropagation();
          tabManager.closeTab(t.getId());
        });
      }

      container.appendChild(div);
    }
  });
}
