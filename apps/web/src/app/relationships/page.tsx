import { AppShell } from "@/components/features/app-shell";
import { RelationshipsManager } from "./relationships-manager";

export default function RelationshipsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Relationships</h1>
        <RelationshipsManager />
      </div>
    </AppShell>
  );
}
