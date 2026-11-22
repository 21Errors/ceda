// -----------------------------------------------------------------------------
// schema.ts  -  CEDA Innovation Management Portal
//
// Conventions
//   - Requires `casing: "snake_case"` in drizzle.config.ts and in drizzle().
//   - App tables use uuid primary keys. Better Auth's `user.id` is text, so every
//     reference to a person is a text column.
//   - Stable, small sets are Postgres enums. Anything an admin might extend
//     (roles, stages, criteria, form fields, categories) is a table row instead.
//   - History tables (idea_stage_history, audit_logs) are append-only.
// -----------------------------------------------------------------------------
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

// ---------- helpers ----------------------------------------------------------
const pk = () => uuid().primaryKey().defaultRandom();
const createdAt = () => timestamp({ withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

// ---------- enums ------------------------------------------------------------
export const callStatus = pgEnum("call_status", ["draft", "open", "closed", "archived"]);

export const stageType = pgEnum("stage_type", [
  "intake",
  "screening",
  "evaluation",
  "adjudication",
  "feedback",
  "decision",
  "award",
]);

export const ideaStatus = pgEnum("idea_status", [
  "draft",
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "rejected",
  "awarded",
  "withdrawn",
]);

export const fieldType = pgEnum("field_type", [
  "text",
  "textarea",
  "number",
  "select",
  "multiselect",
  "checkbox",
  "date",
  "url",
]);

export const assignmentStatus = pgEnum("assignment_status", [
  "pending",
  "in_progress",
  "submitted",
  "declined",
]);

export const adjudicationDecision = pgEnum("adjudication_decision", [
  "approved",
  "rejected",
  "needs_revision",
]);

export const notificationChannel = pgEnum("notification_channel", ["in_app", "email", "sms"]);

export const chatStatus = pgEnum("chat_status", ["waiting", "active", "closed"]);

// =============================================================================
// 1. ACCESS CONTROL  (roles as rows, so new roles need no migration)
// =============================================================================
export const roles = pgTable("roles", {
  id: pk(),
  key: varchar({ length: 50 }).notNull().unique(), // submitter | evaluator | adjudicator | admin
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  isSystem: boolean().default(false).notNull(), // built-in roles cannot be deleted
  createdAt: createdAt(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: varchar({ length: 100 }).notNull(), // e.g. "idea:submit", "evaluation:score"
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permission] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedBy: text().references(() => user.id, { onDelete: "set null" }),
    assignedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] }), index("user_roles_role_idx").on(t.roleId)],
);

export const userProfiles = pgTable("user_profiles", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  organisation: varchar({ length: 255 }),
  jobTitle: varchar({ length: 150 }),
  isInternal: boolean().default(false).notNull(), // CEDA staff vs external stakeholder
  dataConsentAt: timestamp({ withTimezone: true }), // Data Protection Act, 2024 consent record
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// =============================================================================
// 2. CALLS & CONFIGURATION
// =============================================================================
export const categories = pgTable("categories", {
  id: pk(),
  name: varchar({ length: 150 }).notNull().unique(),
  description: text(),
  isActive: boolean().default(true).notNull(),
  position: integer().default(0).notNull(),
  createdAt: createdAt(),
});

export const innovationCalls = pgTable(
  "innovation_calls",
  {
    id: pk(),
    title: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 120 }).notNull().unique(),
    description: text(),
    status: callStatus().default("draft").notNull(),
    opensAt: timestamp({ withTimezone: true }),
    closesAt: timestamp({ withTimezone: true }),
    createdBy: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("innovation_calls_status_idx").on(t.status)],
);

// Admin-configurable extra fields on the submission form
export const formFields = pgTable(
  "form_fields",
  {
    id: pk(),
    callId: uuid()
      .notNull()
      .references(() => innovationCalls.id, { onDelete: "cascade" }),
    key: varchar({ length: 80 }).notNull(), // key used inside idea_versions.answers
    label: varchar({ length: 255 }).notNull(),
    helpText: text(),
    type: fieldType().notNull(),
    required: boolean().default(false).notNull(),
    options: jsonb().$type<string[]>(), // choices for select / multiselect
    position: integer().default(0).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: createdAt(),
    sectionKey: varchar({ length: 80 }).default("general_information").notNull(),
    sectionPosition: integer().default(0).notNull(),
  },
  (t) => [unique("form_fields_call_key_uq").on(t.callId, t.key)],
);

// =============================================================================
// 3. WORKFLOW DEFINITION  (stages are data)
// =============================================================================
export const workflowStages = pgTable(
  "workflow_stages",
  {
    id: pk(),
    callId: uuid()
      .notNull()
      .references(() => innovationCalls.id, { onDelete: "cascade" }),
    key: varchar({ length: 80 }).notNull(),
    name: varchar({ length: 150 }).notNull(),
    description: text(),
    type: stageType().notNull(),
    position: integer().notNull(),
    isTerminal: boolean().default(false).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("workflow_stages_call_key_uq").on(t.callId, t.key),
    index("workflow_stages_call_pos_idx").on(t.callId, t.position),
  ],
);

