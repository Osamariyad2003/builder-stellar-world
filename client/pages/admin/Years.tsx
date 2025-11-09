import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";
import { useNews } from "@/hooks/useNews";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  PlayCircle,
  FileText,
  HelpCircle,
  Trash2,
  GraduationCap,
  Stethoscope,
  Upload,
  Video,
  FolderPlus,
  Loader2,
} from "lucide-react";

export default function Years() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false);
  const [isFileFormOpen, setIsFileFormOpen] = useState(false);
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [isLectureFormOpen, setIsLectureFormOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<{
    id: string;
    number: number;
    semester?: string;
  } | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [yearType, setYearType] = useState<"basic" | "clinical">("basic");
  const [expanded, setExpanded] = useState<
    Record<string, { videos: boolean; files: boolean; quizzes: boolean }>
  >({});

  // Inline editor state for batch name per-year card
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingBatchValue, setEditingBatchValue] = useState<string>("");
  const [editingBatchCR, setEditingBatchCR] = useState<string>("");

  // Add Batch dialog state
  const [batchName, setBatchName] = useState<string>("");
  const [batchCR, setBatchCR] = useState<string>("");

  // Selected batch for viewing years (sync with ?batch= query param)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const b = qp.get("batch");
    setSelectedBatchId(b);
  }, [location.search]);

  const toggleSection = (
    lectureId: string,
    section: "videos" | "files" | "quizzes",
  ) => {
    setExpanded((prev) => ({
      ...prev,
      [lectureId]: {
        videos: false,
        files: false,
        quizzes: false,
        ...(prev[lectureId] || {}),
        [section]: !(prev[lectureId]?.[section] || false),
      },
    }));
  };

  const {
    years,
    batches,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
    updateYear,
    updateBatch,
    createSubject,
    createLecture,
    createYear,
    createBatch,
    deleteLecture,
    deleteSubject,
    addVideo,
    addFile,
    addQuiz,
  } = useYears();

  const { news } = useNews();

  const handleAddQuiz = (subject: any, lectureId: string) => {
    setSelectedSubject(subject);
    setSelectedLecture(lectureId);
    setSelectedQuiz(null);
    setIsQuizFormOpen(true);
  };

  const handleAddSubject = (yearData: any, type: "basic" | "clinical") => {
    console.log(
      "🔄 Opening subject form for year:",
      yearData.yearNumber,
      "type:",
      type,
    );
    setSelectedYear({
      id: yearData.id,
      number: yearData.yearNumber,
    });
    setYearType(type);
    setIsSubjectFormOpen(true);
  };

  const handleAddLecture = (subject: any, type: "basic" | "clinical") => {
    setSelectedSubject(subject);
    setYearType(type);
    setIsLectureFormOpen(true);
  };

  const handleAddFile = (subject: any, lectureId: string) => {
    setSelectedSubject(subject);
    setSelectedLecture(lectureId);
    setIsFileFormOpen(true);
  };

  const handleAddVideo = (subject: any, lectureId: string) => {
    setSelectedSubject(subject);
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
        onSave={async (quizData) => {
          if (selectedSubject?.id && selectedLecture) {
            await addQuiz(selectedSubject.id, selectedLecture, {
              title: quizData.title,
              description: quizData.description,
              questions: quizData.questions || [],
              timeLimit: quizData.timeLimit,
              passingScore: quizData.passingScore,
            });
          }
          setIsQuizFormOpen(false);
          setSelectedQuiz(null);
          setSelectedLecture(null);
        }}
      />
    );
  }

  console.log(
    "🔍 Render check - isSubjectFormOpen:",
    isSubjectFormOpen,
    "selectedYear:",
    selectedYear,
  );

  if (isSubjectFormOpen) {
    console.log("📝 Rendering SubjectForm");
    return (
      <SubjectForm
        year={selectedYear?.number}
        yearType={yearType}
        onClose={() => {
          setIsSubjectFormOpen(false);
          setSelectedYear(null);
        }}
        onSave={async (subjectData) => {
          try {
            await createSubject({
              ...subjectData,
              yearId: selectedYear?.id || "",
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
        onSave={async (fileData) => {
          if (selectedSubject?.id && selectedLecture) {
            await addFile(selectedSubject.id, selectedLecture, fileData);
          }
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
        onSave={async (videoData) => {
          if (selectedSubject?.id && selectedLecture) {
            await addVideo(selectedSubject.id, selectedLecture, videoData);
          }
          setIsVideoFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

  const renderYearCard = (yearData: any, type: "basic" | "clinical") => (
    <Card
      key={yearData.yearNumber}
      className={`border-l-4 ${
        type === "basic" ? "border-l-blue-500" : "border-l-red-500"
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {yearData.imageUrl ? (
              <img
                src={yearData.imageUrl}
                alt={`Year ${yearData.yearNumber}`}
                className="w-24 h-16 object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-24 h-16 rounded-md bg-muted flex items-center justify-center">
                {type === "basic" ? (
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                ) : (
                  <Stethoscope className="h-6 w-6 text-red-600" />
                )}
              </div>
            )}

            <CardTitle className="flex flex-col">
              {editingBatchId === yearData.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={editingBatchValue}
                    onChange={(e) => setEditingBatchValue(e.target.value)}
                    className="w-48"
                    placeholder="Batch name"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateYear?.(yearData.id, {
                          batchName: editingBatchValue,
                          batch_name: editingBatchValue,
                        });
                        setEditingBatchId(null);
                        setEditingBatchValue("");
                      } catch (e) {
                        console.error(e);
                        alert("Failed to save batch name");
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingBatchId(null);
                      setEditingBatchValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  {yearData.batchName ? (
                    <>
                      <Link
                        to={`/admin/years/${yearData.id}`}
                        className="text-lg font-bold text-foreground hover:underline"
                      >
                        {yearData.batchName}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="text-sm text-muted">Year {yearData.yearNumber}</span>
                        {yearData.name && (<span className="ml-2">• {yearData.name}</span>)}
                        {yearData.academicSupervisor && (
                          <div className="mt-1 text-sm text-muted-foreground">Academic Supervisor: {yearData.academicSupervisor}</div>
                        )}
                        {yearData.cr && (
                          <div className="text-sm text-muted-foreground">CR: {yearData.cr}</div>
                        )}
                        {yearData.actor && (
                          <div className="text-sm text-muted-foreground">Actor: {yearData.actor}</div>
                        )}

                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/admin/years/${yearData.id}`}
                        className="text-lg font-medium text-blue-600 hover:underline"
                      >
                        Year {yearData.yearNumber}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">
                        {yearData.name ? (<span className="mr-2">{yearData.name}</span>) : (<span className="italic">No batch name</span>)}
                        {yearData.academicSupervisor && (
                          <div className="mt-1 text-sm text-muted-foreground">Academic Supervisor: {yearData.academicSupervisor}</div>
                        )}
                        {yearData.cr && (
                          <div className="text-sm text-muted-foreground">CR: {yearData.cr}</div>
                        )}
                        {yearData.actor && (
                          <div className="text-sm text-muted-foreground">Actor: {yearData.actor}</div>
                        )}

                      </div>
                    </>
                  )}
                </>
              )}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Subjects</span>
              <Badge variant="secondary">
                {yearData.subjects?.length || 0} subjects
              </Badge>
              <Badge variant="outline">
                {(news || []).filter((n) => n.yearId === yearData.id).length}{" "}
                news
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddSubject(yearData, type)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Subject
            </Button>
          </div>

          {!yearData.subjects || yearData.subjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                No subjects added yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSubject(yearData, type)}
              >
                Add first subject
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {yearData.subjects?.map((subject: any) => (
                <Card key={subject.id} className="bg-secondary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {subject.imageUrl ? (
                          <img
                            src={subject.imageUrl}
                            alt={subject.name}
                            className="w-8 h-8 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        )}

                        <Link
                          to={`/admin/subjects/${subject.id}`}
                          className="font-medium text-lg text-blue-600 hover:underline"
                        >
                          {subject.name}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {subject.lectures?.length || 0} lectures
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddLecture(subject, type)}
                          className="h-8 px-3 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Lecture
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (
                              !confirm(
                                `Delete subject "${subject.name}"? This will remove its lectures.`,
                              )
                            )
                              return;
                            try {
                              await deleteSubject(subject.id);
                            } catch (e) {
                              console.error(e);
                              alert("Failed to delete subject");
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {subject.lectures && subject.lectures.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {subject.lectures.slice(0, 3).map((lecture: any) => (
                          <Card
                            key={lecture.id}
                            className="bg-background border"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="relative w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  {lecture.imageUrl ? (
                                    <img
                                      src={lecture.imageUrl}
                                      alt={lecture.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <PlayCircle className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm mb-1 truncate">
                                    {lecture.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                    {lecture.description ||
                                      "No description available"}
                                  </p>

                                  {/* Stats and Actions */}
                                  <div className="flex items-center gap-1 mb-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleSection(lecture.id, "videos")
                                      }
                                      className={`h-6 px-2 text-xs ${expanded[lecture.id]?.videos ? "bg-accent" : ""}`}
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Videos ({lecture.videos?.length || 0})
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleSection(lecture.id, "files")
                                      }
                                      className={`h-6 px-2 text-xs ${expanded[lecture.id]?.files ? "bg-accent" : ""}`}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Files ({lecture.files?.length || 0})
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleSection(lecture.id, "quizzes")
                                      }
                                      className={`h-6 px-2 text-xs ${expanded[lecture.id]?.quizzes ? "bg-accent" : ""}`}
                                    >
                                      <HelpCircle className="h-3 w-3 mr-1" />
                                      Quizzes ({lecture.quizzes?.length || 0})
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={async () => {
                                        if (
                                          !confirm(
                                            `Delete lecture "${lecture.name}"?`,
                                          )
                                        )
                                          return;
                                        try {
                                          await deleteLecture(
                                            subject.id,
                                            lecture.id,
                                          );
                                        } catch (e) {
                                          console.error(e);
                                          alert("Failed to delete lecture");
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Video Links */}
                                  {expanded[lecture.id]?.videos && (
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                          Videos:
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() =>
                                            handleAddVideo(subject, lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                      </div>
                                      <div className="space-y-1">
                                        {lecture.videos &&
                                        lecture.videos.length > 0 ? (
                                          lecture.videos
                                            .slice(0, 4)
                                            .map((video: any) => (
                                              <div
                                                key={video.id}
                                                className="flex items-center gap-2"
                                              >
                                                <Video className="h-3 w-3 text-blue-600" />
                                                <a
                                                  href={video.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline truncate"
                                                >
                                                  {video.title ||
                                                    video.name ||
                                                    "Untitled Video"}
                                                </a>
                                              </div>
                                            ))
                                        ) : (
                                          <p className="text-sm text-muted-foreground">
                                            No videos yet
                                          </p>
                                        )}

                                        {lecture.videos &&
                                          lecture.videos.length > 4 && (
                                            <p className="text-xs text-muted-foreground">
                                              +{lecture.videos.length - 4} more
                                              videos
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                  {/* File Links */}
                                  {expanded[lecture.id]?.files && (
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                          Files:
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() =>
                                            handleAddFile(subject, lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                      </div>
                                      <div className="space-y-1">
                                        {lecture.files &&
                                        lecture.files.length > 0 ? (
                                          lecture.files
                                            .slice(0, 4)
                                            .map((file: any) => (
                                              <div
                                                key={file.id}
                                                className="flex items-center gap-2"
                                              >
                                                <FileText className="h-3 w-3 text-green-600" />
                                                <a
                                                  href={file.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-green-600 hover:underline truncate"
                                                >
                                                  {file.title ||
                                                    file.name ||
                                                    "Untitled File"}
                                                </a>
                                              </div>
                                            ))
                                        ) : (
                                          <p className="text-sm text-muted-foreground">
                                            No files yet
                                          </p>
                                        )}

                                        {lecture.files &&
                                          lecture.files.length > 4 && (
                                            <p className="text-xs text-muted-foreground">
                                              +{lecture.files.length - 4} more
                                              files
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Quiz Info */}
                                  {expanded[lecture.id]?.quizzes && (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                          Quizzes:
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="xs"
                                          onClick={() =>
                                            handleAddQuiz(subject, lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                      </div>
                                      <div className="space-y-1">
                                        {lecture.quizzes &&
                                        lecture.quizzes.length > 0 ? (
                                          lecture.quizzes
                                            .slice(0, 4)
                                            .map((quiz: any) => (
                                              <div
                                                key={quiz.id}
                                                className="flex items-center gap-2"
                                              >
                                                <HelpCircle className="h-3 w-3 text-purple-600" />
                                                <span className="text-xs text-purple-600">
                                                  {quiz.title ||
                                                    quiz.name ||
                                                    "Untitled Quiz"}
                                                </span>
                                              </div>
                                            ))
                                        ) : (
                                          <p className="text-sm text-muted-foreground">
                                            No quizzes yet
                                          </p>
                                        )}

                                        {lecture.quizzes &&
                                          lecture.quizzes.length > 4 && (
                                            <p className="text-xs text-muted-foreground">
                                              +{lecture.quizzes.length - 4} more
                                              quizzes
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {subject.lectures.length > 3 && (
                          <div className="text-center text-muted-foreground text-xs pt-2">
                            +{subject.lectures.length - 3} more lectures
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Academic Years Management</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Manage curriculum by academic years, subjects, and lectures
            </p>
            {connectionStatus === "connecting" && (
              <span className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting...
              </span>
            )}
            {connectionStatus === "connected" && (
              <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                <div className="h-2 w-2 bg-green-600 rounded-full" />
                Connected
              </span>
            )}
            {connectionStatus === "offline" && (
              <span className="flex items-center gap-1 text-orange-600 font-medium text-sm">
                <div className="h-2 w-2 bg-orange-600 rounded-full" />
                Offline Mode
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" /> Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Batch</DialogTitle>
                <DialogDescription>Create a new batch for grouping years</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Batch name</label>
                  <Input value={batchName} onChange={(e)=>setBatchName(e.target.value)} placeholder="e.g., Batch A" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CR (optional)</label>
                  <Input value={batchCR} onChange={(e)=>setBatchCR(e.target.value)} placeholder="Class representative" />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button onClick={async ()=>{
                  try{
                    if(!batchName || !batchName.trim()) { alert('Please provide a batch name'); return; }
                    await createBatch?.({ batchName: batchName.trim(), cr: batchCR?.trim() });
                    setBatchName(''); setBatchCR('');
                    // close dialog
                    const closeBtn = document.querySelector('[data-dialog-close]') as HTMLElement | null;
                    if(closeBtn) closeBtn.click();
                    alert('Batch created');
                  }catch(e){ console.error(e); alert('Failed to create batch'); }
                }}>
                  Create
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" className="ml-2" data-dialog-close>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={retryConnection} variant="outline">
                Retry Connection
              </Button>
              <Button
                onClick={() => window.location.replace(window.location.href)}
                variant="ghost"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
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

          {/* Show batches list or the selected batch's years */}
          <div className="space-y-6">
            {(!batches || batches.length === 0) ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No batches found</h3>
                  <p className="text-muted-foreground mb-4">Create a batch to start adding academic years.</p>
                </CardContent>
              </Card>
            ) : selectedBatchId ? (
              (() => {
                const batch = (batches || []).find((b:any) => b.id === selectedBatchId) || null;
                const yearsForBatch = (years || []).filter((y:any) => (y.batchId || y.batch_name) === selectedBatchId);
                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {batch?.imageUrl ? (
                          <img src={batch.imageUrl} alt={batch.batchName} className="w-24 h-16 object-cover rounded-md" />
                        ) : (
                          <div className="w-24 h-16 rounded-md bg-muted flex items-center justify-center"><BookOpen className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                        <div>
                          <h2 className="text-xl font-semibold">{batch?.batchName || 'Batch'}</h2>
                          <div className="text-sm text-muted-foreground">{batch?.cr ? `CR: ${batch.cr}` : ''}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button onClick={() => { setSelectedBatchId(null); navigate('/admin/years'); }}>Back to Batches</Button>
                        <Button onClick={async ()=>{ try{ const yearNumStr = window.prompt('Enter year number for this batch:'); if(!yearNumStr) return; const yearNum = parseInt(yearNumStr,10); if(isNaN(yearNum)){ alert('Invalid'); return;} await createYear?.(batch?.id || null, { yearNumber: yearNum }); alert('Year created'); }catch(e){console.error(e); alert('Failed');}}}>
                          <Plus className="h-4 w-4 mr-2" /> Add Year
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {yearsForBatch.length === 0 ? (
                        <Card><CardContent className="p-6 text-center">No years in this batch yet.</CardContent></Card>
                      ) : (
                        yearsForBatch.sort((a:any,b:any)=>a.yearNumber-b.yearNumber).map((yd:any)=> (
                          <div key={yd.id}>{renderYearCard(yd, yd.type)}</div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              // list batches
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(batches || []).map((b:any)=> (
                  <Card key={b.id} className="cursor-pointer" onClick={()=>{ navigate(`/admin/years?batch=${b.id}`); setSelectedBatchId(b.id); }}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        {b.imageUrl ? <img src={b.imageUrl} alt={b.batchName} className="w-24 h-16 object-cover rounded-md" /> : <div className="w-24 h-16 rounded-md bg-muted" />}
                        <div>
                          <CardTitle className="text-lg">{b.batchName || 'Batch'}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">{b.cr ? `CR: ${b.cr}` : ''}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Years: {(years||[]).filter(y=> (y.batchId||y.batch_name)===b.id).length}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={(e)=>{ e.stopPropagation(); navigate(`/admin/years?batch=${b.id}`); setSelectedBatchId(b.id); }}>View Years</Button>
                          <Button size="sm" variant="ghost" onClick={(e)=>{ e.stopPropagation(); setEditingBatchId(b.id); setEditingBatchValue(b.batchName || ''); setEditingBatchCR(b.cr || ''); }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={async (e)=>{ e.stopPropagation(); try{ if(!confirm('Delete this batch and all its years? This cannot be undone.')) return; await deleteBatch?.(b.id); alert('Batch deleted'); }catch(err){ console.error(err); alert('Failed to delete batch'); } }}>Delete</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
