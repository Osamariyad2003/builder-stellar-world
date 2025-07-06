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
  } | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [yearType, setYearType] = useState<"basic" | "clinical">("basic");

  const {
    years,
    loading,
    error,
    isOfflineMode,
    createSubject,
    createLecture,
    deleteLecture,
  } = useYears();

  const handleAddQuiz = (lectureId: string) => {
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
    console.log("Year data:", yearData);
    setSelectedYear({ id: yearData.id, number: yearData.yearNumber });
    setYearType(type);
    setIsSubjectFormOpen(true);
    console.log("✅ Subject form should be open now");
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

  const renderYearCard = (yearData: any, type: "basic" | "clinical") => (
    <Card
      key={yearData.yearNumber}
      className={`border-l-4 ${
        type === "basic" ? "border-l-blue-500" : "border-l-red-500"
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {type === "basic" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <Stethoscope className="h-5 w-5 text-red-600" />
            )}
            Year {yearData.yearNumber}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddSubject(yearData, type)}
            className="flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Add Subject
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {yearData.subjects.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No subjects added yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddSubject(yearData, type)}
              className="mt-2"
            >
              Add your first subject
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {yearData.subjects.map((subject: any) => (
              <AccordionItem
                key={subject.id}
                value={subject.id || ""}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-left">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{subject.name}</span>
                      <Badge variant="secondary">
                        {subject.lectures.length} lectures
                      </Badge>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLecture(subject, type);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add Lecture
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {subject.lectures.length === 0 ? (
                      <div className="text-center py-6">
                        <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No lectures added yet
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddLecture(subject, type)}
                          className="mt-2"
                        >
                          Add your first lecture
                        </Button>
                      </div>
                    ) : (
                      subject.lectures.map((lecture: any) => (
                        <Card key={lecture.id} className="bg-secondary/20">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {lecture.name}
                                </CardTitle>
                                {lecture.description && (
                                  <CardDescription>
                                    {lecture.description}
                                  </CardDescription>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  deleteLecture(subject.id!, lecture.id!)
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-6 md:grid-cols-3">
                              {/* Videos */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <PlayCircle className="h-4 w-4 text-green-600" />
                                    Videos (0)
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddVideo(lecture.id!)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Video className="h-3 w-3 mr-1" />
                                    Add Video
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  No videos yet
                                </p>
                              </div>

                              {/* Files */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Files (0)
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddFile(lecture.id!)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Add File
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  No files yet
                                </p>
                              </div>

                              {/* Quizzes */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <HelpCircle className="h-4 w-4 text-purple-600" />
                                    Quizzes (0)
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddQuiz(lecture.id!)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Quiz
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  No quizzes yet
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );

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
                {years.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        Setting Up Years...
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The academic years structure is being initialized.
                        Please refresh the page in a moment.
                      </p>
                      <Button onClick={() => window.location.reload()}>
                        Refresh Page
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  years
                    .filter((year) => year.type === "basic")
                    .map((yearData) => renderYearCard(yearData, "basic"))
                )}
              </div>
            </TabsContent>

            <TabsContent value="clinical" className="space-y-4">
              <div className="space-y-6">
                {years.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        Setting Up Years...
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The academic years structure is being initialized.
                        Please refresh the page in a moment.
                      </p>
                      <Button onClick={() => window.location.reload()}>
                        Refresh Page
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  years
                    .filter((year) => year.type === "clinical")
                    .map((yearData) => renderYearCard(yearData, "clinical"))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
