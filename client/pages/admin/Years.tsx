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
    semester?: string;
  } | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [yearType, setYearType] = useState<"basic" | "clinical">("basic");

  const {
    years,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
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
      "semester:",
      yearData.semester,
      "type:",
      type,
    );
    console.log("Year data:", yearData);
    setSelectedYear({
      id: yearData.id,
      number: yearData.yearNumber,
      semester: yearData.semester
    });
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
        semester={selectedYear?.semester}
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

  const semesters = [
    { id: "1st", name: "1st Semester", color: "text-green-600" },
    { id: "2nd", name: "2nd Semester", color: "text-blue-600" },
    { id: "summer", name: "Summer Semester", color: "text-orange-600" },
  ];

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
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-4">
          {semesters.map((semester) => (
            <AccordionItem
              key={semester.id}
              value={semester.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className={`h-4 w-4 ${semester.color}`} />
                    <span className="font-semibold">{semester.name}</span>
                    <Badge variant="secondary">
                      {yearData.subjects?.filter((s: any) => s.semester === semester.id).length || 0} subjects
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSubject({...yearData, semester: semester.id}, type);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subject
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  {(!yearData.subjects || yearData.subjects.filter((s: any) => s.semester === semester.id).length === 0) ? (
                    <div className="text-center py-6">
                      <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No subjects in {semester.name} yet
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddSubject({...yearData, semester: semester.id}, type)}
                        className="mt-2"
                      >
                        Add first subject
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {yearData.subjects
                        ?.filter((subject: any) => subject.semester === semester.id)
                        ?.map((subject: any) => (
                          <Card key={subject.id} className="bg-secondary/10">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">{subject.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {subject.lectures?.length || 0} lectures
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddLecture(subject, type)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Lecture
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {subject.lectures && subject.lectures.length > 0 && (
                              <CardContent className="pt-0">
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {subject.lectures.slice(0, 3).map((lecture: any) => (
                                    <div key={lecture.id} className="flex items-center gap-2">
                                      <PlayCircle className="h-3 w-3" />
                                      <span>{lecture.name}</span>
                                    </div>
                                  ))}
                                  {subject.lectures.length > 3 && (
                                    <div className="text-muted-foreground">
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
              <Button onClick={() => window.location.reload()} variant="ghost">
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
