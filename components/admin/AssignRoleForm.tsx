"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { assignRole } from "@/app/(workspace)/(dashboards)/admin/users/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { assignRoleSchema, type AssignRoleFormValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

export function AssignRoleForm({
  userId,
  availableRoles,
}: {
  userId: string;
  availableRoles: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<AssignRoleFormValues>({
    resolver: zodResolver(assignRoleSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { roleId: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("roleId", values.roleId);
    startTransition(async () => {
      await assignRole(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby={`user-title-${userId}`}
        className="flex flex-col gap-1"
      >
        <div className="flex items-end gap-2">
          <div>
            <label
              htmlFor={`role-${userId}`}
              className="text-xs font-semibold text-ceda-ink"
            >
              Assign role
            </label>
            <select
              id={`role-${userId}`}
              aria-invalid={errors.roleId ? "true" : "false"}
              aria-describedby={
                errors.roleId ? `role-error-${userId}` : undefined
              }
              className="ds-field-control mt-1 min-h-10 rounded-lg border border-[#9A8175] bg-white px-3 text-sm text-ceda-ink"
              {...register("roleId")}
            >
              <option value="" disabled>
                Choose a role
              </option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="min-h-10 rounded-full bg-ceda-burgundy px-4 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
          >
            {pending ? "Assigning…" : "Assign"}
          </button>
        </div>
        <FieldErrorMessage
          id={`role-error-${userId}`}
          message={errors.roleId?.message}
        />
      </form>
    </>
  );
}
