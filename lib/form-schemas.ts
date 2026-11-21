import { z } from "zod";

const botswanaPhoneRegex = /^(?:\+?267\s?)?(?:7[1-8]\s?\d{3}\s?\d{3}|\d{7,8})$/;
const referenceNumberRegex = /^CEDA-\d{4}-\d{4,}$/i;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const keyRegex = /^[a-z][a-z0-9_]{1,79}$/;
const otpRegex = /^\d{6}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .pipe(z.email("Enter an email address in the format you@example.com."))
    .refine((value) => value.length <= 255, "Email address must be 255 characters or fewer."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const otpVerifySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(otpRegex, "Enter the 6-digit code sent to your email."),
});
export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;

export const signupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(120, "Full name must be 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .pipe(z.email("Enter an email address in the format you@example.com."))
    .refine((value) => value.length <= 255, "Email address must be 255 characters or fewer."),
  password: z
    .string()
    .min(12, "Use at least 12 characters for your password.")
    .max(128, "Password must be 128 characters or fewer."),
  consent: z.boolean().refine((value) => value === true, {
    message: "Confirm your privacy notice consent to create an account.",
  }),
});
export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your account email address.")
    .pipe(z.email("Enter an email address in the format you@example.com.")),
});
export type ForgotPasswordRequestValues = z.infer<typeof forgotPasswordRequestSchema>;

export const forgotPasswordResetSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(otpRegex, "Enter the 6-digit reset code from your email."),
  password: z
    .string()
    .min(12, "Use at least 12 characters for your new password.")
    .max(128, "Password must be 128 characters or fewer."),
});
export type ForgotPasswordResetValues = z.infer<typeof forgotPasswordResetSchema>;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(120, "Full name must be 120 characters or fewer."),
  organisation: z
    .string()
    .trim()
    .max(255, "Organisation must be 255 characters or fewer."),
  jobTitle: z
    .string()
    .trim()
    .max(150, "Job title must be 150 characters or fewer."),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters for your new password.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The new passwords do not match.",
  });
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export const alertSubscriptionSchema = z.object({
  refNo: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || referenceNumberRegex.test(value),
      "Use the format CEDA-2026-0001, or leave blank.",
    ),
  contact: z
    .string()
    .trim()
    .min(1, "Enter an email address or Botswana phone number (+267).")
    .refine(
      (value) =>
        z.email().safeParse(value).success ||
        botswanaPhoneRegex.test(value.replace(/-/g, " ")),
      "Enter a valid email address or Botswana phone number (e.g. +267 71 234 567).",
    ),
  channel: z.enum(["both", "sms", "email"]),
});
export type AlertSubscriptionValues = z.infer<typeof alertSubscriptionSchema>;

export const chatMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Enter a message before sending.")
    .max(2000, "Keep your message under 2,000 characters."),
});
export type ChatMessageFormValues = z.infer<typeof chatMessageSchema>;

export const privateNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, "Enter a private note of at least 3 characters.")
    .max(5000, "Keep your note under 5,000 characters."),
});
export type PrivateNoteFormValues = z.infer<typeof privateNoteSchema>;

export type DynamicFieldSpec = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "checkbox" | "date" | "url";
  required: boolean;
  options: string[] | null;
};

