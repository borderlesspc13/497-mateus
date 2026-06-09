"use server";

import { requireServerSessionUser } from "@/lib/auth/server";
import {
  getDashboardCounts as getDashboardCountsFromFirestore,
  getDashboardRanking as getDashboardRankingFromFirestore,
  getDashboardStats as getDashboardStatsFromFirestore,
} from "@/lib/firestore/repository";
import type { DashboardCounts, DashboardRanking, DashboardStats } from "@/lib/types/domain";

export async function getDashboardCounts(): Promise<DashboardCounts> {
  return getDashboardCountsFromFirestore();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireServerSessionUser();
  return getDashboardStatsFromFirestore();
}

export async function getDashboardRanking(): Promise<DashboardRanking> {
  await requireServerSessionUser();
  return getDashboardRankingFromFirestore();
}
