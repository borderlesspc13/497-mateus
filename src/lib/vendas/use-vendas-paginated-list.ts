"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VendasListFilters, VendasListPage } from "@/lib/firestore/repository";

type UseVendasPaginatedListOptions<T> = {
  initialPage: VendasListPage;
  initialFilters: VendasListFilters;
  fetchPage: (filters: VendasListFilters, cursorDocId?: string | null) => Promise<VendasListPage>;
  clientFilter?: (items: T[]) => T[];
};

function serializeServerPageKey(filters: VendasListFilters, page: VendasListPage): string {
  const itemIds = page.items.map((item) => item.id).join(",");
  return `${JSON.stringify(filters)}|${page.lastDocId ?? ""}|${page.hasMore}|${itemIds}`;
}

export function useVendasPaginatedList<T extends { id: string }>({
  initialPage,
  initialFilters,
  fetchPage,
  clientFilter,
}: UseVendasPaginatedListOptions<T>) {
  const [items, setItems] = useState<T[]>(initialPage.items as unknown as T[]);
  const [filters, setFilters] = useState(initialFilters);
  const [lastDocId, setLastDocId] = useState<string | null>(initialPage.lastDocId);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverPageKey = serializeServerPageKey(initialFilters, initialPage);
  const syncedPageKeyRef = useRef(serverPageKey);

  useEffect(() => {
    if (syncedPageKeyRef.current === serverPageKey) return;
    syncedPageKeyRef.current = serverPageKey;
    setItems(initialPage.items as unknown as T[]);
    setLastDocId(initialPage.lastDocId);
    setHasMore(initialPage.hasMore);
    setFilters(initialFilters);
  }, [serverPageKey, initialPage, initialFilters]);

  const resetAndFetch = useCallback(
    async (nextFilters: VendasListFilters) => {
      setIsResetting(true);
      setError(null);
      try {
        const page = await fetchPage(nextFilters);
        setItems(page.items as unknown as T[]);
        setLastDocId(page.lastDocId);
        setHasMore(page.hasMore);
        setFilters(nextFilters);
        syncedPageKeyRef.current = serializeServerPageKey(nextFilters, page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar vendas.");
      } finally {
        setIsResetting(false);
      }
    },
    [fetchPage],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isResetting || !lastDocId) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const page = await fetchPage(filters, lastDocId);
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = (page.items as unknown as T[]).filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
      setLastDocId(page.lastDocId);
      setHasMore(page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar mais registros.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, filters, hasMore, isLoadingMore, isResetting, lastDocId]);

  const replaceItem = useCallback((id: string, updater: (item: T) => T) => {
    setItems((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const visibleItems = clientFilter ? clientFilter(items) : items;

  return {
    items,
    visibleItems,
    filters,
    hasMore,
    isLoadingMore,
    isResetting,
    error,
    setError,
    loadMore,
    resetAndFetch,
    replaceItem,
    removeItem,
  };
}
