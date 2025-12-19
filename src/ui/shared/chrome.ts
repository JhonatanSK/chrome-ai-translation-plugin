export async function sendToActiveTab<T = unknown, R = unknown>(message: T): Promise<R | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    console.debug("[popup] No active tab to message");
    return undefined;
  }
  console.debug("[popup] Sending message to tab", tab.id, message);
  try {
    const result = await chrome.tabs.sendMessage(tab.id, message);
    console.debug("[popup] Response from content script", result);
    return result as R;
  } catch (error) {
    console.warn("[popup] Failed to send message to content script", error);
    if (String(error).includes("Receiving end does not exist")) {
      console.debug("[popup] Attempting to inject content script", tab.id);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        const result = await chrome.tabs.sendMessage(tab.id, message);
        console.debug("[popup] Response after injection", result);
        return result as R;
      } catch (injectError) {
        console.warn("[popup] Injection failed", injectError);
        throw injectError;
      }
    }
    throw error;
  }
}

export function onRuntimeMessage<T = unknown>(handler: (message: T) => void) {
  chrome.runtime.onMessage.addListener((message) => {
    handler(message as T);
  });
}
