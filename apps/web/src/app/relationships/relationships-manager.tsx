"use client";

import { useEffect, useState, use } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, CardContent, Select, Alert } from "@/components/ui";
import type { Relationship, RelationshipType, Confidence, PrivacyLevel } from "@/types/api";
import Link from "next/link";

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: "biological_parent", label: "Biological parent" },
  { value: "adoptive_parent", label: "Adoptive parent" },
  { value: "foster_parent", label: "Foster parent" },
  { value: "guardian", label: "Guardian" },
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
  { value: "step_parent", label: "Step parent" },
  { value: "sibling", label: "Sibling" },
  { value: "custom", label: "Custom" },
];

const CONFIDENCE_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "disputed", label: "Disputed" },
];

const PRIVACY_OPTIONS = [
  { value: "members", label: "Members" },
  { value: "editors", label: "Editors" },
  { value: "administrators", label: "Administrators" },
];

export function RelationshipsManager() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [personId, setPersonId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<RelationshipType>("biological_parent");
  const [editConfidence, setEditConfidence] = useState<Confidence>("medium");
  const [editPrivacy, setEditPrivacy] = useState<PrivacyLevel>("members");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadRelationships(pid: string) {
    if (!pid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listRelationships(pid);
      setRelationships(data.items);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Please sign in.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load relationships");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("personId");
    if (pid) {
      setPersonId(pid);
      loadRelationships(pid);
    } else {
      setLoading(false);
    }
  }, []);

  const handleUpdate = async (rel: Relationship) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.updateRelationship(
        rel.id,
        {
          type: editType,
          confidence: editConfidence,
          privacy: editPrivacy,
        },
        rel.version,
      );
      setRelationships((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setEditingId(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 412) {
        setSaveError("Modified elsewhere. Please refresh.");
      } else {
        setSaveError(e instanceof Error ? e.message : "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rel: Relationship) => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.deleteRelationship(rel.id, rel.version);
      setRelationships((prev) => prev.filter((r) => r.id !== rel.id));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  if (!personId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Select a person to manage their relationships.{" "}
          <Link href="/people" className="underline">Browse people</Link>.
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p aria-live="polite">Loading relationships&hellip;</p>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="flex flex-col gap-4">
      {saveError ? <Alert variant="error">{saveError}</Alert> : null}
      <p className="text-sm text-muted-foreground">
        Managing relationships for person: <code>{personId}</code>
      </p>

      {relationships.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No relationships found for this person.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3" role="list" aria-label="Relationships">
          {relationships.map((rel: Relationship) => (
            <Card key={rel.id}>
              <CardContent className="pt-6">
                {editingId === rel.id ? (
                  <div className="flex flex-col gap-3">
                    <Select
                      label="Type"
                      options={RELATIONSHIP_TYPE_OPTIONS}
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as RelationshipType)}
                    />
                    <Select
                      label="Confidence"
                      options={CONFIDENCE_OPTIONS}
                      value={editConfidence}
                      onChange={(e) => setEditConfidence(e.target.value as Confidence)}
                    />
                    <Select
                      label="Privacy"
                      options={PRIVACY_OPTIONS}
                      value={editPrivacy}
                      onChange={(e) => setEditPrivacy(e.target.value as PrivacyLevel)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(rel)} loading={saving}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {RELATIONSHIP_TYPE_OPTIONS.find((o) => o.value === rel.type)?.label ?? rel.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rel.fromPersonId} &rarr; {rel.toPersonId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(rel.id);
                          setEditType(rel.type);
                          setEditConfidence(rel.confidence);
                          setEditPrivacy(rel.privacy);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rel)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
