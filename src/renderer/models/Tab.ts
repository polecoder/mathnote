/**
 * Representa una pestaña que contiene un archivo abierto en el editor.
 * - `id`: identificador único de la pestaña.
 * - `name`: nombre de la pestaña.
 * - `modelUri`: URI del modelo asociado a la pestaña.
 * - `path`: ruta del archivo en el sistema de archivos. Puede ser null para archivos no guardados.
 * - `isDirty`: indica si la pestaña tiene cambios no guardados.
 */
export class Tab {
  private id: string;
  private name: string;
  private path: string | null = null;
  private isDirty: boolean;
  private modelUri: string;

  constructor(id: string, name: string, modelUri: string, path: string | null) {
    this.id = id;
    this.name = name;
    this.modelUri = modelUri;
    this.path = path;
    this.isDirty = false;
  }

  // getters
  public getId(): string {
    return this.id;
  }
  public getName(): string {
    return this.name;
  }
  public getPath(): string | null {
    return this.path;
  }
  public isTabDirty(): boolean {
    return this.isDirty;
  }
  public getModelUri(): string {
    return this.modelUri;
  }

  // setters
  public setName(name: string): void {
    this.name = name;
  }
  public setPath(path: string | null): void {
    this.path = path;
  }
  public setDirty(dirty: boolean): void {
    this.isDirty = dirty;
  }
  public setModelUri(uri: string): void {
    this.modelUri = uri;
  }
}
