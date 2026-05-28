import { getDashboardStats } from "@/actions/dashboard";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { getServerSessionUser } from "@/lib/auth/server";

export default async function Home() {
  const [stats, session] = await Promise.all([getDashboardStats(), getServerSessionUser()]);
  return <DashboardHome stats={stats} userRole={session?.role ?? null} />;
}
