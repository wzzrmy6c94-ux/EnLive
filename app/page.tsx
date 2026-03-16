// NO "use client" here
import LeaderboardClient from "./leaderboard/page";

export default function HomePage() {
  return (
    <main className="grid gap-4">
      <LeaderboardClient />
    </main>
  );
}
