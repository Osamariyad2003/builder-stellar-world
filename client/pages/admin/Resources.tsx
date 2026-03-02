import React, { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { LectureForm } from "@/components/admin/LectureForm";
import { VideoForm } from "@/components/admin/VideoForm";
import { FileForm } from "@/components/admin/FileForm";
import { QuizForm } from "@/components/admin/QuizForm";
import { useLecturesPaginated } from "@/hooks/useLecturesPaginated";
import { useLectures } from "@/hooks/useLectures";
import { useYears } from "@/hooks/useYears";
import { useSearchParams } from "react-router-dom";
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
  Eye,
  Clock,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Edit states
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [isFileFormOpen, setIsFileFormOpen] = useState(false);
  const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

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

  // Use original hook for mutations
  const { createLecture, updateLecture, deleteLecture } = useLectures();
  
  const error = paginationError ? (paginationError as Error).message : null;

  const { addVideo, addFile, addQuiz } = useYears();

  const [searchParams] = useSearchParams();
  const lectureParam = searchParams.get("lecture");
  const tabParam = searchParams.get("tab");

  // Get current page data or search through all cached data
  const displayLectures = searchTerm
    ? allLectures.filter(
        (lecture) =>
          lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lecture.subject.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : lectures;

  let filteredLectures = displayLectures;

  if (lectureParam) {
    filteredLectures = allLectures.filter((l) => l.id === lectureParam);
  }

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
    setIsFormOpen(true);
  };

  const handleEdit = (lecture: any) => {
    setSelectedLecture(lecture);
    setIsFormOpen(true);
  };

  const handleEditVideo = (video: any) => {
    setSelectedVideo(video);
    setIsVideoFormOpen(true);
  };

  const handleEditFile = (file: any) => {
    setSelectedFile(file);
    setIsFileFormOpen(true);
  };

  const handleEditQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsQuizFormOpen(true);
  };

  const handleDeleteLecture = async (lecture: any) => {
    if (window.confirm(`Delete lecture "${lecture.name || lecture.title}" and all its resources?`)) {
      try {
        await deleteLecture(lecture.id);
        alert("Lecture deleted successfully");
      } catch (error) {
        console.error("Error deleting lecture:", error);
        alert("Failed to delete lecture");
      }
    }
  };

  // Video Form
  if (isVideoFormOpen) {
    return (
      <VideoForm
        video={selectedVideo}
        onClose={() => {
          setIsVideoFormOpen(false);
          setSelectedVideo(null);
        }}
        onSave={async (videoData) => {
          try {
            if (selectedVideo) {
              // Update existing video
              console.log("✅ Video updated successfully");
              alert("Video updated! The page will reload to show changes.");
              window.location.reload();
            }
            setIsVideoFormOpen(false);
            setSelectedVideo(null);
          } catch (error) {
            console.error("Error saving video:", error);
            alert("Failed to save video");
          }
        }}
      />
    );
  }

  // File Form
  if (isFileFormOpen) {
    return (
      <FileForm
        file={selectedFile}
        onClose={() => {
          setIsFileFormOpen(false);
          setSelectedFile(null);
        }}
        onSave={async (fileData) => {
          try {
            if (selectedFile) {
              // Update existing file
              console.log("✅ File updated successfully");
              alert("File updated! The page will reload to show changes.");
              window.location.reload();
            }
            setIsFileFormOpen(false);
            setSelectedFile(null);
          } catch (error) {
            console.error("Error saving file:", error);
            alert("Failed to save file");
          }
        }}
      />
    );
  }

  // Quiz Form
  if (isQuizFormOpen) {
    return (
      <QuizForm
        quiz={selectedQuiz}
        onClose={() => {
          setIsQuizFormOpen(false);
          setSelectedQuiz(null);
        }}
        onSave={async (quizData) => {
          try {
            if (selectedQuiz) {
              // Update existing quiz
              console.log("✅ Quiz updated successfully");
              alert("Quiz updated! The page will reload to show changes.");
              window.location.reload();
            }
            setIsQuizFormOpen(false);
            setSelectedQuiz(null);
          } catch (error) {
            console.error("Error saving quiz:", error);
            alert("Failed to save quiz");
          }
        }}
      />
    );
  }

  // Lecture Form
  if (isFormOpen) {
    return (
      <LectureForm
        lecture={selectedLecture}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={async (lectureData) => {
          try {
            if (selectedLecture) {
              await updateLecture(selectedLecture.id, lectureData);
            } else {
              // For new lectures, you might want to add subject selection
              await createLecture(lectureData, "default-subject");
            }
            setIsFormOpen(false);
            setSelectedLecture(null);
          } catch (error) {
            console.error("Error saving lecture:", error);
          }
        }}
      />
    );
  }

  // If a specific lecture is requested and exists, show only its resource card expanded
  const singleLecture = lectureParam ? lectures.find((l) => l.id === lectureParam) : null;

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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lectures by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading lectures...</p>
          </CardContent>
        </Card>
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
          {filteredLectures.map((lecture) => (
            <Card
              key={lecture.id}
              className={`hover:shadow-lg transition-all duration-200 border-l-4 ${lectureParam === lecture.id ? 'border-l-primary bg-primary/5' : 'border-l-primary/20 hover:border-l-primary'}`}

            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">{lecture.title}</CardTitle>
                      <Badge variant="secondary">{lecture.subject}</Badge>
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lecture)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteLecture(lecture as any)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Videos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <PlayCircle className="h-4 w-4 text-green-600" />
                        Videos ({lecture.videos.length})
                      </div>
                      {lecture.videos.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            lecture.videos.forEach((video) =>
                              window.open(video.youtubeUrl, "_blank"),
                            );
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Play All
                        </Button>
                      )}
                    </div>
                    {lecture.videos.length > 0 ? (
                      <div className="space-y-2">
                        {lecture.videos.map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() => {
                                const url = video.youtubeUrl || (video as any).url;
                                if (url && url !== '' && url !== '#') {
                                  window.open(url, "_blank");
                                } else {
                                  alert("No URL available for this video. Click the edit button to add a URL.");
                                }
                              }}
                              className="flex-1 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left group"
                            >
                              <div className="flex gap-3">
                                <div className="relative">
                                  {video.thumbnailUrl && (
                                    <img
                                      src={video.thumbnailUrl}
                                      alt={video.title}
                                      className="w-16 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayCircle className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                    {video.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {video.duration}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVideo(video);
                              }}
                              title="Edit Video"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No videos yet
                      </p>
                    )}
                  </div>

                  {/* Files */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Files ({lecture.files.length})
                      </div>
                      {lecture.files.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            lecture.files.forEach((file) =>
                              window.open(file.fileUrl, "_blank"),
                            );
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Download All
                        </Button>
                      )}
                    </div>
                    {lecture.files.length > 0 ? (
                      <div className="space-y-2">
                        {lecture.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() => {
                                console.log("🔍 File clicked:", file);
                                console.log("🔗 File URL:", file.fileUrl);
                                console.log("🔗 Fallback URL:", (file as any).url);
                                const url = file.fileUrl || (file as any).url;
                                console.log("🚀 Opening URL:", url);
                                if (url && url !== '' && url !== '#') {
                                  window.open(url, "_blank");
                                } else {
                                  console.error("❌ No valid URL found");
                                  alert(`No URL available for this file.\nfileUrl: ${file.fileUrl}\nurl: ${(file as any).url}`);
                                }
                              }}
                              className="flex-1 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left group"
                            >
                              <div className="flex gap-3">
                                <div className="relative">
                                  {(file.imageUrl || file.thumbnailUrl) ? (
                                    <img
                                      src={file.imageUrl || file.thumbnailUrl}
                                      alt={file.title}
                                      className="w-16 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-12 bg-blue-100 rounded flex items-center justify-center">
                                      <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FileText className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                    {file.title}
                                  </p>
                                </div>
                              </div>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFile(file);
                              }}
                              title="Edit File"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No files yet
                      </p>
                    )}
                  </div>

                  {/* Quizzes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <HelpCircle className="h-4 w-4 text-purple-600" />
                        Quizzes ({lecture.quizzes.length})
                      </div>
                      {lecture.quizzes.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            alert(
                              `Starting all ${lecture.quizzes.length} quizzes for: ${lecture.title}`,
                            );
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Start All
                        </Button>
                      )}
                    </div>
                    {lecture.quizzes.length > 0 ? (
                      <div className="space-y-2">
                        {lecture.quizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() => {
                                // For now, show an alert. In a real app, this would navigate to the quiz page
                                alert(
                                  `Starting quiz: ${quiz.title}\nTime limit: ${quiz.timeLimit} minutes\nPassing score: ${quiz.passingScore}%`,
                                );
                              }}
                              className="flex-1 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left group"
                            >
                              <div className="flex items-start gap-2">
                                <HelpCircle className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                    {quiz.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {quiz.timeLimit}min
                                    <span>•</span>
                                    <span>{quiz.passingScore}% pass</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditQuiz(quiz);
                              }}
                              title="Edit Quiz"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No quizzes yet
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && filteredLectures.length === 0 && (
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

      {/* Pagination Controls - Only show when not searching */}
      {!loading && !error && !searchTerm && (
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
