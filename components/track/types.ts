import type {
  getTrackableUserSubmissions,
  getUserAlertChannelSummary,
  lookupTrackedSubmission,
} from "@/lib/server/track-submission";

export type TrackedSubmission = NonNullable<
  Awaited<ReturnType<typeof lookupTrackedSubmission>>
>;

export type UserAlertChannelSummary = Awaited<
  ReturnType<typeof getUserAlertChannelSummary>
>;

export type TrackableUserSubmission = Awaited<
  ReturnType<typeof getTrackableUserSubmissions>
>[number];
