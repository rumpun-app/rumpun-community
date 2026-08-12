import { BootstrapForm } from "./bootstrap-form";

export default function BootstrapPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Bootstrap Administrator
        </h1>
        <p className="text-sm text-muted-foreground">
          Create the first administrator account and initialize the singleton tree.
        </p>
      </div>
      <div className="mt-8">
        <BootstrapForm />
      </div>
    </div>
  );
}
