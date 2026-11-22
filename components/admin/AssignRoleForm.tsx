"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { assignRole } from "@/app/(workspace)/(dashboards)/admin/users/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { assignRoleSchema, type AssignRoleFormValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

export function AssignRoleForm({
  userId,
  availableRoles,
}: {
  userId: string;
  availableRoles: readonly { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    reset,
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
      reset();
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
        <div className="flex items-center gap-2">
          <div className="w-44 shrink-0">
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <SelectDropdown
                  groupLabel="Assign role"
                  value={field.value}
                  placeholder="Choose a role"
                  invalid={Boolean(errors.roleId)}
                  options={availableRoles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-ceda-burgundy px-4 text-xs font-bold text-white transition hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
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
