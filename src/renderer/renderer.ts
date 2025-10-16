import Split from "split.js";
import { EditorManager } from "./modules/EditorManager";
import { PreviewManager } from "./modules/PreviewManager";
import { TabManager } from "./modules/TabManager";
import { renderTabsView } from "./ui/TabsView";
import {
  isModifierPressed,
  openFileAndLoad,
  saveCurrentOrSaveAs,
} from "./utils/fileActions";

// setup
const editorPane = document.getElementById("editor-pane");
const editorDiv = document.getElementById("editor");
const previewPane = document.getElementById("preview");
if (!editorPane) {
  throw new Error("Editor pane not found in DOM. Aborting.");
} else if (!editorDiv) {
  throw new Error("Editor container not found in DOM. Aborting.");
} else if (!previewPane) {
  throw new Error("Preview pane not found in DOM. Aborting.");
}
const editorManager = EditorManager.getInstance(editorDiv);
const editor = editorManager.getEditor();
const previewManager = PreviewManager.getInstance(previewPane);
editor.onDidChangeModelContent(() => {
  previewManager.updatePreview(editor.getValue());
  editor.layout();
});
previewManager.updatePreview(editor.getValue());

// sincronización de scroll
editorManager.setPartner(previewManager);
previewManager.setPartner(editorManager);
editor.setScrollTop(0);
previewPane.scrollTop = 0;

// tab manager
const tabsContainer = document.getElementById("tabs");
const tabManager = TabManager.getInstance();
let prevModelUris = new Set<string>();
if (tabsContainer) {
  renderTabsView(tabsContainer, tabManager);
}

// crear una pestaña de bienvenida al inicio
const welcomeUri = `inmemory://model/welcome`;
const welcomeContent =
  "# Welcome to MathNote\n\nUse File → Open to open a Markdown file.";
editorManager.createModel(welcomeUri, welcomeContent);
tabManager.openTab("welcome.md", welcomeUri, null);
editorManager.switchToModel(welcomeUri);

// split.js
Split([editorPane, previewPane], {
  direction: "horizontal",
  sizes: [50, 50],
  minSize: 250,
  cursor: "ew-resize",
  dragInterval: 1,
  onDrag: () => {
    editor.layout();
  },
  gutterStyle: () => ({
    width: "5px",
    height: "100%",
  }),
});

/**
 * TAB MANAGER LISTENERS
 */
tabManager.onChange((tabs) => {
  const currentUris = new Set(tabs.map((t) => t.getModelUri()));
  for (const uri of prevModelUris) {
    if (!currentUris.has(uri)) {
      try {
        editorManager.disposeModel(uri);
      } catch {}
    }
  }
  prevModelUris = currentUris;

  const active = tabManager.getActive();
  if (active) {
    editorManager.switchToModel(active.getModelUri());
  } else {
    // no tabs left: create a default welcome/untitled tab
    editorManager.createModel(welcomeUri, welcomeContent);
    tabManager.openTab("welcome.md", welcomeUri, null);
    editorManager.switchToModel(welcomeUri);
  }
});

/**
 * WINDOW LISTENERS
 */
window.addEventListener("resize", () => {
  editor.layout();
});
window.addEventListener("load", () => {
  editor.layout();
});

// botones de barra de navegación
const fileMenuBtn = document.getElementById("fileMenuBtn");
const fileDropdown = document.getElementById("fileDropdown");
const openFileItem = document.getElementById("openFileItem");
const saveFileItem = document.getElementById("saveFileItem");

// activar dropdown menu
if (fileMenuBtn && fileDropdown) {
  fileMenuBtn.addEventListener("click", () => {
    fileDropdown.classList.toggle("show");
    fileMenuBtn.classList.toggle("active");
  });

  // cerrar dropdown al hacer click fuera
  window.addEventListener("click", (event) => {
    if (
      !fileMenuBtn.contains(event.target as Node) &&
      !fileDropdown.contains(event.target as Node)
    ) {
      fileDropdown.classList.remove("show");
      fileMenuBtn.classList.remove("active");
    }
  });
}

if (openFileItem) {
  openFileItem.addEventListener("click", () => {
    fileDropdown?.classList.remove("show");
    fileMenuBtn?.classList.remove("active");
    void openFileAndLoad(editorManager, previewManager, editor);
  });
}
if (saveFileItem) {
  saveFileItem.addEventListener("click", () => {
    fileDropdown?.classList.remove("show");
    fileMenuBtn?.classList.remove("active");
    void saveCurrentOrSaveAs(editorManager, editor);
  });
}

// keyboard shortcuts: Ctrl+O (open), Ctrl+S (save)
window.addEventListener(
  "keydown",
  async (event) => {
    // Ctrl+O: open file
    if (isModifierPressed(event) && event.key.toLowerCase() === "o") {
      event.preventDefault();
      await openFileAndLoad(editorManager, previewManager, editor);
      return;
    }

    // Ctrl+S: save file
    if (isModifierPressed(event) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      await saveCurrentOrSaveAs(editorManager, editor);
      return;
    }
  },
  true // use capture so Monaco doesn't swallow the events
);
