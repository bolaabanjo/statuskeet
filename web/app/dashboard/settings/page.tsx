"use client";

import { useEffect, useState } from "react";
import { listAPIKeys, createAPIKey, revokeAPIKey } from "@/lib/api";
import type { APIKey } from "@/lib/api";

export default function SettingsPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Create key modal
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  // Newly created key (shown once)
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);

  // Revoke confirm
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    listAPIKeys(token).then((data) => {
      setKeys(data);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    const token = localStorage.getItem("token") || "";
    setCreating(true);
    try {
      const resp = await createAPIKey(token, newKeyName);
      setNewKey(resp.key);
      setShowCreate(false);
      setNewKeyName("");
      const updated = await listAPIKeys(token);
      setKeys(updated);
    } catch {
      // handle silently
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    const token = localStorage.getItem("token") || "";
    try {
      await revokeAPIKey(token, id);
      const updated = await listAPIKeys(token);
      setKeys(updated);
    } finally {
      setRevoking(null);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  return (
    <>
      <h1 className="text-lg font-semibold text-foreground font-heading mb-1">
        API Keys
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Use API keys to authenticate your SDK. Keys are shown once at creation
        — store them securely.
      </p>

      {/* Newly created key banner */}
      {newKey && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <p className="text-xs text-green-400 font-medium mb-2">
            API key created — copy it now, you won&apos;t see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[13px] text-foreground bg-background rounded px-3 py-2 font-mono truncate select-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 text-[11px] font-medium h-8 px-3 rounded bg-green-500 text-black hover:bg-green-400 transition uppercase tracking-wider"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewKey("")}
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Active Keys
        </span>
        <button
          onClick={() => setShowCreate(true)}
          className="text-[11px] font-medium h-7 px-3 inline-flex items-center rounded bg-green-500 text-black hover:bg-green-400 transition uppercase tracking-wider"
        >
          Create Key
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-muted border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Create API Key
            </h2>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Key name
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition mb-4"
              placeholder="e.g. production, staging"
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyName("");
                }}
                className="text-[11px] font-medium h-8 px-3 rounded border border-white/[0.06] text-foreground hover:text-white transition uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || creating}
                className="text-[11px] font-medium h-8 px-3 rounded bg-green-500 text-black hover:bg-green-400 transition uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Loading...
        </div>
      ) : (
        <>
          {/* Active keys table */}
          <div className="rounded-lg border border-white/[0.06] overflow-hidden">
            {activeKeys.length > 0 ? (
              activeKeys.map((key, i) => (
                <div
                  key={key.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < activeKeys.length - 1
                      ? "border-b border-white/[0.06]"
                      : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {key.name}
                      </span>
                      <code className="text-[11px] text-muted-foreground font-mono">
                        {key.key_prefix}...
                      </code>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        Created{" "}
                        {new Date(key.created_at).toLocaleDateString()}
                      </span>
                      {key.last_used_at && (
                        <span className="text-[10px] text-muted-foreground">
                          Last used{" "}
                          {new Date(key.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {revoking === key.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="text-[11px] font-medium h-7 px-2.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition uppercase tracking-wider"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setRevoking(null)}
                        className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevoking(key.id)}
                      className="text-[11px] text-muted-foreground hover:text-red-400 transition"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No API keys yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create one to start sending heartbeats from your app.
                </p>
              </div>
            )}
          </div>

          {/* Revoked keys */}
          {revokedKeys.length > 0 && (
            <div className="mt-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3">
                Revoked Keys
              </span>
              <div className="rounded-lg border border-white/[0.06] overflow-hidden opacity-50">
                {revokedKeys.map((key, i) => (
                  <div
                    key={key.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < revokedKeys.length - 1
                        ? "border-b border-white/[0.06]"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground line-through">
                          {key.name}
                        </span>
                        <code className="text-[11px] text-muted-foreground/50 font-mono">
                          {key.key_prefix}...
                        </code>
                      </div>
                      <span className="text-[10px] text-muted-foreground/50">
                        Revoked{" "}
                        {new Date(key.revoked_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SDK quickstart */}
          <div className="mt-8 rounded-lg border border-white/[0.06] p-5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3">
              Quick Start
            </span>
            <pre className="text-[12px] text-muted-foreground bg-background rounded-lg px-4 py-3 overflow-x-auto leading-relaxed">
              <code>{`npm install statuskeet

import StatusKeet from "statuskeet";

const sk = new StatusKeet({
  apiKey: "sk_live_...",
  services: [
    { name: "api", type: "http" },
    { name: "worker", type: "internal" },
  ],
});

sk.start();`}</code>
            </pre>
          </div>
        </>
      )}
    </>
  );
}
