"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  accessToken: string;
  hasPasscode: boolean;
  isActive: boolean;
  monthlyQuota: number;
  quotaUsed: number;
  conversationCount: number;
  createdAt: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [newQuota, setNewQuota] = useState("100");
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const fetchClients = async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        passcode: newPasscode || undefined,
        monthlyQuota: parseInt(newQuota, 10),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreatedLink(data.client.privateLink);
      setNewName("");
      setNewPasscode("");
      setNewQuota("100");
      fetchClients();
    }

    setCreating(false);
  };

  const toggleActive = async (clientId: string, isActive: boolean) => {
    await fetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, isActive: !isActive }),
    });
    fetchClients();
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setCreatedLink(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreate ? "Cancel" : "+ New Client"}
        </button>
      </div>

      {/* Create Client Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Create New Client</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Client Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Acme Corp"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Passcode (optional)</label>
              <input
                type="text"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="Leave blank for private link only"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Monthly Quota</label>
              <input
                type="number"
                value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Client"}
            </button>
          </form>

          {createdLink && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-1">Client created! Private access link:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-green-100 px-2 py-1 rounded flex-1 overflow-x-auto">
                  {createdLink}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(createdLink)}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 shrink-0"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2">Share this link with your client. They can use it to access ScamShield directly.</p>
            </div>
          )}
        </div>
      )}

      {/* Client List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No clients yet. Click &quot;New Client&quot; to create one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Private Link</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Passcode</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Usage</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{client.name}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigator.clipboard.writeText(`${appUrl}/c/${client.accessToken}`)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy Link
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {client.hasPasscode ? "Set" : "None"}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {client.quotaUsed}/{client.monthlyQuota}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        client.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {client.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(client.id, client.isActive)}
                      className={`text-xs px-2 py-1 rounded ${
                        client.isActive
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {client.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
