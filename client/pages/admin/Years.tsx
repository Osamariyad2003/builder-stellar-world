import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  sortBatches,
  sortByName,
  type BatchSortField,
  type SortDirection,
} from "@/lib/adminListSort";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  Edit2,
  GraduationCap,
  Stethoscope,
  Upload,
  Video,
  FolderPlus,
  Loader2,
  Link2,
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
  const [editingBatchImage, setEditingBatchImage] = useState<string>("");
  const [editingBatchGroupLink, setEditingBatchGroupLink] = useState<string>("");
  const [editingBatchGraduateDate, setEditingBatchGraduateDate] = useState<string>("");
  const [editingBatchSupervisor, setEditingBatchSupervisor] = useState<string>("");
  const [editingBatchRegistrationName, setEditingBatchRegistrationName] = useState<string>("");
  const [editingBatchOrder, setEditingBatchOrder] = useState<string>("");

  // Add Batch dialog state
  const [batchName, setBatchName] = useState<string>("");
  const [batchImageUrl, setBatchImageUrl] = useState<string>("");
  const [batchCR, setBatchCR] = useState<string>("");
  const [batchGroupLink, setBatchGroupLink] = useState<string>("");
  const [batchGraduateDate, setBatchGraduateDate] = useState<string>("");
  const [batchSupervisor, setBatchSupervisor] = useState<string>("");
  const [batchRegistrationName, setBatchRegistrationName] = useState<string>("");
  const [batchOrder, setBatchOrder] = useState<string>("");
  const [createYears1To6, setCreateYears1To6] = useState<boolean>(true);
  const [yearImageUrls, setYearImageUrls] = useState<Record<number, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
  });

  // Selected batch for viewing years (sync with ?batch= query param)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchSortField, setBatchSortField] = useState<BatchSortField>("name");
  const [batchSortDir, setBatchSortDir] = useState<SortDirection>("asc");
  const [subjectSortDir, setSubjectSortDir] = useState<SortDirection>("asc");
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const b = qp.get("batch");
    setSelectedBatchId(b);
  }, [location.search]);


  const toggleSection = async (
    lectureId: string,
    section: "videos" | "files" | "quizzes",
    subjectId?: string,
  ) => {
    // Check if section is being opened (expanded to true)
    const currentState = expanded[lectureId]?.[section] || false;
    const isOpening = !currentState;

    // If opening and we have the subject ID, load resources
    if (isOpening && subjectId) {
      const lecture = years
        .flatMap((y) => y.subjects)
        .flatMap((s) => s.lectures)
        .find(
          (l) =>
            l.id === lectureId &&
            l.name &&
            years.flatMap((y) => y.subjects).find((s) => s.id === subjectId),
        );

      if (lecture && !lecture[section]) {
        // Only load if resources haven't been loaded yet
        await loadLectureResources(subjectId, lectureId);
      }
    }

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
    retryConnection,
    clearCache,
    updateYear,
    updateBatch,
    createSubject,
    createLecture,
    updateLecture,
    createYear,
    createBatch,
    deleteBatch,
    deleteLecture,
    deleteSubject,
    addVideo,
    addFile,
    addQuiz,
    loadLectureResources,
  } = useYears();

  const sortedBatches = useMemo(
    () => sortBatches(batches || [], batchSortField, batchSortDir),
    [batches, batchSortField, batchSortDir],
  );

  const batchListOrderCaption = useMemo(() => {
    if (batchSortField === "name") {
      return batchSortDir === "asc" ? "Name · A → Z" : "Name · Z → A";
    }
    if (batchSortField === "order") {
      return batchSortDir === "asc"
        ? "Order · low → high"
        : "Order · high → low";
    }
    return batchSortDir === "asc"
      ? "Date · oldest first"
      : "Date · newest first";
  }, [batchSortField, batchSortDir]);

  const { news } = useNews();

  // Scroll to subject when URL has batch, year, subject and we have years loaded
  React.useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const batchId = qp.get("batch");
    const yearId = qp.get("year");
    const subjectId = qp.get("subject");
    if (!batchId || !yearId || !subjectId || !selectedBatchId || !years?.length) return;
    const el = document.querySelector(`[data-subject-id="${subjectId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [location.search, selectedBatchId, years]);

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
    // Find the lecture object if editing
    const lectureToEdit = selectedLecture 
      ? selectedSubject?.lectures?.find((l: any) => l.id === selectedLecture)
      : null;

    return (
      <LectureForm
        lecture={lectureToEdit}
        subjectId={selectedSubject?.id}
        subjectName={selectedSubject?.name}
        yearType={yearType}
        onClose={() => {
          setIsLectureFormOpen(false);
          setSelectedSubject(null);
          setSelectedLecture(null);
        }}
        onSave={async (lectureData) => {
          try {
            if (lectureToEdit) {
              // Update existing lecture
              await updateLecture(lectureToEdit.id, lectureData);
            } else {
              // Create new lecture
              await createLecture(lectureData);
            }
            setIsLectureFormOpen(false);
            setSelectedSubject(null);
            setSelectedLecture(null);
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
            <div className="flex flex-col items-start gap-1 flex-shrink-0">
              {yearData.imageUrl ? (
                <img
                  src={yearData.imageUrl}
                  alt={`Year ${yearData.yearNumber}`}
                  className="w-24 h-24 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center">
                  {type === "basic" ? (
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Stethoscope className="h-6 w-6 text-red-600" />
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const choice = window.prompt(
                    "Paste image URL, or leave empty to upload a file:",
                    yearData.imageUrl ?? "",
                  );
                  if (choice === null) return;
                  const trimmed = choice.trim();
                  if (trimmed) {
                    try {
                      await updateYear?.(yearData.id, {
                        imageUrl: trimmed,
                      });
                      alert("Image updated");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to update image");
                    }
                    return;
                  }
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    try {
                      const imageUrl = await uploadImageToCloudinary(file);
                      if (!imageUrl) {
                        alert("Upload failed");
                        return;
                      }
                      await updateYear?.(yearData.id, {
                        imageUrl,
                      });
                      alert("Image updated");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to upload image");
                    }
                  };
                  input.click();
                }}
                aria-label="Change year image"
              >
                <Upload className="h-3 w-3 mr-1" />
                Change Image
              </Button>
            </div>

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
                        <span className="text-sm text-muted">
                          Year {yearData.yearNumber}
                        </span>
                        {yearData.name && (
                          <span className="ml-2">• {yearData.name}</span>
                        )}
                        {yearData.academicSupervisor && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Academic Supervisor: {yearData.academicSupervisor}
                          </div>
                        )}
                        {yearData.cr && (
                          <div className="text-sm text-muted-foreground">
                            CR: {yearData.cr}
                          </div>
                        )}
                        {yearData.actor && (
                          <div className="text-sm text-muted-foreground">
                            Actor: {yearData.actor}
                          </div>
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
                        {yearData.name ? (
                          <span className="mr-2">{yearData.name}</span>
                        ) : (
                          <span className="italic">No batch name</span>
                        )}
                        {yearData.academicSupervisor && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Academic Supervisor: {yearData.academicSupervisor}
                          </div>
                        )}
                        {yearData.cr && (
                          <div className="text-sm text-muted-foreground">
                            CR: {yearData.cr}
                          </div>
                        )}
                        {yearData.actor && (
                          <div className="text-sm text-muted-foreground">
                            Actor: {yearData.actor}
                          </div>
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
              {sortByName(yearData.subjects || [], subjectSortDir).map((subject: any) => {
                const batchId = yearData.batchId || (yearData as any).batch_name;
                const deepLinkToSubject = `/admin/years?batch=${encodeURIComponent(batchId || "")}&year=${encodeURIComponent(yearData.id || "")}&subject=${encodeURIComponent(subject.id || "")}`;
                return (
                <Card
                  key={subject.id}
                  className="bg-secondary/10"
                  data-subject-id={subject.id}
                >
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
                        <Link
                          to={deepLinkToSubject}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Link to this subject (batch → year → subject)"
                          aria-label="Link to this subject"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Link
                        </Link>
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
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Subject: {subject.name}
                                  </p>
                                  <h4 className="font-medium text-sm mb-1 truncate">
                                    <span className="text-muted-foreground font-normal mr-2">
                                      Order {lecture.order ?? "—"}
                                    </span>
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
                                        toggleSection(
                                          lecture.id,
                                          "videos",
                                          subject.id,
                                        )
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
                                        toggleSection(
                                          lecture.id,
                                          "files",
                                          subject.id,
                                        )
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
                                        toggleSection(
                                          lecture.id,
                                          "quizzes",
                                          subject.id,
                                        )
                                      }
                                      className={`h-6 px-2 text-xs ${expanded[lecture.id]?.quizzes ? "bg-accent" : ""}`}
                                    >
                                      <HelpCircle className="h-3 w-3 mr-1" />
                                      Quizzes ({lecture.quizzes?.length || 0})
                                    </Button>

                                    {/* Edit Lecture Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        setSelectedLecture(lecture.id);
                                        setSelectedSubject(subject);
                                        setIsLectureFormOpen(true);
                                      }}
                                      title="Edit Lecture"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>

                                    {/* Delete Lecture Button */}
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
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleAddVideo(subject, lecture.id)
                                            }
                                            className="h-6 px-2 text-xs"
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() =>
                                              (window.location.href = `/admin/videos?lecture=${lecture.id}`)
                                            }
                                          >
                                            Open page
                                          </Button>
                                        </div>
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
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleAddFile(subject, lecture.id)
                                            }
                                            className="h-6 px-2 text-xs"
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() =>
                                              (window.location.href = `/admin/files?lecture=${lecture.id}`)
                                            }
                                          >
                                            Open page
                                          </Button>
                                        </div>
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
                                                  href={file.fileUrl || file.url || "#"}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-green-600 hover:underline truncate"
                                                  onClick={(e) => {
                                                    if (!file.fileUrl && !file.url) {
                                                      e.preventDefault();
                                                      alert("No file URL available");
                                                    }
                                                  }}
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
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleAddQuiz(subject, lecture.id)
                                            }
                                            className="h-6 px-2 text-xs"
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() =>
                                              (window.location.href = `/admin/quizzes?lecture=${lecture.id}`)
                                            }
                                          >
                                            Open page
                                          </Button>
                                        </div>
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
              );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 px-1 sm:space-y-6 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Academic Years Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Manage curriculum by academic years, subjects, and lectures
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
            onClick={() => {
              clearCache();
              alert("Cache cleared. Data will be refreshed from server.");
            }}
            title="Clear cached data and fetch fresh from server"
          >
            🔄 Refresh Cache
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-11 min-h-11 w-full touch-manipulation sm:h-10 sm:min-h-10 sm:w-auto">
                <FolderPlus className="h-4 w-4 sm:mr-2" />{" "}
                <span>Add Batch</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Batch</DialogTitle>
                <DialogDescription>
                  Create a new batch for grouping years
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Batch name
                  </label>
                  <Input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g., Batch A"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Batch image URL (optional)
                  </label>
                  <Input
                    value={batchImageUrl}
                    onChange={(e) => setBatchImageUrl(e.target.value)}
                    placeholder="https://..."
                    aria-label="Batch image URL"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-years-1-6"
                    checked={createYears1To6}
                    onCheckedChange={(checked) =>
                      setCreateYears1To6(checked === true)
                    }
                    aria-label="Create years 1 to 6 for this batch"
                  />
                  <label
                    htmlFor="create-years-1-6"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Create years 1–6 for this batch
                  </label>
                </div>
                {createYears1To6 && (
                  <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                    <span className="text-sm font-medium block">
                      Image URL for each year (optional)
                    </span>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <div key={num} className="flex items-center gap-2">
                        <label
                          className="text-sm text-muted-foreground w-16 shrink-0"
                          htmlFor={`year-${num}-image`}
                        >
                          Year {num}
                        </label>
                        <Input
                          id={`year-${num}-image`}
                          value={yearImageUrls[num] ?? ""}
                          onChange={(e) =>
                            setYearImageUrls((prev) => ({
                              ...prev,
                              [num]: e.target.value,
                            }))
                          }
                          placeholder="Image URL (optional)"
                          className="flex-1"
                          aria-label={`Year ${num} image URL`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    CR (optional)
                  </label>
                  <Input
                    value={batchCR}
                    onChange={(e) => setBatchCR(e.target.value)}
                    placeholder="Class representative"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Group Link (optional)
                  </label>
                  <Input
                    value={batchGroupLink}
                    onChange={(e) => setBatchGroupLink(e.target.value)}
                    placeholder="WhatsApp/Telegram group link"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Graduate Date (optional)
                  </label>
                  <Input
                    value={batchGraduateDate}
                    onChange={(e) => setBatchGraduateDate(e.target.value)}
                    placeholder="e.g., 2025-06-15"
                    type="date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Academic Supervisor (optional)
                  </label>
                  <Input
                    value={batchSupervisor}
                    onChange={(e) => setBatchSupervisor(e.target.value)}
                    placeholder="e.g., Dr. Ahmed Hassan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Registration name (optional)
                  </label>
                  <Input
                    value={batchRegistrationName}
                    onChange={(e) => setBatchRegistrationName(e.target.value)}
                    placeholder="Name used in registration / mobile app"
                    aria-label="Registration name for batch"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Order (optional, integer)
                  </label>
                  <Input
                    value={batchOrder}
                    onChange={(e) => setBatchOrder(e.target.value)}
                    placeholder="e.g. 1 — lower shows first when sorting by order"
                    inputMode="numeric"
                    type="number"
                    step={1}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Batch display order as integer"
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  onClick={async () => {
                    try {
                      if (!batchName || !batchName.trim()) {
                        alert("Please provide a batch name");
                        return;
                      }
                      let orderArg: number | undefined;
                      const orderTrim = batchOrder.trim();
                      if (orderTrim !== "") {
                        const n = parseInt(orderTrim, 10);
                        if (Number.isNaN(n)) {
                          alert("Order must be a whole number (integer).");
                          return;
                        }
                        orderArg = n;
                      }
                      await createBatch?.({
                        batchName: batchName.trim(),
                        imageUrl: batchImageUrl?.trim() || undefined,
                        cr: batchCR?.trim(),
                        groupLink: batchGroupLink?.trim(),
                        group_link: batchGroupLink?.trim(),
                        graduateDate: batchGraduateDate?.trim(),
                        graduate_date: batchGraduateDate?.trim(),
                        academicSupervisor: batchSupervisor?.trim(),
                        academic_supervisor: batchSupervisor?.trim(),
                        registrationName: batchRegistrationName?.trim(),
                        ...(orderArg !== undefined ? { order: orderArg } : {}),
                        createYearsCount: createYears1To6 ? 6 : 0,
                        yearImages: createYears1To6
                          ? Object.fromEntries(
                              [1, 2, 3, 4, 5, 6].map((n) => [
                                n,
                                (yearImageUrls[n] ?? "").trim(),
                              ]),
                            )
                          : undefined,
                      });
                      setBatchName("");
                      setBatchImageUrl("");
                      setBatchCR("");
                      setBatchGroupLink("");
                      setBatchGraduateDate("");
                      setBatchSupervisor("");
                      setBatchRegistrationName("");
                      setBatchOrder("");
                      setYearImageUrls({ 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" });
                      // close dialog
                      const closeBtn = document.querySelector(
                        "[data-dialog-close]",
                      ) as HTMLElement | null;
                      if (closeBtn) closeBtn.click();
                      alert("Batch created");
                    } catch (e) {
                      console.error(e);
                      alert("Failed to create batch");
                    }
                  }}
                >
                  Create
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" className="ml-2" data-dialog-close>
                    Cancel
                  </Button>
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
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="px-3 py-4 pt-5 sm:px-6 sm:pt-6">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search lectures, subjects, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-11 pl-10 text-base sm:min-h-10 sm:text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Show batches list or the selected batch's years */}
          <div className="min-w-0 space-y-4 sm:space-y-6">
            {!batches || batches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No batches found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create a batch to start adding academic years.
                  </p>
                </CardContent>
              </Card>
            ) : selectedBatchId ? (
              (() => {
                const batch =
                  (batches || []).find((b: any) => b.id === selectedBatchId) ||
                  null;
                const yearsForBatch = (years || []).filter(
                  (y: any) => (y.batchId || y.batch_name) === selectedBatchId,
                );
                return (
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                        {batch?.imageUrl ? (
                          <img
                            src={batch.imageUrl}
                            alt={batch.batchName || "Batch"}
                            className="h-40 w-full max-w-full shrink-0 rounded-md object-cover sm:h-36 sm:w-36 md:h-40 md:w-40"
                          />
                        ) : (
                          <div className="flex h-40 w-full max-w-full shrink-0 items-center justify-center rounded-md bg-muted sm:h-36 sm:w-36 md:h-40 md:w-40">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 basis-0">
                          <h2 className="break-words text-xl font-semibold sm:text-2xl [overflow-wrap:anywhere]">
                            {batch?.batchName || "Batch"}
                          </h2>
                          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                            {batch?.cr ? <div>CR: {batch.cr}</div> : null}
                            {(() => {
                              const ba = batch as any;
                              const regName = ba?.registrationNames?.[0] ?? ba?.registration_names?.[0] ?? ba?.registrationName ?? ba?.registration_name;
                              return regName ? <div>Register name: {regName}</div> : null;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 md:flex-row md:flex-wrap md:justify-end lg:w-auto lg:max-w-full lg:justify-end">
                        <Button
                          className="h-11 min-h-11 w-full touch-manipulation md:w-auto"
                          onClick={() => {
                            setSelectedBatchId(null);
                            navigate("/admin/years");
                          }}
                        >
                          Back to Batches
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-11 min-h-11 w-full touch-manipulation md:w-auto"
                          onClick={async () => {
                            try {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = async () => {
                                const file = input.files?.[0];
                                if (!file) return;
                                try {
                                  let imageUrl: string | null = null;
                                  try {
                                    imageUrl =
                                      await uploadImageToCloudinary(file);
                                  } catch (e) {
                                    console.error(e);
                                    alert("Upload failed");
                                    return;
                                  }
                                  if (!imageUrl) {
                                    alert("Upload failed");
                                    return;
                                  }
                                  await updateBatch?.(batch?.id, {
                                    image_url: imageUrl,
                                    imageUrl,
                                  });
                                  alert("Image updated");
                                } catch (err) {
                                  console.error(err);
                                  alert("Failed to upload image");
                                }
                              };
                              input.click();
                            } catch (err) {
                              console.error(err);
                              alert("Could not open file dialog");
                            }
                          }}
                        >
                          Change Image
                        </Button>

                        <Button
                          className="h-11 min-h-11 w-full touch-manipulation md:w-auto"
                          onClick={async () => {
                            try {
                              const yearNumStr = window.prompt(
                                "Enter year number for this batch:",
                              );
                              if (!yearNumStr) return;
                              const yearNum = parseInt(yearNumStr, 10);
                              if (isNaN(yearNum)) {
                                alert("Invalid");
                                return;
                              }
                              await createYear?.(batch?.id || null, {
                                yearNumber: yearNum,
                              });
                              alert("Year created");
                            } catch (e) {
                              console.error(e);
                              alert("Failed");
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Year
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-11 min-h-11 w-full touch-manipulation md:w-auto"
                          onClick={async () => {
                            try {
                              if (
                                !confirm("Delete this batch and all its years?")
                              )
                                return;
                              await deleteBatch?.(batch?.id);
                              setSelectedBatchId(null);
                              navigate("/admin/years");
                              alert("Batch deleted");
                            } catch (e) {
                              console.error(e);
                              alert("Failed to delete batch");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>

                    <div
                      className="mt-4 rounded-lg border border-border bg-muted/30 p-3 sm:p-4"
                      role="region"
                      aria-label="Subject list sorting"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="years-subject-sort" className="text-xs">
                          Sort subjects by name
                        </Label>
                        <Select
                          value={subjectSortDir}
                          onValueChange={(v) =>
                            setSubjectSortDir(v as SortDirection)
                          }
                        >
                          <SelectTrigger
                            id="years-subject-sort"
                            className="h-11 min-h-11 w-full min-w-0 max-w-full touch-manipulation sm:h-10 sm:min-h-10 sm:max-w-xs"
                            aria-label="Subject name sort order"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">A → Z</SelectItem>
                            <SelectItem value="desc">Z → A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {yearsForBatch.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center">
                            No years in this batch yet.
                          </CardContent>
                        </Card>
                      ) : (
                        yearsForBatch
                          .sort((a: any, b: any) => a.yearNumber - b.yearNumber)
                          .map((yd: any) => (
                            <div key={yd.id}>{renderYearCard(yd, yd.type)}</div>
                          ))
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="min-w-0 space-y-3 sm:space-y-4">
                <div
                  className="grid w-full min-w-0 grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:p-4 md:grid-cols-2 md:items-end lg:max-w-4xl"
                  role="region"
                  aria-label="Batch list sorting"
                >
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="years-batch-sort-field" className="text-xs">
                      Sort batches by
                    </Label>
                    <Select
                      value={batchSortField}
                      onValueChange={(v) => {
                        const f = v as BatchSortField;
                        setBatchSortField(f);
                        if (f === "date") setBatchSortDir("desc");
                        if (f === "name") setBatchSortDir("asc");
                        if (f === "order") setBatchSortDir("asc");
                      }}
                    >
                      <SelectTrigger
                        id="years-batch-sort-field"
                        className="h-11 min-h-11 w-full min-w-0 max-w-full touch-manipulation sm:h-10 sm:min-h-10"
                        aria-label="Batch sort field"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="date">Date (created / graduate)</SelectItem>
                        <SelectItem value="order">Order (integer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="years-batch-sort-dir" className="text-xs">
                      Order
                    </Label>
                    <Select
                      value={batchSortDir}
                      onValueChange={(v) =>
                        setBatchSortDir(v as SortDirection)
                      }
                    >
                      <SelectTrigger
                        id="years-batch-sort-dir"
                        className="h-11 min-h-11 w-full min-w-0 max-w-full touch-manipulation sm:h-10 sm:min-h-10"
                        aria-label="Batch sort direction"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          {batchSortField === "name"
                            ? "A → Z"
                            : batchSortField === "order"
                              ? "Low → high (0, 1, 2…)"
                              : "Oldest first"}
                        </SelectItem>
                        <SelectItem value="desc">
                          {batchSortField === "name"
                            ? "Z → A"
                            : batchSortField === "order"
                              ? "High → low"
                              : "Newest first"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              {/* Batches: single column of full-width cards (no multi-column grid) */}
              <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 md:gap-5">
                {sortedBatches.map((b: any, batchIndex: number) => (
                  <Card
                    key={b.id}
                    className="relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border transition-[box-shadow,transform,border-color] duration-200 touch-manipulation hover:shadow-md active:scale-[0.998] md:hover:border-primary/25 md:hover:shadow-md"
                    onClick={() => {
                      navigate(`/admin/years?batch=${b.id}`);
                      setSelectedBatchId(b.id);
                    }}
                  >
                    <div
                      className="pointer-events-none absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-col items-end gap-1 text-right sm:right-3 sm:top-3 sm:max-w-[min(100%-1.5rem,11rem)]"
                      aria-label={`Sorted position ${batchIndex + 1} of ${sortedBatches.length}, ${batchListOrderCaption}`}
                    >
                      <Badge
                        variant="secondary"
                        className="tabular-nums text-xs shadow-sm sm:text-sm"
                        title={`Order ${batchIndex + 1} of ${sortedBatches.length} (${batchListOrderCaption})`}
                      >
                        {batchIndex + 1}
                      </Badge>
                      <span className="max-w-full truncate rounded-md border border-border bg-background/95 px-1.5 py-0.5 text-[9px] font-medium leading-tight text-muted-foreground shadow-sm backdrop-blur-sm sm:px-2 sm:text-[10px]">
                        {batchListOrderCaption}
                      </span>
                    </div>
                    <CardHeader 
                      className="flex-1 space-y-0 p-4 pr-[4.5rem] sm:p-6 sm:pr-28"
                      onClick={(e) => editingBatchId === b.id && e.stopPropagation()}
                    >
                      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4">
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.batchName || "Batch"}
                            className="h-auto w-full max-h-48 shrink-0 rounded-md object-cover sm:h-32 sm:w-32 sm:max-h-none md:h-40 md:w-40"
                          />
                        ) : (
                          <div className="flex aspect-[4/3] w-full max-h-48 shrink-0 items-center justify-center rounded-md bg-muted sm:aspect-auto sm:h-32 sm:w-32 sm:max-h-none md:h-40 md:w-40" />
                        )}
                        <div className="min-w-0 flex-1">
                          {editingBatchId === b.id ? (
                            <div className="flex flex-col gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingBatchValue}
                                onChange={(e) =>
                                  setEditingBatchValue(e.target.value)
                                }
                                placeholder="Batch name"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Input
                                value={editingBatchCR || ""}
                                onChange={(e) =>
                                  setEditingBatchCR(e.target.value)
                                }
                                placeholder="CR"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Input
                                value={editingBatchImage}
                                onChange={(e) =>
                                  setEditingBatchImage(e.target.value)
                                }
                                placeholder="Image URL (or upload)"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Input
                                value={editingBatchGroupLink || ""}
                                onChange={(e) =>
                                  setEditingBatchGroupLink(e.target.value)
                                }
                                placeholder="Group Link"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Input
                                value={editingBatchGraduateDate || ""}
                                onChange={(e) =>
                                  setEditingBatchGraduateDate(e.target.value)
                                }
                                placeholder="Graduate Date (e.g., 2025-06-15)"
                                type="date"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Input
                                value={editingBatchSupervisor || ""}
                                onChange={(e) =>
                                  setEditingBatchSupervisor(e.target.value)
                                }
                                placeholder="Academic Supervisor"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                  Register name
                                </label>
                                <Input
                                  value={editingBatchRegistrationName || ""}
                                  onChange={(e) =>
                                    setEditingBatchRegistrationName(e.target.value)
                                  }
                                  placeholder="e.g. for mobile app"
                                  className="w-full"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Registration name"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                  Order (integer)
                                </label>
                                <Input
                                  value={editingBatchOrder}
                                  onChange={(e) =>
                                    setEditingBatchOrder(e.target.value)
                                  }
                                  placeholder="e.g. 1"
                                  inputMode="numeric"
                                  type="number"
                                  step={1}
                                  className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Batch order integer"
                                />
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <Button
                                  size="sm"
                                  className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                      const input =
                                        document.createElement("input");
                                      input.type = "file";
                                      input.accept = "image/*";
                                      input.onchange = async () => {
                                        const file = input.files?.[0];
                                        if (!file) return;
                                        try {
                                          const imageUrl =
                                            await uploadImageToCloudinary(
                                              file,
                                            );
                                          if (!imageUrl) {
                                            alert("Upload failed");
                                            return;
                                          }
                                          setEditingBatchImage(imageUrl);
                                        } catch (err) {
                                          console.error(err);
                                          alert("Upload failed");
                                        }
                                      };
                                      input.click();
                                    } catch (err) {
                                      console.error(err);
                                      alert("Could not open file dialog");
                                    }
                                  }}
                                >
                                  Upload
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const regStr = editingBatchRegistrationName?.trim() ?? "";
                                      const regNames = regStr ? [regStr] : [];
                                      const orderTrim = editingBatchOrder.trim();
                                      const patch: Record<string, unknown> = {
                                        batch_name: editingBatchValue,
                                        batchName: editingBatchValue,
                                        cr: editingBatchCR,
                                        image_url: editingBatchImage,
                                        imageUrl: editingBatchImage,
                                        group_link: editingBatchGroupLink,
                                        groupLink: editingBatchGroupLink,
                                        graduate_date: editingBatchGraduateDate,
                                        graduateDate: editingBatchGraduateDate,
                                        academic_supervisor: editingBatchSupervisor,
                                        academicSupervisor: editingBatchSupervisor,
                                        registration_names: regNames,
                                        registrationNames: regNames,
                                        registration_name: regStr,
                                        registrationName: regStr,
                                      };
                                      if (orderTrim !== "") {
                                        const n = parseInt(orderTrim, 10);
                                        if (Number.isNaN(n)) {
                                          alert("Order must be a whole number (integer).");
                                          return;
                                        }
                                        patch.order = n;
                                      }
                                      await updateBatch?.(b.id, patch);
                                      // Keep edit mode and controlled field values (do not reset inputs).
                                      alert("Saved");
                                    } catch (err) {
                                      console.error(err);
                                      alert("Failed to save");
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBatchId(null);
                                    setEditingBatchValue("");
                                    setEditingBatchCR("");
                                    setEditingBatchImage("");
                                    setEditingBatchGroupLink("");
                                    setEditingBatchGraduateDate("");
                                    setEditingBatchSupervisor("");
                                    setEditingBatchRegistrationName("");
                                    setEditingBatchOrder("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <CardTitle className="break-words text-base font-semibold leading-snug sm:text-lg">
                                {b.batchName || "Batch"}
                              </CardTitle>
                              <CardDescription className="space-y-1 break-words text-sm text-muted-foreground">
                                {typeof b.order === "number" &&
                                  Number.isFinite(b.order) && (
                                    <div>Order: {Math.trunc(b.order)}</div>
                                  )}
                                {b.cr && <div>CR: {b.cr}</div>}
                                {(() => {
                                  const ba = b as any;
                                  const regName = ba?.registrationNames?.[0] ?? ba?.registration_names?.[0] ?? ba?.registrationName ?? ba?.registration_name;
                                  return regName ? <div>Register name: {regName}</div> : null;
                                })()}
                                {(b.academicSupervisor || b.academic_supervisor) && (
                                  <div>Supervisor: {b.academicSupervisor || b.academic_supervisor}</div>
                                )}
                                {b.graduateDate && (
                                  <div>Graduate: {b.graduateDate}</div>
                                )}
                                {(b.groupLink || b.group_link) && (
                                  <a
                                    href={b.groupLink || b.group_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-h-11 items-center gap-1 break-all text-blue-600 underline-offset-2 hover:underline sm:min-h-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    📱 Group Link
                                  </a>
                                )}
                              </CardDescription>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="mt-auto min-w-0 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-6"
                      onClick={(e) => editingBatchId === b.id && e.stopPropagation()}
                    >
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="shrink-0 text-sm font-medium text-muted-foreground">
                          Years:{" "}
                          {
                            (years || []).filter(
                              (y) => (y.batchId || y.batch_name) === b.id,
                            ).length
                          }
                        </div>
                        <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/years?batch=${b.id}`);
                              setSelectedBatchId(b.id);
                            }}
                          >
                            View Years
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBatchId(b.id);
                              setEditingBatchValue(b.batchName || "");
                              setEditingBatchCR(b.cr || "");
                              setEditingBatchImage(b.imageUrl || "");
                              setEditingBatchGroupLink(b.groupLink || b.group_link || "");
                              setEditingBatchGraduateDate(b.graduateDate || b.graduate_date || "");
                              setEditingBatchSupervisor(b.academicSupervisor || b.academic_supervisor || "");
                              const ba = b as any;
                              const rn = ba.registrationNames ?? ba.registration_names;
                              const regStr = Array.isArray(rn) && rn.length > 0 ? rn[0] : ba.registration_names?.[0] ?? ba.registration_name ?? ba.registrationName ?? "";
                              setEditingBatchRegistrationName(regStr);
                              const ord = b.order;
                              if (typeof ord === "number" && Number.isFinite(ord)) {
                                setEditingBatchOrder(String(Math.trunc(ord)));
                              } else if (typeof ord === "string" && ord.trim() !== "") {
                                const n = parseInt(ord.trim(), 10);
                                setEditingBatchOrder(Number.isNaN(n) ? "" : String(n));
                              } else {
                                setEditingBatchOrder("");
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = async () => {
                                  const file = input.files?.[0];
                                  if (!file) return;
                                  try {
                                    const imageUrl =
                                      await uploadImageToCloudinary(file);
                                    if (!imageUrl) {
                                      alert("Upload failed");
                                      return;
                                    }
                                    await updateBatch?.(b.id, {
                                      image_url: imageUrl,
                                      imageUrl,
                                    });
                                    alert("Image updated");
                                  } catch (err) {
                                    console.error(err);
                                    alert("Failed to upload image");
                                  }
                                };
                                input.click();
                              } catch (err) {
                                  console.error(err);
                                  alert("Could not open file dialog");
                                }
                              }}
                            >
                              Change Image
                          </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                            className="h-11 min-h-11 w-full touch-manipulation sm:h-9 sm:min-h-9 sm:w-auto"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (
                                  !confirm(
                                    "Delete this batch and all its years? This cannot be undone.",
                                  )
                                )
                                  return;
                                await deleteBatch?.(b.id);
                                alert("Batch deleted");
                              } catch (err) {
                                console.error(err);
                                alert("Failed to delete batch");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
