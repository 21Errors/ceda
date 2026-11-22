import { Suspense } from "react";
import { GuestOnlyGuard } from "@/components/auth/GuestOnlyGuard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-gutter py-ds-8 sm:py-ds-12">
      <div className="w-full max-w-xl">
        <Suspense
          fallback={
            <div
              className="rounded-card border border-neutral-200 bg-white p-8 text-sm text-neutral-500"
              aria-busy="true"
            >
              Loading registration…
            </div>
          }
        >
          <GuestOnlyGuard>
            <SignupForm />
          </GuestOnlyGuard>
        </Suspense>
      </div>
    </main>
  );
}
