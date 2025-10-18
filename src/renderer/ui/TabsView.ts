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
      // eslint-disable-next-line no-console
      console.debug(
        "TabsView: rendering tab",
        t.getId(),
        "dirty=",
        t.isTabDirty()
      );
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

      const status = document.createElement("img");
      status.className = "status-icon";
      status.alt = "close";
      status.src = "./resources/images/cross.svg";

      div.appendChild(icon);
      div.appendChild(name);
      div.appendChild(status);

      div.addEventListener("click", () => {
        tabManager.switchTo(t.getId());
      });
      // mostrar indicador de dirty o close según estado
      if (t.isTabDirty()) {
        status.src = "./resources/images/circle.svg";
        status.classList.add("dirty-icon");
        status.addEventListener("click", async (e: MouseEvent) => {
          e.stopPropagation();
          tabManager.closeTab(t.getId());
        });
      } else {
        status.src = "./resources/images/cross.svg";
        status.classList.remove("dirty-icon");
        // deshabilitar cierre de welcome si es la única
        if (t.getModelUri() === WELCOME_MODEL_URI && tabs.length === 1) {
          status.style.opacity = "0.4";
        } else {
          status.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
            tabManager.closeTab(t.getId());
          });
        }
      }

      container.appendChild(div);
    }
  });
}
