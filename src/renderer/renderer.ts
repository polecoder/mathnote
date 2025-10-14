import Split from "split.js";
import { EditorManager } from "./modules/EditorManager";
import { PreviewManager } from "./modules/PreviewManager";
import {
  isModifierPressed,
  openFileAndLoad,
  saveCurrentOrSaveAs,
} from "./utils/fileActions";

const editorPane = document.getElementById("editor");
const previewPane = document.getElementById("preview");

if (!editorPane) {
  throw new Error("Editor pane not found in DOM. Aborting.");
} else if (!previewPane) {
  throw new Error("Preview pane not found in DOM. Aborting.");
}

const editorManager = EditorManager.getInstance(editorPane);
const editor = editorManager.getEditor();
const previewManager = PreviewManager.getInstance(previewPane);
// configurar para sincronización de scroll
editorManager.setPartner(previewManager);
previewManager.setPartner(editorManager);
editor.setScrollTop(0);
previewPane.scrollTop = 0;

// configurar split.js
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

editor.onDidChangeModelContent(() => {
  previewManager.updatePreview(editor.getValue());
  editor.layout();
});
previewManager.updatePreview(editor.getValue());

/**
 * EVENT LISTENERS
 */
window.addEventListener("resize", () => {
  editor.layout();
});
window.addEventListener("load", () => {
  editor.layout();
});

// Navigation bar buttons
const openFileBtn = document.getElementById("openFileBtn");
const saveFileBtn = document.getElementById("saveFileBtn");

if (openFileBtn) {
  openFileBtn.addEventListener("click", () => {
    void openFileAndLoad(editorManager, previewManager, editor);
  });
}

if (saveFileBtn) {
  saveFileBtn.addEventListener("click", () => {
    void saveCurrentOrSaveAs(editorManager, editor);
  });
}

// keyboard shortcuts: Ctrl+O (open), Ctrl+S (save)
window.addEventListener("keydown", (event) => {
  void (async () => {
    // Ctrl+O: open file
    if (isModifierPressed(event) && event.key.toLowerCase() === "o") {
      // eslint-disable-next-line no-console
      console.log("Opening file...");
      event.preventDefault();
      await openFileAndLoad(editorManager, previewManager, editor);
      return;
    }

    // Ctrl+S: save file
    if (isModifierPressed(event) && event.key.toLowerCase() === "s") {
      // eslint-disable-next-line no-console
      console.log("Saving file...");
      event.preventDefault();
      await saveCurrentOrSaveAs(editorManager, editor);
      return;
    }
  })();
});
