import { Megaphone } from "lucide-react";
import { createAnnouncementBlock } from "@/app/(workspace)/(dashboards)/admin/content/pages/actions";

export function CreateContentBlockSection() {
  return (
    <section
      aria-labelledby="create-block-heading"
      className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7"
    >
      <h2
        id="create-block-heading"
        className="flex items-center gap-2 text-xl font-bold text-ceda-ink"
      >
        <Megaphone aria-hidden="true" className="h-5 w-5 text-ceda-burgundy" />
        Publish a news announcement or guideline section
      </h2>

      <form action={createAnnouncementBlock} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-block-section"
              className="block text-sm font-semibold text-ceda-ink"
            >
              Target public page
            </label>
            <select
              id="new-block-section"
              name="section"
              defaultValue="news"
              className="ds-input mt-1.5"
            >
              <option value="news">News &amp; Announcements (/news)</option>
              <option value="guidelines">
                Application Guidelines (/guidelines)
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="new-block-title"
              className="block text-sm font-semibold text-ceda-ink"
            >
              Heading / title
            </label>
            <input
              id="new-block-title"
              name="title"
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Submission deadline extended to 30 November"
              className="ds-input mt-1.5"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="new-block-body"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Content body
          </label>
          <textarea
            id="new-block-body"
            name="body"
            required
            rows={4}
            maxLength={10000}
            placeholder="Write clear plain-text details for portal visitors..."
            className="ds-input mt-1.5 min-h-28 py-3"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2.5 text-sm text-ceda-ink">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked
              className="h-4 w-4 accent-ceda-burgundy"
            />
            <span>Publish immediately</span>
          </label>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            Publish content
          </button>
        </div>
      </form>
    </section>
  );
}
