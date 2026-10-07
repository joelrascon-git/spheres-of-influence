import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="size-12" />
          <h1 className="text-xl font-semibold tracking-tight">Spheres of Influence</h1>
          <p className="text-sm text-muted-foreground">Map who really decides, not just who reports to whom.</p>
        </div>
        {error === "not_allowed" && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            That email is not allowed to sign in to this workspace.
          </p>
        )}
        {error === "link" && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            That sign-in link is invalid or expired. Request a new one.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