// =============================================================================
// 4. IDEAS & VERSIONS
// =============================================================================
export const ideas = pgTable(
  "ideas",
  {
    id: pk(),
    referenceNo: varchar({ length: 30 }).notNull().unique(), // e.g. CEDA-2026-0001
    callId: uuid()
      .notNull()
      .references(() => innovationCalls.id),
    submitterId: text()
      .notNull()
      .references(() => user.id),
    categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
    currentStageId: uuid().references(() => workflowStages.id, { onDelete: "set null" }),
    currentVersionId: uuid().references((): AnyPgColumn => ideaVersions.id, {
      onDelete: "set null",
    }),
    status: ideaStatus().default("draft").notNull(),
    submittedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("ideas_call_idx").on(t.callId),
    index("ideas_submitter_idx").on(t.submitterId),
    index("ideas_status_idx").on(t.status),
    index("ideas_stage_idx").on(t.currentStageId),
  ],
);

export const ideaVersions = pgTable(
  "idea_versions",
  {
    id: pk(),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    versionNo: integer().notNull(),
    title: varchar({ length: 255 }).notNull(),
    summary: text().notNull(),
    answers: jsonb().$type<Record<string, unknown>>().default({}).notNull(), // values for form_fields
    createdBy: text().references(() => user.id, { onDelete: "set null" }),
    submittedAt: timestamp({ withTimezone: true }), // null while still a draft
    createdAt: createdAt(),
    termsAcceptedAt: timestamp({ withTimezone: true }),
  },
  (t) => [unique("idea_versions_idea_no_uq").on(t.ideaId, t.versionNo)],
);

export const ideaCollaborators = pgTable(
  "idea_collaborators",
  {
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: varchar({ length: 50 }).default("member").notNull(),
    addedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.ideaId, t.userId] })],
);

export const attachments = pgTable(
  "attachments",
  {
    id: pk(),
    ideaVersionId: uuid()
      .notNull()
      .references(() => ideaVersions.id, { onDelete: "cascade" }),
    uploadedBy: text().references(() => user.id, { onDelete: "set null" }),
    fileName: varchar({ length: 255 }).notNull(),
    fileUrl: text().notNull(),
    fileSize: integer(), // bytes
    mimeType: varchar({ length: 120 }),
    createdAt: createdAt(),
  },
  (t) => [index("attachments_version_idx").on(t.ideaVersionId)],
);

// Append-only: one row every time an idea moves. Drives tracking and timelines.
export const ideaStageHistory = pgTable(
  "idea_stage_history",
  {
    id: pk(),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    fromStageId: uuid().references(() => workflowStages.id, { onDelete: "set null" }),
    toStageId: uuid().references(() => workflowStages.id, { onDelete: "set null" }),
    toStatus: ideaStatus().notNull(),
    actorId: text().references(() => user.id, { onDelete: "set null" }),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [index("idea_stage_history_idea_idx").on(t.ideaId, t.createdAt)],
);

// =============================================================================
// 5. EVALUATION, ADJUDICATION & FEEDBACK
// =============================================================================
export const criteria = pgTable(
  "criteria",
  {
    id: pk(),
    stageId: uuid()
      .notNull()
      .references(() => workflowStages.id, { onDelete: "cascade" }),
    name: varchar({ length: 150 }).notNull(),
    description: text(),
    maxScore: integer().default(10).notNull(),
    weight: numeric({ precision: 5, scale: 2 }).default("1.00").notNull(),
    position: integer().default(0).notNull(),
    isArchived: boolean().default(false).notNull(), // archive instead of delete once scored
    createdAt: createdAt(),
  },
  (t) => [index("criteria_stage_idx").on(t.stageId)],
);

export const evaluatorAssignments = pgTable(
  "evaluator_assignments",
  {
    id: pk(),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    stageId: uuid()
      .notNull()
      .references(() => workflowStages.id, { onDelete: "cascade" }),
    evaluatorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assignedBy: text().references(() => user.id, { onDelete: "set null" }),
    status: assignmentStatus().default("pending").notNull(),
    dueAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("evaluator_assignments_uq").on(t.ideaId, t.stageId, t.evaluatorId),
    index("evaluator_assignments_evaluator_idx").on(t.evaluatorId, t.status),
  ],
);

export const evaluations = pgTable(
  "evaluations",
  {
    id: pk(),
    assignmentId: uuid()
      .notNull()
      .references(() => evaluatorAssignments.id, { onDelete: "cascade" }),
    ideaVersionId: uuid()
      .notNull()
      .references(() => ideaVersions.id, { onDelete: "cascade" }),
    overallComment: text(),
    totalScore: numeric({ precision: 6, scale: 2 }), // weighted total, cached on submit
    submittedAt: timestamp({ withTimezone: true }), // null while in progress
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("evaluations_assignment_version_uq").on(t.assignmentId, t.ideaVersionId)],
);

export const evaluationScores = pgTable(
  "evaluation_scores",
  {
    evaluationId: uuid()
      .notNull()
      .references(() => evaluations.id, { onDelete: "cascade" }),
    criterionId: uuid()
      .notNull()
      .references(() => criteria.id),
    score: numeric({ precision: 5, scale: 2 }).notNull(),
    comment: text(),
  },
  (t) => [primaryKey({ columns: [t.evaluationId, t.criterionId] })],
);

export const adjudications = pgTable(
  "adjudications",
  {
    id: pk(),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    stageId: uuid().references(() => workflowStages.id, { onDelete: "set null" }),
    ideaVersionId: uuid().references(() => ideaVersions.id, { onDelete: "set null" }),
    adjudicatorId: text()
      .notNull()
      .references(() => user.id),
    decision: adjudicationDecision().notNull(),
    finalScore: numeric({ precision: 6, scale: 2 }),
    rationale: text(),
    decidedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("adjudications_idea_idx").on(t.ideaId)],
);

export const feedback = pgTable(
  "feedback",
  {
    id: pk(),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    ideaVersionId: uuid().references(() => ideaVersions.id, { onDelete: "set null" }),
    stageId: uuid().references(() => workflowStages.id, { onDelete: "set null" }),
    authorId: text()
      .notNull()
      .references(() => user.id),
    parentId: uuid().references((): AnyPgColumn => feedback.id, { onDelete: "cascade" }), // replies
    body: text().notNull(),
    requiresResponse: boolean().default(false).notNull(),
    isInternal: boolean().default(false).notNull(), // true = evaluators/admins only, hidden from submitter
    createdAt: createdAt(),
  },
  (t) => [index("feedback_idea_idx").on(t.ideaId, t.createdAt)],
);

export const awards = pgTable(
  "awards",
  {
    id: pk(),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    tier: varchar({ length: 50 }), // e.g. gold / silver / recognition
    description: text(),
    awardedBy: text().references(() => user.id, { onDelete: "set null" }),
    awardedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("awards_idea_idx").on(t.ideaId)],
);

// =============================================================================
// 6. NOTIFICATIONS & PORTAL CONTENT
// =============================================================================
export const notifications = pgTable(
  "notifications",
  {
    id: pk(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ideaId: uuid().references(() => ideas.id, { onDelete: "cascade" }),
    type: varchar({ length: 50 }).notNull(), // status_changed | feedback_received | evaluation_assigned | ...
    title: varchar({ length: 255 }).notNull(),
    body: text(),
    readAt: timestamp({ withTimezone: true }),
    archivedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_user_read_idx").on(t.userId, t.readAt),
    index("notifications_user_archived_idx").on(t.userId, t.archivedAt),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    channel: notificationChannel().notNull(),
    enabled: boolean().default(true).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.channel] })],
);

