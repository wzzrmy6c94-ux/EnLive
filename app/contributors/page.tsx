import type { Metadata } from "next";
import Link from "next/link";
import { EnliveShell, Panel } from "@/components/enlive-shell";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Contributors",
  description:
    "Meet the contributors who helped shape EnLive, the live music ratings and leaderboard platform.",
  path: "/contributors",
  keywords: ["EnLive contributors", "EnLive credits", "live music platform team"],
});

type Contributor = {
  name: string;
  role: string;
  note: string;
};

const CONTRIBUTORS: Contributor[] = [
  {
    name: "Lux Holden",
    role: "Founder & Product Vision",
    note: "Concept creation, business strategy, platform direction, research coordination, and project leadership.",
  },
  {
    name: "Kevin Silva",
    role: "Technical Foundations",
    note: "Initial platform architecture and early-stage software development.",
  },
  {
    name: "Lucrie Talk",
    role: "Design & User Experience",
    note: "Visual identity, interface design, branding direction, and user experience design.",
  },
  {
    name: "Brandon James",
    role: "Mathematics & Ranking Systems",
    note: "Development and validation of the ranking methodology, weighting systems, and statistical modelling.",
  },
  {
    name: "Neil Aspinall",
    role: "Early Investment & Support",
    note: "Early financial support and belief in the project during its formative stages.",
  },
];

export default function ContributorsPage() {
  return (
    <EnliveShell
      title="Contributors"
      subtitle="People and tools that have helped shape EnLive."
      headerMode="public"
    >
      <main className="mx-auto grid w-full max-w-4xl gap-5 pb-20">
        <Panel className="shadow-[0_18px_60px_var(--shadow)]">
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              EnLive was built through the contributions, support, and expertise of a number of people.
            </p>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Every platform begins with an idea, but ideas become reality through the people willing to contribute
              their time, knowledge, and support.
            </p>
          </div>
        </Panel>

        <section className="grid gap-3 sm:grid-cols-2">
          {CONTRIBUTORS.map((contributor) => (
            <Panel key={`${contributor.name}-${contributor.role}`} className="min-h-[180px]">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{contributor.name}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                    {contributor.role}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{contributor.note}</p>
                </div>
              </div>
            </Panel>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/leaderboard"
            className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Back to leaderboard
          </Link>
        </div>
      </main>
    </EnliveShell>
  );
}
