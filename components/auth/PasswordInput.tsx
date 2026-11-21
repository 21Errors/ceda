"use client";

import { useId, useState, type ComponentPropsWithRef } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<ComponentPropsWithRef<"input">, "type" | "id"> & {
  id: string;
};

export function PasswordInput({
  id,
  className,
  style,
  ref,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const warningId = useId();

  return (
    <span className="relative block w-full">
      <input
        {...props}
        ref={ref}
        id={id}
        type={visible ? "text" : "password"}
        className={className}
        style={{ ...style, paddingRight: "3rem" }}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={id}
        aria-describedby={warningId}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg text-ceda-muted hover:bg-[#FFF1E4] hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="h-5 w-5" />
        ) : (
          <Eye aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
      <span id={warningId} className="sr-only">
        This will display your password on screen.
      </span>
    </span>
  );
}
