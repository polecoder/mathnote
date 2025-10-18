import { Tab } from "../models/Tab";
import { confirmModal } from "../ui/ConfirmModal";

/** URI usada para el modelo "Welcome" */
export const WELCOME_MODEL_URI = `inmemory://model/welcome`;

/**
 * Firma para los listeners que se suscriben a cambios en la lista de pestañas.
 * Reciben la lista completa (copia) y el id de la pestaña activa (o null si no hay ninguna).
 */
type TabListener = (tabs: Tab[], activeId: string | null) => void;

/**
 * TabManager es un singleton responsable de mantener el estado de las pestañas abiertas en el editor: crear, cerrar, cambiar, y marcar dirty.
 *
 * Diseño:
 * - Mantiene un arreglo privado `tabs` con la metadata mínima por pestaña.
 * - `activeId` contiene la pestaña actualmente activa.
 * - Permite suscribirse a cambios con `onChange(fn)` para que la UI se re-renderice.
 *
 * Notas de comportamiento:
 * - `openTab` evita abrir duplicados cuando se proporciona una `path` (activa la existente).
 * - `closeTab` elimina la pestaña y, si cerramos la activa, activa la última pestaña disponible.
 */
export class TabManager {
  private static instance: TabManager | null = null;
  private tabs: Tab[] = [];
  private activeId: string | null = null;
  private listeners: TabListener[] = [];
  private idCounter: number = 1;

  private constructor() {}

  /**
   * Devuelve la instancia única del TabManager (singleton).
   */
  public static getInstance(): TabManager {
    if (!TabManager.instance) {
      TabManager.instance = new TabManager();
    }
    return TabManager.instance;
  }

  /**
   * Registra un listener que será invocado cada vez que cambie la lista de pestañas o la pestaña activa. El listener recibe una copia de la lista y el id activo.
   */
  public onChange(fn: TabListener) {
    this.listeners.push(fn);
  }

  /**
   * Notifica a todos los listeners con la lista actual de pestañas y la activa.
   * Método privado usado internamente tras cualquier mutación en cualquiera de las pestañas.
   */
  private emit(): void {
    for (const l of this.listeners) {
      l(this.tabs.slice(), this.activeId);
    }
  }

  /**
   * Abre una nueva pestaña.
   * Si se proporciona `path` y ya existe una pestaña con esa ruta, activa la pestaña existente
   * y devuelve su id. En caso contrario crea una nueva entrada y la activa.
   *
   * @param name nombre a mostrar
   * @param modelUri URI del modelo de Monaco asociado (string)
   * @param path ruta en disco (opcional)
   * @returns id de la pestaña activa (nueva o existente)
   */
  public openTab(
    name: string,
    modelUri: string,
    path?: string | null
  ): string | null {
    // avoid duplicate by modelUri
    const existingByModel = this.tabs.find((t) => t.getModelUri() === modelUri);
    if (existingByModel) {
      this.activeId = existingByModel.getId();
      this.emit();
      return existingByModel.getId();
    }
    // avoid duplicates by path
    if (path) {
      const existingByPath = this.tabs.find((t) => t.getPath() === path);
      if (existingByPath) {
        this.activeId = existingByPath.getId();
        this.emit();
        return existingByPath.getId();
      }
    }

    const id = `tab-${this.idCounter++}`; // también incrementa el contador para el próximo id
    const tab = new Tab(id, name, modelUri, path ?? null);
    this.tabs.push(tab);
    this.activeId = id;
    this.emit();
    return id;
  }

  /**
   * Intenta cerrar la pestaña identificada por `id`.
   * Comportamiento:
   * - Si la pestaña no existe, no hace nada.
   * - Si la pestaña está dirty, pide confirmación antes de cerrar.
   * - No permite cerrar la pestaña "Welcome" si es la única abierta.
   * Si la pestaña cerrada era la activa, activa la última pestaña restante (comportamiento LIFO).
   */
  public async closeTab(id: string): Promise<void> {
    const idx = this.tabs.findIndex((t) => t.getId() === id);
    if (idx === -1) return;
    // no permitir cerrar pestañas sin guardar
    if (this.tabs[idx].isTabDirty()) {
      const confirmed = await confirmModal(
        "This tab has unsaved changes. Close anyway?"
      );

      if (!confirmed) return;
    }

    // no permitir cerrar welcome si es la única pestaña
    if (
      this.tabs[idx].getModelUri() === WELCOME_MODEL_URI &&
      this.tabs.length === 1
    ) {
      return;
    }
    this.tabs.splice(idx, 1);

    if (this.activeId === id) {
      this.activeId =
        this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].getId() : null;
    }
    this.emit();
  }

  /**
   * Marca la pestaña de identificada por `id` como dirty/clean. Esto se refleja al emitir el cambio con la función emit().
   *
   * @param id El id de la pestaña a marcar.
   * @param dirty true para marcar como dirty, false para clean.
   */
  public setDirty(id: string, dirty: boolean): void {
    const t = this.tabs.find((x) => x.getId() === id);
    if (!t) return;
    t.setDirty(dirty);
    this.emit();
  }

  /**
   * Cambia la pestaña activa a la indicada por id. Si no existe la pestaña, no hace nada.
   *
   * @param id El id de la pestaña a activar.
   */
  public switchTo(id: string) {
    if (!this.tabs.find((t) => t.getId() === id)) return;
    this.activeId = id;
    this.emit();
  }

  /**
   * Devuelve la pestaña activa (si la hay) o null en caso contrario.
   */
  public getActive(): Tab | null {
    return this.tabs.find((t) => t.getId() === this.activeId) ?? null;
  }

  /**
   * Devuelve una copia de la lista de pestañas abiertas.
   */
  public list(): Tab[] {
    return this.tabs.slice();
  }
}
