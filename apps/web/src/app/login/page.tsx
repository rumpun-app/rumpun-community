import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Rumpun Community account.
        </p>
      </div>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
