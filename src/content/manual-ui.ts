let panel: HTMLDivElement | null = null;

function ensurePanel() {
  if (panel) return panel;
  panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "16px";
  panel.style.right = "16px";
  panel.style.background = "#1f1534";
  panel.style.color = "#fff";
  panel.style.padding = "12px 16px";
  panel.style.borderRadius = "12px";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.fontSize = "12px";
  panel.style.zIndex = "2147483647";
  panel.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
  panel.style.display = "grid";
  panel.style.gap = "6px";

  const title = document.createElement("strong");
  title.textContent = "Manual Pairing";
  panel.appendChild(title);

  const status = document.createElement("div");
  status.id = "ai-translate-manual-status";
  panel.appendChild(status);

  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.style.background = "transparent";
  cancel.style.border = "1px solid rgba(255,255,255,0.5)";
  cancel.style.color = "#fff";
  cancel.style.padding = "4px 10px";
  cancel.style.borderRadius = "10px";
  cancel.style.cursor = "pointer";
  cancel.onclick = () => hideManualPanel();
  panel.appendChild(cancel);

  document.body.appendChild(panel);
  return panel;
}

export function showManualPanel(message: string) {
  const el = ensurePanel();
  const status = el.querySelector<HTMLDivElement>("#ai-translate-manual-status");
  if (status) status.textContent = message;
}

export function updateManualPanel(message: string) {
  if (!panel) return;
  const status = panel.querySelector<HTMLDivElement>("#ai-translate-manual-status");
  if (status) status.textContent = message;
}

export function hideManualPanel() {
  if (!panel) return;
  panel.remove();
  panel = null;
  window.dispatchEvent(new CustomEvent("ai-translate-manual-cancel"));
}
