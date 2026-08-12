import { AppShell } from "@/components/features/app-shell";
import { SourcesList } from "./sources-list";

export default function SourcesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
        </div>
        <SourcesList />
      </div>
    </AppShell>
  );
}
