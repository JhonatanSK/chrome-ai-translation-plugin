export function showCopyFallback(text: string): void {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.bottom = "16px";
  wrapper.style.right = "16px";
  wrapper.style.background = "#1f1534";
  wrapper.style.color = "#fff";
  wrapper.style.padding = "12px 16px";
  wrapper.style.borderRadius = "12px";
  wrapper.style.fontFamily = "Arial, sans-serif";
  wrapper.style.fontSize = "12px";
  wrapper.style.zIndex = "2147483647";
  wrapper.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";

  const message = document.createElement("div");
  message.textContent = "Translation ready. Copy to clipboard.";

  const button = document.createElement("button");
  button.textContent = "Copy";
  button.style.marginTop = "8px";
  button.style.background = "#6a46c8";
  button.style.border = "none";
  button.style.color = "#fff";
  button.style.padding = "6px 12px";
  button.style.borderRadius = "10px";
  button.style.cursor = "pointer";
  button.onclick = () => {
    navigator.clipboard.writeText(text).catch(() => undefined);
    wrapper.remove();
  };

  wrapper.appendChild(message);
  wrapper.appendChild(button);
  document.body.appendChild(wrapper);

  setTimeout(() => wrapper.remove(), 15000);
}
