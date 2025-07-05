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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuizForm } from "@/components/admin/QuizForm";
import { SubjectForm } from "@/components/admin/SubjectForm";
import { FileForm } from "@/components/admin/FileForm";
import { VideoForm } from "@/components/admin/VideoForm";
import { LectureForm } from "@/components/admin/LectureForm";
import { useYears } from "@/hooks/useYears";
import {
  BookOpen,
  Plus,
  Search,
  PlayCircle,
  FileText,
  HelpCircle,
  Edit2,
  Trash2,
  Clock,
  Users,
  Calendar,
  GraduationCap,
  Stethoscope,
  Download,
  Upload,
  Video,
  FolderPlus,
  Loader2,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  lectures: Lecture[];
}

interface Lecture {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  files: FileResource[];
  quizzes: Quiz[];
}

interface Video {
  id: string;
  title: string;
  url: string;
  duration?: string;
}

interface FileResource {
  id: string;
  title: string;
  url: string;
  type: string;
  size?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: number;
  duration: number;
  passingScore: number;
}

export default function Years() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false);
  const [isFileFormOpen, setIsFileFormOpen] = useState(false);
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [isLectureFormOpen, setIsLectureFormOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [yearType, setYearType] = useState<"basic" | "clinical">("basic");

  const { years, loading, error, isOfflineMode, createSubject, createLecture, deleteLecture } = useYears();

  const handleVideoClick = (video: Video) => {
    window.open(video.url, "_blank");
  };

  const handleFileClick = (file: FileResource) => {
    window.open(file.url, "_blank");
  };

  const handleQuizClick = (quiz: Quiz) => {
    alert(
      `Starting Quiz: ${quiz.title}\nQuestions: ${quiz.questions}\nDuration: ${quiz.duration} minutes\nPassing Score: ${quiz.passingScore}%`,
    );
  };

  const handleAddQuiz = (lectureId: string) => {
    setSelectedLecture(lectureId);
    setSelectedQuiz(null);
    setIsQuizFormOpen(true);
  };

  const handleAddSubject = (year: number, type: "basic" | "clinical") => {
    setSelectedYear(year);
    setYearType(type);
    setIsSubjectFormOpen(true);
  };

  const handleAddLecture = (subject: any, type: "basic" | "clinical") => {
    setSelectedSubject(subject);
    setYearType(type);
    setIsLectureFormOpen(true);
  };

  const handleAddFile = (lectureId: string) => {
    setSelectedLecture(lectureId);
    setIsFileFormOpen(true);
  };

  const handleAddVideo = (lectureId: string) => {
    setSelectedLecture(lectureId);
    setIsVideoFormOpen(true);
  };

  if (isQuizFormOpen) {
    return (
      <QuizForm
        quiz={selectedQuiz}
        onClose={() => {
          setIsQuizFormOpen(false);
          setSelectedQuiz(null);
          setSelectedLecture(null);
        }}
        onSave={(quizData) => {
          console.log("Save quiz:", quizData, "for lecture:", selectedLecture);
          setIsQuizFormOpen(false);
          setSelectedQuiz(null);
          setSelectedLecture(null);
        }}
      />
    );
  }

  if (isSubjectFormOpen) {
    return (
      <SubjectForm
        year={selectedYear}
        yearType={yearType}
        onClose={() => {
          setIsSubjectFormOpen(false);
          setSelectedYear(null);
        }}
        onSave={async (subjectData) => {
          try {
            await createSubject({
              ...subjectData,
              yearId: `year${selectedYear}`,
              order: 1,
            });
            setIsSubjectFormOpen(false);
            setSelectedYear(null);
          } catch (error) {
            console.error("Error saving subject:", error);
            alert("Failed to save subject. Please try again.");
          }
        }}
      />
    );
  }

  if (isLectureFormOpen) {
    return (
      <LectureForm
        subjectId={selectedSubject?.id}
        subjectName={selectedSubject?.name}
        yearType={yearType}
        onClose={() => {
          setIsLectureFormOpen(false);
          setSelectedSubject(null);
        }}
        onSave={async (lectureData) => {
          try {
            await createLecture(lectureData);
            setIsLectureFormOpen(false);
            setSelectedSubject(null);
          } catch (error) {
            console.error("Error saving lecture:", error);
            alert("Failed to save lecture. Please try again.");
          }
        }}
      />
    );
  }

  if (isFileFormOpen) {
    return (
      <FileForm
        lectureId={selectedLecture}
        onClose={() => {
          setIsFileFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={(fileData) => {
          console.log("Save file:", fileData, "for lecture:", selectedLecture);
          setIsFileFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

  if (isVideoFormOpen) {
    return (
      <VideoForm
        lectureId={selectedLecture}
        onClose={() => {
          setIsVideoFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={(videoData) => {
          console.log(
            "Save video:",
            videoData,
            "for lecture:",
            selectedLecture,
          );
          setIsVideoFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Academic Years Management</h1>
          <p className="text-muted-foreground">
            Manage curriculum by academic years, subjects, and lectures
            {isOfflineMode && (
              <span className="ml-2 text-orange-600 font-medium">
                • Working in offline mode
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading academic years...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">⚠️ Error loading years</div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lectures, subjects, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Basic Years (1-3)
          </TabsTrigger>
          <TabsTrigger value="clinical" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Clinical Years (4-6)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-6">
            {years.filter(year => year.type === 'basic').map((yearData) => (
              <Card
                key={yearData.yearNumber}
                className="border-l-4 border-l-blue-500"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Year {yearData.yearNumber}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubject(yearData.yearNumber, "basic")}
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Add Subject
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {yearData.subjects.map((subject) => (
                      <AccordionItem
                        key={subject.id}
                        value={subject.id}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {subject.name}
                            </span>
                            <Badge variant="secondary">
                              {subject.lectures.length} lectures
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            {subject.lectures.map((lecture) => (
                              <Card
                                key={lecture.id}
                                className="bg-secondary/20"
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">
                                    {lecture.title}
                                  </CardTitle>
                                  {lecture.description && (
                                    <CardDescription>
                                      {lecture.description}
                                    </CardDescription>
                                  )}
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
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddVideo(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Video className="h-3 w-3 mr-1" />
                                          Add Video
                                        </Button>
                                      </div>
                                      {lecture.videos.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.videos.map((video) => (
                                            <button
                                              key={video.id}
                                              onClick={() =>
                                                handleVideoClick(video)
                                              }
                                              className="w-full p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <PlayCircle className="h-4 w-4 text-green-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-green-700">
                                                    {video.title}
                                                  </p>
                                                  {video.duration && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {video.duration}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </button>
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
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddFile(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Upload className="h-3 w-3 mr-1" />
                                          Add File
                                        </Button>
                                      </div>
                                      {lecture.files.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.files.map((file) => (
                                            <button
                                              key={file.id}
                                              onClick={() =>
                                                handleFileClick(file)
                                              }
                                              className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-blue-700">
                                                    {file.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {file.type}
                                                    </Badge>
                                                    {file.size && (
                                                      <span>{file.size}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
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
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddQuiz(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Quiz
                                        </Button>
                                      </div>
                                      {lecture.quizzes.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.quizzes.map((quiz) => (
                                            <button
                                              key={quiz.id}
                                              onClick={() =>
                                                handleQuizClick(quiz)
                                              }
                                              className="w-full p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4 text-purple-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-purple-700">
                                                    {quiz.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                      {quiz.questions} questions
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.duration}min
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.passingScore}% pass
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
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
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <div className="space-y-6">
            {years.filter(year => year.type === 'clinical').map((yearData) => (
              <Card key={yearData.year} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-red-600" />
                      Year {yearData.year}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAddSubject(yearData.year, "clinical")
                      }
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Add Subject
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {yearData.subjects.map((subject) => (
                      <AccordionItem
                        key={subject.id}
                        value={subject.id}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {subject.name}
                            </span>
                            <Badge variant="secondary">
                              {subject.lectures.length} lectures
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            {subject.lectures.map((lecture) => (
                              <Card
                                key={lecture.id}
                                className="bg-secondary/20"
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">
                                    {lecture.title}
                                  </CardTitle>
                                  {lecture.description && (
                                    <CardDescription>
                                      {lecture.description}
                                    </CardDescription>
                                  )}
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
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddVideo(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Video className="h-3 w-3 mr-1" />
                                          Add Video
                                        </Button>
                                      </div>
                                      {lecture.videos.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.videos.map((video) => (
                                            <button
                                              key={video.id}
                                              onClick={() =>
                                                handleVideoClick(video)
                                              }
                                              className="w-full p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <PlayCircle className="h-4 w-4 text-green-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-green-700">
                                                    {video.title}
                                                  </p>
                                                  {video.duration && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {video.duration}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </button>
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
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddFile(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Upload className="h-3 w-3 mr-1" />
                                          Add File
                                        </Button>
                                      </div>
                                      {lecture.files.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.files.map((file) => (
                                            <button
                                              key={file.id}
                                              onClick={() =>
                                                handleFileClick(file)
                                              }
                                              className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-blue-700">
                                                    {file.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {file.type}
                                                    </Badge>
                                                    {file.size && (
                                                      <span>{file.size}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
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
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddQuiz(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Quiz
                                        </Button>
                                      </div>
                                      {lecture.quizzes.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.quizzes.map((quiz) => (
                                            <button
                                              key={quiz.id}
                                              onClick={() =>
                                                handleQuizClick(quiz)
                                              }
                                              className="w-full p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4 text-purple-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-purple-700">
                                                    {quiz.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                      {quiz.questions} questions
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.duration}min
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.passingScore}% pass
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
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
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}