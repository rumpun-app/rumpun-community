"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Card, CardContent, Alert } from "@/components/ui";
import type { Tree } from "@/types/api";

export function TreeView() {
  const [tree, setTree] = useState<Tree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadTree() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTree();
      setTree(data);
      setName(data.name);
      setDescription(data.description ?? "");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Please sign in to view the tree.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load tree");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTree();
  }, []);

  const handleSave = async () => {
    if (!tree) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.updateTree(
        { name, description: description || null },
        tree.version,
      );
      setTree(updated);
      setEditing(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 412) {
        setSaveError("Tree was modified by another session. Please refresh.");
      } else {
        setSaveError(e instanceof Error ? e.message : "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p aria-live="polite">Loading tree&hellip;</p>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!tree) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          {saveError ? (
            <Alert variant="error" className="mb-4">{saveError}</Alert>
          ) : null}
          {editing ? (
            <div className="flex flex-col gap-4">
              <Input
                label="Tree name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tree-description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="tree-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} loading={saving}>Save</Button>
                <Button variant="outline" onClick={() => { setEditing(false); setName(tree.name); setDescription(tree.description ?? ""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{tree.name}</h2>
                {tree.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{tree.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Locale: {tree.locale} &middot; Version: {tree.version}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          An interactive tree visualization will be rendered here.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <a href="/people" className="underline hover:text-foreground">Browse people</a> to view and manage family members.
        </p>
      </div>
    </div>
  );
}
