import { AppShell } from "@/components/features/app-shell";
import { TreeView } from "./tree-view";

export default function TreePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Family Tree</h1>
        <TreeView />
      </div>
    </AppShell>
  );
}