// Free alerts when something changes on an idea a user follows
export const ideaSubscriptions = pgTable(
  "idea_subscriptions",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ideaId: uuid()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.ideaId] })],
);

export const faqs = pgTable("faqs", {
  id: pk(),
  question: text().notNull(),
  answer: text().notNull(),
  topic: varchar({ length: 100 }),
  position: integer().default(0).notNull(),
  isPublished: boolean().default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const contentBlocks = pgTable("content_blocks", {
  id: pk(),
  key: varchar({ length: 100 }).notNull().unique(), // e.g. "home.hero", "about.criteria"
  title: varchar({ length: 255 }),
  body: text().notNull(),
  isPublished: boolean().default(true).notNull(),
  updatedBy: text().references(() => user.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

// Admin-managed downloads: application form, guidelines, templates
export const documents = pgTable("documents", {
  id: pk(),
  callId: uuid().references(() => innovationCalls.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  fileName: varchar({ length: 255 }).notNull(),
  fileUrl: text().notNull(),
  isPublished: boolean().default(true).notNull(),
  uploadedBy: text().references(() => user.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

// =============================================================================
// 7. GOVERNANCE  (append-only)
// =============================================================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    actorId: text().references(() => user.id, { onDelete: "set null" }),
    action: varchar({ length: 100 }).notNull(), // e.g. "idea.submitted", "evaluation.scored", "role.assigned"
    entityType: varchar({ length: 50 }).notNull(),
    entityId: varchar({ length: 64 }),
    metadata: jsonb().$type<Record<string, unknown>>(), // before/after values, context
    ipAddress: varchar({ length: 45 }),
    userAgent: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

// Generic key/value settings (e.g. chat opening hours, public holidays)
export const systemSettings = pgTable("system_settings", {
  key: varchar({ length: 100 }).primaryKey(),
  value: jsonb().$type<unknown>().notNull(),
  updatedBy: text().references(() => user.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

// =============================================================================
// 8. STRETCH: LIVE CHAT WITH A CEDA CONSULTANT
//    Safe to leave out of the first migration if time is short.
// =============================================================================
export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: pk(),
    requesterId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text().references(() => user.id, { onDelete: "set null" }),
    ideaId: uuid().references(() => ideas.id, { onDelete: "set null" }),
    status: chatStatus().default("waiting").notNull(),
    startedAt: createdAt(),
    closedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("chat_conversations_status_idx").on(t.status)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: pk(),
    conversationId: uuid()
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    senderId: text()
      .notNull()
      .references(() => user.id),
    body: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("chat_messages_conv_idx").on(t.conversationId, t.createdAt)],
);
