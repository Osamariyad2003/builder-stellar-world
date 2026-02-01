// Paginated years hook with OS-like caching
import { usePaginatedData } from "./usePaginatedData";
import { YearData } from "./useYears";
import { fetchBatches, fetchYearsForBatches, fetchSubjectsWithLectures } from "./useYearsData";

const YEARS_PER_PAGE = 5;

async function fetchYearsPage(
  pageIndex: number,
  pageSize: number
): Promise<{ data: YearData[]; total: number; hasMore: boolean }> {
  if (!navigator.onLine) {
    throw new Error("No internet connection");
  }

  // Fetch all data (we'll paginate client-side for now)
  const batches = await fetchBatches();
  const yearsData = await fetchYearsForBatches(batches);
  const subjects = await fetchSubjectsWithLectures();

  // Link subjects to years
  const completeYears = yearsData.map((year) => ({
    ...year,
    subjects: subjects
      .filter((subject) => subject.yearId === year.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const sortedYears = completeYears.sort((a, b) => a.yearNumber - b.yearNumber);

  // Paginate client-side
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = sortedYears.slice(startIndex, endIndex);
  const hasMore = endIndex < sortedYears.length;

  return {
    data: pageData,
    total: sortedYears.length,
    hasMore,
  };
}

export function useYearsPaginated(pageSize: number = YEARS_PER_PAGE) {
  return usePaginatedData<YearData>({
    queryKey: ["years-paginated"],
    queryFn: fetchYearsPage,
    pageSize,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep previous pages in cache
  });
}

