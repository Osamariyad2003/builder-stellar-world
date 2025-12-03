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
import { useLectures } from "@/hooks/useLectures";
import { useYears } from "@/hooks/useYears";
import { useSearchParams } from "react-router-dom";
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
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editingVideoLecture, setEditingVideoLecture] = useState<any>(null);
  const [editingFileLecture, setEditingFileLecture] = useState<any>(null);
  const [editingQuizLecture, setEditingQuizLecture] = useState<any>(null);

  const {
    lectures,
    loading,
    error,
    createLecture,
    updateLecture,
    deleteLecture,
  } = useLectures();

  const { addVideo, addFile, addQuiz } = useYears();

  const [searchParams] = useSearchParams();
  const lectureParam = searchParams.get("lecture");
  const tabParam = searchParams.get("tab");

  let filteredLectures = lectures.filter(
    (lecture) =>
      lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecture.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (lectureParam) {
    filteredLectures = lectures.filter((l) => l.id === lectureParam);
  }

  const handleCreateNew = () => {
    setSelectedLecture(null);
    setIsFormOpen(true);
  };

  const handleEdit = (lecture: any) => {
    setSelectedLecture(lecture);
    setIsFormOpen(true);
  };

  const handleDeleteLecture = async (lecture: any) => {
    if (confirm(`Delete lecture "${lecture.title}" and all its resources?`)) {
      try {
        await deleteLecture(lecture.id);
        alert("Lecture deleted successfully");
      } catch (error) {
        console.error("Error deleting lecture:", error);
        alert("Failed to delete lecture");
      }
    }
  };

  // Show video edit form
  if (editingVideo && editingVideoLecture) {
    return (
      <VideoForm
        video={editingVideo}
        lectureId={editingVideoLecture.id}
        onClose={() => {
          setEditingVideo(null);
          setEditingVideoLecture(null);
        }}
        onSave={async (videoData) => {
          try {
            // Update video (would need to implement in useYears or useLectures)
            console.log("Video updated:", videoData);
            alert("Video updated successfully");
            setEditingVideo(null);
            setEditingVideoLecture(null);
          } catch (error) {
            console.error("Error saving video:", error);
          }
        }}
      />
    );
  }

  // Show file edit form
  if (editingFile && editingFileLecture) {
    return (
      <FileForm
        file={editingFile}
        lectureId={editingFileLecture.id}
        onClose={() => {
          setEditingFile(null);
          setEditingFileLecture(null);
        }}
        onSave={async (fileData) => {
          try {
            // Update file (would need to implement in useYears or useLectures)
            console.log("File updated:", fileData);
            alert("File updated successfully");
            setEditingFile(null);
            setEditingFileLecture(null);
          } catch (error) {
            console.error("Error saving file:", error);
          }
        }}
      />
    );
  }

  // Show quiz edit form
  if (editingQuiz && editingQuizLecture) {
    return (
      <QuizForm
        quiz={editingQuiz}
        onClose={() => {
          setEditingQuiz(null);
          setEditingQuizLecture(null);
        }}
        onSave={async (quizData) => {
          try {
            // Update quiz (would need to implement in useYears or useLectures)
            console.log("Quiz updated:", quizData);
            alert("Quiz updated successfully");
            setEditingQuiz(null);
            setEditingQuizLecture(null);
          } catch (error) {
            console.error("Error saving quiz:", error);
          }
        }}
      />
    );
  }

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
                      onClick={() => handleDeleteLecture(lecture)}
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
                            className="w-full p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors group flex items-center justify-between"
                          >
                            <button
                              onClick={() =>
                                window.open(video.youtubeUrl, "_blank")
                              }
                              className="flex-1 text-left"
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
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingVideo(video);
                                  setEditingVideoLecture(lecture);
                                }}
                                className="h-8 w-8"
                                title="Edit Video"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  confirm(`Delete video "${video.title}"?`) &&
                                  alert("Delete functionality coming soon")
                                }
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete Video"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                            className="w-full p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors group flex items-center justify-between"
                          >
                            <button
                              onClick={() => window.open(file.fileUrl, "_blank")}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                    {file.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {file.fileType}
                                    </Badge>
                                    <span>{file.fileSize}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingFile(file);
                                  setEditingFileLecture(lecture);
                                }}
                                className="h-8 w-8"
                                title="Edit File"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  confirm(`Delete file "${file.title}"?`) &&
                                  alert("Delete functionality coming soon")
                                }
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete File"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                            className="w-full p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors group flex items-center justify-between"
                          >
                            <button
                              onClick={() => {
                                // For now, show an alert. In a real app, this would navigate to the quiz page
                                alert(
                                  `Starting quiz: ${quiz.title}\nTime limit: ${quiz.timeLimit} minutes\nPassing score: ${quiz.passingScore}%`,
                                );
                              }}
                              className="flex-1 text-left"
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
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingQuiz(quiz);
                                  setEditingQuizLecture(lecture);
                                }}
                                className="h-8 w-8"
                                title="Edit Quiz"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  confirm(`Delete quiz "${quiz.title}"?`) &&
                                  alert("Delete functionality coming soon")
                                }
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete Quiz"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
    </div>
  );
}
