// OS-like paging system with cache for previous pages
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

export interface PaginatedDataOptions<T> {
  queryKey: string[];
  queryFn: (page: number, pageSize: number) => Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function usePaginatedData<T>({
  queryKey,
  queryFn,
  pageSize = 10,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  gcTime = 30 * 60 * 1000, // 30 minutes
}: PaginatedDataOptions<T>) {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...queryKey, pageSize],
    queryFn: ({ pageParam = 0 }) => queryFn(pageParam, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length; // Next page index
    },
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
    // Keep previous pages in cache (OS-like paging)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Flatten all pages into a single array (all cached pages)
  const allData = data?.pages.flatMap((page) => page.data) ?? [];
  
  // Get current page data
  const currentPageIndex = data?.pages.length ? data.pages.length - 1 : 0;
  const currentPageData = data?.pages[currentPageIndex]?.data ?? [];
  
  // Total count across all pages
  const totalCount = data?.pages[0]?.total ?? 0;
  
  // Get specific page from cache (OS-like page access)
  const getPage = (pageIndex: number): T[] => {
    return data?.pages[pageIndex]?.data ?? [];
  };

  // Check if page is cached
  const isPageCached = (pageIndex: number): boolean => {
    return (data?.pages.length ?? 0) > pageIndex;
  };

  // Prefetch next page (like OS prefetching)
  const prefetchNextPage = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Invalidate cache for specific page
  const invalidatePage = (pageIndex: number) => {
    queryClient.setQueryData(
      [...queryKey, pageSize],
      (old: any) => {
        if (!old) return old;
        const newPages = [...old.pages];
        if (newPages[pageIndex]) {
          // Mark page as stale by removing it
          newPages.splice(pageIndex, 1);
        }
        return { ...old, pages: newPages };
      }
    );
  };

  // Clear all cached pages
  const clearCache = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    // Current page data
    data: currentPageData,
    // All cached pages data
    allData,
    // Pagination info
    currentPage: currentPageIndex,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
    error,
    // Actions
    loadNextPage: fetchNextPage,
    prefetchNextPage,
    getPage,
    isPageCached,
    invalidatePage,
    clearCache,
    refetch,
  };
}

