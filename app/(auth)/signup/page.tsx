import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-gutter py-ds-8 sm:py-ds-12">
      <div className="w-full max-w-xl">
        <SignupForm />
      </div>
    </main>
  );
}
