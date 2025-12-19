import React, { useEffect, useState } from "react";
import { sendToActiveTab, onRuntimeMessage } from "../shared/chrome";
import { UiToContentMessage, ContentToUiMessage, StoredSettings } from "../../core/types";

export default function App() {
  const [status, setStatus] = useState<string>("Idle");
  const [settings, setSettings] = useState<StoredSettings | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "LOAD_SETTINGS" }, (response) => {
      console.debug("[popup] LOAD_SETTINGS response", response);
      if (response?.type === "SETTINGS") setSettings(response.settings);
    });
  }, []);

  useEffect(() => {
    onRuntimeMessage<ContentToUiMessage>((message) => {
      if (message.type === "STATUS") setStatus(message.message);
      if (message.type === "DETECT_RESULT") {
        setStatus(`Detected ${message.fields} fields, ${message.pairs} pairs`);
      }
      if (message.type === "TRANSLATION_DONE") {
        setStatus(`Applied ${message.applied}, failed ${message.failed}`);
      }
    });
  }, []);

  const handleDetect = async () => {
    setStatus("Detecting fields...");
    try {
      await sendToActiveTab<UiToContentMessage>({ type: "START_DETECT" });
    } catch (error) {
      setStatus("Content script not available on this tab");
    }
  };

  const handleManualPair = async () => {
    setStatus("Manual pair: click two fields");
    try {
      await sendToActiveTab<UiToContentMessage>({ type: "START_MANUAL_PAIR" });
    } catch (error) {
      setStatus("Content script not available on this tab");
    }
  };

  const handleTranslate = async () => {
    setStatus("Translating...");
    try {
      await sendToActiveTab<UiToContentMessage>({ type: "TRANSLATE_SELECTED" });
    } catch (error) {
      setStatus("Content script not available on this tab");
    }
  };

  return (
    <div className="popup">
      <header>
        <h1>AI Translate</h1>
        <p>Pair and translate fields on any site.</p>
      </header>
      <section className="actions">
        <button onClick={handleDetect}>Detect Fields</button>
        <button onClick={handleManualPair}>Manual Pair</button>
        <button className="primary" onClick={handleTranslate}>
          Translate
        </button>
      </section>
      <section className="status">
        <span>Status:</span>
        <strong>{status}</strong>
      </section>
      <section className="settings">
        <div>Source: {settings?.sourceLang || "pt-BR"}</div>
        <div>Target: {settings?.targetLang || "en-US"}</div>
        <a href="options.html" target="_blank" rel="noreferrer">
          Open settings
        </a>
      </section>
    </div>
  );
}
