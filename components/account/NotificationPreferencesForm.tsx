import { saveNotificationPreferences } from "@/app/(workspace)/(account)/account/settings/actions";
import type { NotificationChannelState } from "@/lib/server/account";

export function NotificationPreferencesForm({
  channelState,
  saved,
}: {
  channelState: NotificationChannelState;
  saved: boolean;
}) {
  return (
    <section
      className="mt-6 rounded-2xl border border-white bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="notification-preferences-heading"
    >
      <h2
        id="notification-preferences-heading"
        className="text-xl font-bold text-ceda-ink"
      >
        Notification preferences
      </h2>
      <p className="mt-2 text-sm leading-6 text-ceda-muted">
        Choose where to receive submission, review, and chat updates. Email
        delivery requires working Gmail SMTP credentials on the portal.
      </p>

      {saved ? (
        <p
          className="mt-4 rounded-xl border border-green-800/20 bg-green-50 p-3 text-sm text-green-900"
          role="status"
        >
          Your notification preferences have been saved.
        </p>
      ) : null}

      <form
        action={saveNotificationPreferences}
        aria-labelledby="notification-preferences-heading"
        className="mt-5 space-y-4"
      >
        <fieldset className="space-y-3">
          <legend className="sr-only">Notification channels</legend>
          <label
            htmlFor="pref-in-app"
            className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line px-4 py-3 text-sm text-ceda-ink"
          >
            <input
              id="pref-in-app"
              name="in_app"
              type="checkbox"
              value="on"
              defaultChecked={channelState.in_app}
              className="h-5 w-5 accent-ceda-burgundy"
            />
            <span>
              <strong>In-portal alerts</strong>
              <span className="block text-xs text-ceda-muted">
                Updates shown in your portal notification list.
              </span>
            </span>
          </label>
          <label
            htmlFor="pref-email"
            className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line px-4 py-3 text-sm text-ceda-ink"
          >
            <input
              id="pref-email"
              name="email"
              type="checkbox"
              value="on"
              defaultChecked={channelState.email}
              className="h-5 w-5 accent-ceda-burgundy"
            />
            <span>
              <strong>Email alerts</strong>
              <span className="block text-xs text-ceda-muted">
                Receive notifications at your verified account email.
              </span>
            </span>
          </label>
          <label
            htmlFor="pref-sms"
            className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line px-4 py-3 text-sm text-ceda-ink"
          >
            <input
              id="pref-sms"
              name="sms"
              type="checkbox"
              value="on"
              defaultChecked={channelState.sms}
              className="h-5 w-5 accent-ceda-burgundy"
            />
            <span>
              <strong>SMS alerts</strong>
              <span className="block text-xs text-ceda-muted">
                Preference saved; SMS delivery and phone verification are not
                connected.
              </span>
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
        >
          Save preferences
        </button>
      </form>
    </section>
  );
}
