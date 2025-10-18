export function confirmModal(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    // debug
    // eslint-disable-next-line no-console
    console.debug("ConfirmModal: show -", message);
    // basic DOM modal appended to body
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.4)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "2000";

    const box = document.createElement("div");
    box.style.background = "#202020";
    box.style.color = "#fff";
    box.style.padding = "16px";
    box.style.borderRadius = "6px";
    box.style.minWidth = "320px";
    box.style.boxShadow = "0 8px 32px rgba(0,0,0,0.6)";

    const msg = document.createElement("div");
    msg.style.marginBottom = "12px";
    msg.textContent = message;

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    btnCancel.style.padding = "6px 12px";

    const btnOk = document.createElement("button");
    btnOk.textContent = "Close without saving";
    btnOk.style.padding = "6px 12px";
    btnOk.style.background = "#d9534f";
    btnOk.style.color = "#fff";
    btnOk.style.border = "none";

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    box.appendChild(msg);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    btnCancel.addEventListener("click", () => {
      document.body.removeChild(overlay);
      // eslint-disable-next-line no-console
      console.debug("ConfirmModal: canceled");
      resolve(false);
    });
    btnOk.addEventListener("click", () => {
      document.body.removeChild(overlay);
      // eslint-disable-next-line no-console
      console.debug("ConfirmModal: confirmed");
      resolve(true);
    });
  });
}
