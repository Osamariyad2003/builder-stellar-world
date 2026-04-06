import React, { useState, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LectureForm } from "@/components/admin/LectureForm";
import { useLecturesPaginated } from "@/hooks/useLecturesPaginated";
import {
  createLectureFromForm,
  updateLectureFromForm,
  deleteLectureById,
} from "@/lib/lectureMutations";
import { useYears } from "@/hooks/useYears";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PaginatedList } from "@/components/ui/PaginatedList";
import {
  Plus,
  Search,
  BookOpen,
  PlayCircle,
  FileText,
  HelpCircle,
  Edit2,
  Trash2,
  Users,
  Calendar,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SortField = "subject" | "title" | "date" | "order";
type SortOrder = "asc" | "desc";

/** Prefer denormalized counters from Firestore; fall back to embedded arrays if present. */
const getResourceCounts = (lecture: {
  videosCount?: number;
  filesCount?: number;
  quizzesCount?: number;
  videos?: { length: number };
  files?: { length: number };
  quizzes?: { length: number };
}) => ({
  videos: lecture.videosCount ?? lecture.videos?.length ?? 0,
  files: lecture.filesCount ?? lecture.files?.length ?? 0,
  quizzes: lecture.quizzesCount ?? lecture.quizzes?.length ?? 0,
});

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortField>("subject");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const {
    data: lectures,
    allData: allLectures,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    isLoading: loading,
    isFetchingNextPage,
    error: paginationError,
    loadNextPage,
    getPage,
    isPageCached,
    prefetchNextPage,
  } = useLecturesPaginated(pageSize);

  const queryClient = useQueryClient();
  const error = paginationError ? (paginationError as Error).message : null;

  const { years } = useYears();

  const deferredSearch = useDeferredValue(searchTerm);

  // Subject names exact to years tabs: subjectId -> name
  const subjectIdToName = React.useMemo(() => {
    const m: Record<string, string> = {};
    (years || []).forEach((y: any) =>
      (y.subjects || []).forEach((s: any) => {
        m[s.id] = s.name || s.id;
      })
    );
    return m;
  }, [years]);

  // All subjects for Create Lecture (from years) — used to relate new lecture to a subject
  const allSubjectsForForm = React.useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    (years || []).forEach((y: any) =>
      (y.subjects || []).forEach((s: any) => {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          list.push({ id: s.id, name: s.name || s.id });
        }
      })
    );
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [years]);

  // Filter dropdown: retrieve all subjects (from years) so every subject appears in the filter
  const subjectOptions = React.useMemo(() => {
    return allSubjectsForForm.map((s) => s.id);
  }, [allSubjectsForForm]);

  // Base list: when subject filter is on, use all loaded lectures filtered by subject; otherwise current page or all for search
  const baseList = subjectFilter
    ? allLectures.filter(
        (l) => (l.subject || "Unknown").trim() === subjectFilter,
      )
    : deferredSearch
      ? allLectures
      : lectures;

  const displayLectures = deferredSearch
    ? baseList.filter(
        (lecture) =>
          lecture.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          (lecture.subject || "").toLowerCase().includes(deferredSearch.toLowerCase()),
      )
    : baseList;

  const filteredLectures = displayLectures;

  // Sort by subject, title, date, or order
  const sortedLectures = React.useMemo(() => {
    const list = [...filteredLectures];
    const mult = sortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "subject") {
        const sa = (a.subject || "Unknown").toLowerCase();
        const sb = (b.subject || "Unknown").toLowerCase();
        return mult * sa.localeCompare(sb);
      }
      if (sortBy === "title") {
        const ta = (a.title || "").toLowerCase();
        const tb = (b.title || "").toLowerCase();
        return mult * ta.localeCompare(tb);
      }
      if (sortBy === "date") {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return mult * (da - db);
      }
      // order
      const oa = (a as any).order ?? 0;
      const ob = (b as any).order ?? 0;
      return mult * (oa - ob);
    });
    return list;
  }, [filteredLectures, sortBy, sortOrder]);

  // Get cached pages for display
  const cachedPages: number[] = [];
  for (let i = 0; i <= currentPage; i++) {
    if (isPageCached(i)) {
      cachedPages.push(i);
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPageIndex(page);
    // If page is not cached, it will be loaded automatically by React Query
    if (!isPageCached(page) && page > currentPage) {
      loadNextPage();
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPageIndex(0);
  };

  // Prefetch next page when user scrolls near bottom
  React.useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      const timer = setTimeout(() => {
        prefetchNextPage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasNextPage, isFetchingNextPage, prefetchNextPage]);

  const handleCreateNew = () => {
    setSelectedLecture(null);
    if (allSubjectsForForm.length === 0) {
      alert("No subjects found. Add subjects from the Years page first, then create a lecture.");
      return;
    }
    setIsFormOpen(true);
  };

  const handleEdit = (lecture: any) => {
    setSelectedLecture({
      ...lecture,
      name: lecture.title || lecture.name,
    });
    setIsFormOpen(true);
  };

  const handleDeleteLecture = async (lecture: any) => {
    if (window.confirm(`Delete lecture "${lecture.name || lecture.title}" and all its resources?`)) {
      try {
        await deleteLectureById(lecture.id);
        await queryClient.invalidateQueries({ queryKey: ["lectures-paginated"] });
        alert("Lecture deleted successfully");
      } catch (error) {
        console.error("Error deleting lecture:", error);
        alert("Failed to delete lecture");
      }
    }
  };

  // Lecture Form
  if (isFormOpen) {
    const isNewLecture = !selectedLecture;
    return (
      <LectureForm
        lecture={selectedLecture}
        subjectId={isNewLecture ? null : (selectedLecture?.subject || (selectedLecture as any)?.subjectId) || null}
        subjectName={isNewLecture ? undefined : (selectedLecture?.subject ? subjectIdToName[selectedLecture.subject] : undefined)}
        subjects={isNewLecture ? allSubjectsForForm : undefined}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={async (lectureData) => {
          try {
            if (selectedLecture) {
              await updateLectureFromForm(selectedLecture.id, lectureData as Record<string, unknown>);
            } else {
              const subjectId = lectureData.subjectId as string;
              if (!subjectId) {
                alert("Please select a subject for the new lecture.");
                return;
              }
              await createLectureFromForm(lectureData as Record<string, unknown>, subjectId);
            }
            await queryClient.invalidateQueries({ queryKey: ["lectures-paginated"] });
            setIsFormOpen(false);
            setSelectedLecture(null);
          } catch (error) {
            console.error("Error saving lecture:", error);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resources Management</h1>
          <p className="text-muted-foreground">
            Organize educational content by lectures with videos, files, and
            quizzes
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Lecture
        </Button>
      </div>

      {/* Search, Filter and Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lectures by title or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search lectures"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
                <label htmlFor="filter-subject" className="text-sm font-medium whitespace-nowrap">
                  Subject
                </label>
                <select
                  id="filter-subject"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[140px]"
                  aria-label="Filter by subject"
                >
                  <option value="">All subjects</option>
                  {subjectOptions.map((sub) => (
                    <option key={sub} value={sub}>
                      {subjectIdToName[sub] || sub}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted-foreground hidden sm:inline">|</span>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:inline" aria-hidden />
                <label htmlFor="sort-by" className="text-sm font-medium whitespace-nowrap">
                  Sort by
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  aria-label="Sort by field"
                >
                  <option value="subject">Subject</option>
                  <option value="title">Title</option>
                  <option value="date">Date</option>
                  <option value="order">Order</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  aria-label="Sort order"
                >
                  <option value="asc">A–Z / Oldest first</option>
                  <option value="desc">Z–A / Newest first</option>
                </select>
              </div>
            </div>
            {subjectFilter && (
              <p className="text-sm text-muted-foreground">
                Showing lectures in subject: <strong>{subjectIdToName[subjectFilter] || subjectFilter}</strong>
                {" "}
                <button
                  type="button"
                  onClick={() => setSubjectFilter("")}
                  className="text-primary hover:underline"
                  aria-label="Clear subject filter"
                >
                  Clear filter
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading — skeleton list */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 flex gap-4">
                <Skeleton className="h-20 w-20 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-2/3 max-w-md" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">
              ⚠️ Error loading lectures
            </div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Lectures List */}
      {!loading && !error && (
        <div className="space-y-6">
          {sortedLectures.map((lecture) => {
            const counts = getResourceCounts(lecture);
            return (
            <Card
              key={lecture.id}
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary"

            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    {lecture.imageUrl ? (
                      <img
                        src={lecture.imageUrl}
                        alt=""
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0 border bg-muted"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                        <CardTitle className="text-xl">{lecture.title}</CardTitle>
                        <Badge variant="secondary">
                          {subjectIdToName[lecture.subject] || (lecture as { subjectId?: string }).subjectId || lecture.subject}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Order {(lecture as { order?: number }).order ?? "—"}
                        </span>
                      </div>
                      <CardDescription className="text-base">
                        {lecture.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {lecture.createdBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {lecture.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                    <Button variant="secondary" size="sm" asChild>
                      <Link
                        to={`/admin/resources/lectures/${lecture.id}?subject=${encodeURIComponent(lecture.subject || "")}`}
                      >
                        Manage resources
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lecture)}
                      aria-label="Edit lecture"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteLecture(lecture as any)}
                      aria-label="Delete lecture"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <PlayCircle className="h-3 w-3 text-green-600" />
                    Videos {counts.videos}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3 text-blue-600" />
                    Files {counts.files}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <HelpCircle className="h-3 w-3 text-purple-600" />
                    Quizzes {counts.quizzes}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Open <strong>Manage resources</strong> to edit files, videos, and quizzes for this lecture only. Counters are stored on the lecture document.
                </p>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && sortedLectures.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lectures found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "No lectures match your search criteria."
                : "Start by creating your first lecture with videos, files, and quizzes."}
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lecture
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination: hide when searching or when there are no lectures */}
      {!loading && !error && !deferredSearch && totalCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <PaginatedList
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              hasNextPage={hasNextPage}
              isLoading={loading}
              isFetchingNextPage={isFetchingNextPage}
              cachedPages={cachedPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onLoadNext={loadNextPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
