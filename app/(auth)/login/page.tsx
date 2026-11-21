import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-gutter py-ds-8 sm:py-ds-12">
      <div className="w-full max-w-xl">
        <Suspense fallback={<div className="auth-card" aria-busy="true">Loading sign-in…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