function buildDynamicFieldSchema(field: DynamicFieldSpec): z.ZodTypeAny {
  if (field.type === "checkbox") {
    return field.required
      ? z.boolean().refine((value) => value === true, {
          message: `Confirm "${field.label}" to continue.`,
        })
      : z.boolean();
  }

  if (field.type === "multiselect") {
    return z.array(z.string()).superRefine((values, ctx) => {
      if (field.required && values.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `Select at least one option for ${field.label}.`,
        });
        return;
      }
      if (field.options?.length && values.some((value) => !field.options?.includes(value))) {
        ctx.addIssue({
          code: "custom",
          message: "Choose only listed options.",
        });
      }
    });
  }

  return z.string().superRefine((raw, ctx) => {
    const value = raw.trim();
    if (field.required && !value) {
      ctx.addIssue({
        code: "custom",
        message: `Enter ${field.label.toLowerCase()}.`,
      });
      return;
    }
    if (!value) return;

    if (value.length > 4000) {
      ctx.addIssue({
        code: "custom",
        message: "Keep this answer under 4,000 characters.",
      });
      return;
    }

    if (field.type === "url") {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          throw new Error("protocol");
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid web address starting with https:// or http://.",
        });
      }
      return;
    }

    if (field.type === "number") {
      if (!Number.isFinite(Number(value))) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid number.",
        });
      }
      return;
    }

    if (field.type === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00`))) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid date.",
        });
      }
      return;
    }

    if (field.type === "select" && field.options?.length && !field.options.includes(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Choose one of the listed options.",
      });
    }
  });
}

export type SubmissionFormValues = {
  title: string;
  termsAccepted: boolean;
  categoryId: string;
  solutionStatus: string;
  summary: string;
  innovationTypes: string[];
  answers: Record<string, string | boolean | string[]>;
};

export function createSubmissionSchema(fields: DynamicFieldSpec[]): z.ZodType<SubmissionFormValues> {
  const answersShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    answersShape[field.key] = buildDynamicFieldSchema(field);
  }

  return z.object({
    title: z
      .string()
      .trim()
      .min(5, "Enter an idea title of at least 5 characters.")
      .max(255, "Idea title must be 255 characters or fewer."),
    termsAccepted: z.boolean().refine((value) => value === true, {
      message: "Accept the Terms and Conditions to continue.",
    }),
    categoryId: z.string().min(1, "Select a strategic priority area."),
    solutionStatus: z.string().min(1, "Select your current solution stage."),
    summary: z
      .string()
      .trim()
      .min(30, "Write a solution overview of at least 30 characters.")
      .max(5000, "Solution overview must be 5,000 characters or fewer."),
    innovationTypes: z
      .array(z.string())
      .min(1, "Select at least one type of innovation."),
    answers: z.object(answersShape),
  }) as unknown as z.ZodType<SubmissionFormValues>;
}

export type ResubmissionFormValues = {
  title: string;
  summary: string;
  categoryId: string;
  response: string;
  answers: Record<string, string | boolean | string[]>;
};

export function createResubmissionSchema(
  fields: DynamicFieldSpec[],
): z.ZodType<ResubmissionFormValues> {
  const answersShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    answersShape[field.key] = buildDynamicFieldSchema(field);
  }

  return z.object({
    title: z
      .string()
      .trim()
      .min(5, "Enter an idea title of at least 5 characters.")
      .max(255, "Idea title must be 255 characters or fewer."),
    summary: z
      .string()
      .trim()
      .min(30, "Write an idea summary of at least 30 characters.")
      .max(5000, "Idea summary must be 5,000 characters or fewer."),
    categoryId: z.string().min(1, "Select a category."),
    response: z
      .string()
      .trim()
      .min(20, "Explain how you addressed the feedback (at least 20 characters).")
      .max(5000, "Response must be 5,000 characters or fewer."),
    answers: z.object(answersShape),
  }) as unknown as z.ZodType<ResubmissionFormValues>;
}

export type EvaluationFormValues = {
  scores: Record<string, string>;
  comments: Record<string, string>;
  overallComment: string;
};

export function createEvaluationSchema(
  criteriaList: { id: string; name: string; maxScore: number }[],
): z.ZodType<EvaluationFormValues> {
  const scoresShape: Record<string, z.ZodTypeAny> = {};
  const commentsShape: Record<string, z.ZodTypeAny> = {};

  for (const criterion of criteriaList) {
    scoresShape[criterion.id] = z.string().superRefine((raw, ctx) => {
      const value = raw.trim();
      if (!value) {
        ctx.addIssue({
          code: "custom",
          message: `Enter a score between 0 and ${criterion.maxScore}.`,
        });
        return;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > criterion.maxScore) {
        ctx.addIssue({
          code: "custom",
          message: `Score must be between 0 and ${criterion.maxScore}.`,
        });
      }
    });

    commentsShape[criterion.id] = z
      .string()
      .max(2000, "Criterion feedback must be 2,000 characters or fewer.");
  }

  return z.object({
    scores: z.object(scoresShape),
    comments: z.object(commentsShape),
    overallComment: z
      .string()
      .max(5000, "Overall feedback must be 5,000 characters or fewer."),
  }) as unknown as z.ZodType<EvaluationFormValues>;
}

export const createCallSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Enter a call title between 3 and 255 characters.")
      .max(255, "Call title must be 255 characters or fewer."),
    slug: z
      .string()
      .trim()
      .min(2, "Enter a URL slug (e.g. youth-innovation-2027).")
      .max(120, "URL slug must be 120 characters or fewer.")
      .regex(slugRegex, "Use lowercase letters, numbers, and hyphens only."),
    description: z
      .string()
      .max(5000, "Description must be 5,000 characters or fewer."),
    status: z.enum(["draft", "open", "closed"]),
    opensAt: z.string(),
    closesAt: z.string(),
  })
  .refine(
    (data) => {
      if (!data.opensAt || !data.closesAt) return true;
      return Date.parse(data.closesAt) > Date.parse(data.opensAt);
    },
    {
      path: ["closesAt"],
      message: "Closing date must be later than the opening date.",
    },
  );
export type CreateCallValues = z.infer<typeof createCallSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a category name of at least 2 characters.")
    .max(150, "Category name must be 150 characters or fewer."),
  description: z
    .string()
    .max(2000, "Description must be 2,000 characters or fewer."),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const awardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Enter an award title of at least 3 characters.")
    .max(255, "Award title must be 255 characters or fewer."),
  tier: z.string().max(50, "Tier must be 50 characters or fewer."),
  description: z
    .string()
    .max(2000, "Recognition details must be 2,000 characters or fewer."),
});
export type AwardFormValues = z.infer<typeof awardSchema>;

export const faqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Enter a question of at least 3 characters.")
    .max(500, "Question must be 500 characters or fewer."),
  topic: z.string().max(100, "Topic must be 100 characters or fewer."),
  answer: z
    .string()
    .trim()
    .min(3, "Enter an answer of at least 3 characters.")
    .max(5000, "Answer must be 5,000 characters or fewer."),
  position: z.string().superRefine((raw, ctx) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 0 || value > 100000) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a whole number between 0 and 100,000.",
      });
    }
  }),
  isPublished: z.boolean(),
});
export type FaqFormValues = z.infer<typeof faqSchema>;

export const adjudicationDecisionSchema = z.object({
  decision: z
    .string()
    .refine(
      (value) => ["approved", "needs_revision", "rejected"].includes(value),
      "Choose a decision.",
    ),
  rationale: z
    .string()
    .trim()
    .min(20, "Enter a rationale of at least 20 characters.")
    .max(5000, "Rationale must be 5,000 characters or fewer."),
});
export type AdjudicationDecisionValues = z.infer<typeof adjudicationDecisionSchema>;

export const addFormFieldSchema = z
  .object({
    key: z
      .string()
      .trim()
      .regex(
        keyRegex,
        "Start with a lowercase letter and use only lowercase letters, numbers, and underscores.",
      ),
    label: z
      .string()
      .trim()
      .min(2, "Enter a field label of at least 2 characters.")
      .max(255, "Label must be 255 characters or fewer."),
    helpText: z
      .string()
      .max(2000, "Help text must be 2,000 characters or fewer."),
    sectionKey: z.enum([
      "general_information",
      "solution_status",
      "solution_overview",
      "type_of_innovation",
      "additional_information",
      "solution_documents",
    ]),
    type: z.enum([
      "text",
      "textarea",
      "url",
      "number",
      "date",
      "select",
      "multiselect",
      "checkbox",
    ]),
    options: z.string().max(2000, "Choices must be 2,000 characters or fewer."),
    required: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "select" || data.type === "multiselect") {
      const items = data.options
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (items.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Enter at least two comma-separated choices for this field type.",
        });
      } else if (new Set(items).size !== items.length) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Remove duplicate choices.",
        });
      }
    }
  });
export type AddFormFieldValues = z.infer<typeof addFormFieldSchema>;

export const updateWorkflowStageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a stage name of at least 2 characters.")
    .max(150, "Stage name must be 150 characters or fewer."),
  description: z
    .string()
    .max(2000, "Description must be 2,000 characters or fewer."),
});
export type UpdateWorkflowStageValues = z.infer<typeof updateWorkflowStageSchema>;

export const addWorkflowStageSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(
      keyRegex,
      "Start with a lowercase letter and use only lowercase letters, numbers, and underscores.",
    ),
  name: z
    .string()
    .trim()
    .min(2, "Enter a stage name of at least 2 characters.")
    .max(150, "Stage name must be 150 characters or fewer."),
  type: z.enum([
    "intake",
    "screening",
    "evaluation",
    "adjudication",
    "feedback",
    "decision",
    "award",
  ]),
  description: z
    .string()
    .max(2000, "Description must be 2,000 characters or fewer."),
});
export type AddWorkflowStageValues = z.infer<typeof addWorkflowStageSchema>;

export const criterionSchema = z.object({
  stageId: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Enter a criterion name of at least 2 characters.")
    .max(150, "Criterion name must be 150 characters or fewer."),
  description: z
    .string()
    .max(2000, "Description must be 2,000 characters or fewer."),
  maxScore: z.string().superRefine((raw, ctx) => {
    const parsed = Number(raw.trim());
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a whole number between 1 and 1,000.",
      });
    }
  }),
  weight: z.string().superRefine((raw, ctx) => {
    const parsed = Number(raw.trim());
    if (!Number.isFinite(parsed) || parsed < 0.01 || parsed > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a weight between 0.01 and 100.",
      });
    }
  }),
});
export type CriterionFormValues = z.infer<typeof criterionSchema>;

export const addCriterionSchema = criterionSchema.extend({
  stageId: z.string().min(1, "Select an evaluation stage."),
});
export type AddCriterionFormValues = z.infer<typeof addCriterionSchema>;

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Choose a role to assign."),
});
export type AssignRoleFormValues = z.infer<typeof assignRoleSchema>;
