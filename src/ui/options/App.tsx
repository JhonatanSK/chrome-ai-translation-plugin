import React, { useEffect, useState } from "react";
import { StoredSettings } from "../../core/types";

const defaultSettings: StoredSettings = {
  provider: "google",
  googleModel: "gemini-2.5-flash",
  sourceLang: "pt-BR",
  targetLang: "en-US",
  tone: "",
  glossary: [],
  aiPairingEnabled: false
};

export default function App() {
  const [settings, setSettings] = useState<StoredSettings>(defaultSettings);
  const [saved, setSaved] = useState<string>("");

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "LOAD_SETTINGS" }, (response) => {
      if (response?.type === "SETTINGS") setSettings(response.settings);
    });
  }, []);

  const update = (key: keyof StoredSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings }, () => {
      setSaved("Settings saved");
      setTimeout(() => setSaved(""), 2000);
    });
  };

  return (
    <div className="options">
      <header>
        <h1>AI Translation Settings</h1>
        <p>Configure provider, languages, tone, and glossary.</p>
      </header>

      <section>
        <label>Provider</label>
        <select value={settings.provider} onChange={(e) => update("provider", e.target.value as StoredSettings["provider"])}>
          <option value="google">Google</option>
          <option value="custom">Custom</option>
        </select>
      </section>

      {settings.provider === "google" ? (
        <section className="grid">
          <label>Google API Key</label>
          <input type="password" value={settings.googleApiKey || ""} onChange={(e) => update("googleApiKey", e.target.value)} />
          <label>Model</label>
          <input value={settings.googleModel || "gemini-2.5-flash"} onChange={(e) => update("googleModel", e.target.value)} />
        </section>
      ) : (
        <section className="grid">
          <label>Endpoint</label>
          <input value={settings.customEndpoint || ""} onChange={(e) => update("customEndpoint", e.target.value)} />
          <label>Headers (JSON)</label>
          <textarea
            value={JSON.stringify(settings.customHeaders || {}, null, 2)}
            onChange={(e) => {
              try {
                update("customHeaders", JSON.parse(e.target.value));
              } catch {
                update("customHeaders", settings.customHeaders);
              }
            }}
          />
          <label>Timeout (ms)</label>
          <input
            type="number"
            value={settings.customTimeoutMs || 20000}
            onChange={(e) => update("customTimeoutMs", Number(e.target.value))}
          />
        </section>
      )}

      <section className="grid">
        <label>Source Language</label>
        <input value={settings.sourceLang} onChange={(e) => update("sourceLang", e.target.value)} />
        <label>Target Language</label>
        <input value={settings.targetLang} onChange={(e) => update("targetLang", e.target.value)} />
        <label>AI Pairing Suggestions</label>
        <select
          value={settings.aiPairingEnabled ? "enabled" : "disabled"}
          onChange={(e) => update("aiPairingEnabled", e.target.value === "enabled")}
        >
          <option value="disabled">Disabled</option>
          <option value="enabled">Enabled</option>
        </select>
        <label>Tone</label>
        <input value={settings.tone || ""} onChange={(e) => update("tone", e.target.value)} />
        <label>Glossary (comma separated)</label>
        <input
          value={(settings.glossary || []).join(", ")}
          onChange={(e) => update("glossary", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      </section>

      <div className="actions">
        <button onClick={handleSave}>Save</button>
        <span>{saved}</span>
      </div>
    </div>
  );
}
