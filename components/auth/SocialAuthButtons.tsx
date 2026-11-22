import Image from "next/image";

const providers = [
  { id: "google", name: "Google", logo: "/assets/google.jpg" },
];

export function SocialAuthButtons() {
  return <div className="mt-5 space-y-2">
    {providers.map(({ id, name, logo }) => (
      <button key={id} className="social-auth-button" type="button" disabled aria-label={`Continue with ${name}`}>
        <Image src={logo} alt="" width={22} height={22} className="social-auth-logo" />
        <span>Continue with {name}</span>
      </button>
    ))}
  </div>;
}
