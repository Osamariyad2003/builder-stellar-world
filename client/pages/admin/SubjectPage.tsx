import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useYears } from "@/hooks/useYears";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, HelpCircle, Plus, Trash2 } from "lucide-react";
import { VideoForm } from "@/components/admin/VideoForm";
import { FileForm } from "@/components/admin/FileForm";
import { QuizForm } from "@/components/admin/QuizForm";
import { LectureForm } from "@/components/admin/LectureForm";

function parseDurationToSeconds(d: any) {
  if (!d) return 0;
  // if already number (seconds)
  if (typeof d === "number") return d;
  // string like HH:MM:SS or MM:SS or seconds
  const s = String(d).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  return 0;
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SubjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    years,
    subjects,
    loading,
    createLecture,
    addVideo,
    addFile,
    addQuiz,
  } = useYears();

  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [isFileFormOpen, setIsFileFormOpen] = useState(false);
  const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
  const [isLectureFormOpen, setIsLectureFormOpen] = useState(false);

  const subject = subjects.find((s) => s.id === id);

  const openVideoForm = (lectureId?: string | null) => {
    setSelectedLecture(lectureId || null);
    setIsVideoFormOpen(true);
  };
  const openFileForm = (lectureId?: string | null) => {
    setSelectedLecture(lectureId || null);
    setIsFileFormOpen(true);
  };
  const openQuizForm = (lectureId?: string | null) => {
    setSelectedLecture(lectureId || null);
    setIsQuizFormOpen(true);
  };

  if (isVideoFormOpen && selectedLecture) {
    return (
      <VideoForm
        lectureId={selectedLecture}
        onClose={() => {
          setIsVideoFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={async (videoData) => {
          if (subject?.id && selectedLecture) {
            await addVideo(subject.id, selectedLecture, videoData);
          }
          setIsVideoFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

  if (isFileFormOpen && selectedLecture) {
    return (
      <FileForm
        lectureId={selectedLecture}
        onClose={() => {
          setIsFileFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={async (fileData) => {
          if (subject?.id && selectedLecture) {
            await addFile(subject.id, selectedLecture, fileData);
          }
          setIsFileFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

  if (isQuizFormOpen && selectedLecture) {
    return (
      <QuizForm
        lectureId={selectedLecture}
        onClose={() => {
          setIsQuizFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={async (quizData) => {
          if (subject?.id && selectedLecture) {
            await addQuiz(subject.id, selectedLecture, quizData);
          }
          setIsQuizFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

  if (isLectureFormOpen) {
    return (
      <LectureForm
        subjectId={subject?.id || null}
        subjectName={subject?.name}
        yearType={years.find((y) => y.id === subject?.yearId)?.type}
        onClose={() => setIsLectureFormOpen(false)}
        onSave={async (lectureData) => {
          if (subject?.id) {
            await createLecture(lectureData);
          }
          setIsLectureFormOpen(false);
        }}
      />
    );
  }

  if (loading) return <div>Loading...</div>;

  if (!subject) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">Subject not found</h3>
          <p className="text-muted-foreground mt-2">
            The subject you requested does not exist.
          </p>
          <div className="mt-4">
            <Link to="/admin/years">
              <Button>Back to Years</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <p className="text-muted-foreground">Subject details and lectures</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLectureFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Lecture
          </Button>
          <Link to="/admin/years">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lectures</CardTitle>
          <CardDescription>All lectures for this subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {subject.lectures && subject.lectures.length > 0 ? (
              subject.lectures.map((lecture) => {
                const thumbnail =
                  lecture.imageUrl ||
                  (lecture.videos &&
                    lecture.videos[0] &&
                    lecture.videos[0].thumbnailUrl) ||
                  "";
                return (
                  <div
                    key={lecture.id}
                    className="p-3 border rounded-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={lecture.name}
                          width={1280}
                          height={720}
                          style={{ width: 160, height: 90, objectFit: "cover" }}
                          className="rounded"
                        />
                      ) : (
                        <div className="w-40 h-24 bg-muted rounded flex items-center justify-center text-xs">
                          No image
                        </div>
                      )}

                      <div>
                        <div className="font-medium">{lecture.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {lecture.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openVideoForm(lecture.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs"
                        title="Add Video"
                      >
                        <PlayCircle className="h-3 w-3 text-blue-600" />
                        <span>Add Video</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openFileForm(lecture.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs"
                        title="Add File"
                      >
                        <FileText className="h-3 w-3 text-green-600" />
                        <span>Add File</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openQuizForm(lecture.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs"
                        title="Add Quiz"
                      >
                        <HelpCircle className="h-3 w-3 text-purple-600" />
                        <span>Add Quiz</span>
                      </Button>

                      <div className="flex items-center gap-2">
                        {/* Videos count + total duration */}
                        {lecture.videos && lecture.videos.length > 0 ? (
                          (() => {
                            const totalSec = (lecture.videos || []).reduce(
                              (acc, v) =>
                                acc +
                                parseDurationToSeconds(
                                  v.duration ||
                                    v.time ||
                                    v.durationSeconds ||
                                    v.length,
                                ),
                              0,
                            );
                            return (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/videos?lecture=${lecture.id}`,
                                  )
                                }
                                className="text-xs text-blue-600 flex items-center gap-1 px-2"
                                title="Videos"
                              >
                                <PlayCircle className="h-4 w-4" />
                                <span>({lecture.videos.length})</span>
                                <span className="text-muted-foreground">
                                  {formatDuration(totalSec)}
                                </span>
                              </button>
                            );
                          })()
                        ) : (
                          <button
                            onClick={() =>
                              navigate(`/admin/videos?lecture=${lecture.id}`)
                            }
                            className="text-xs text-blue-600 flex items-center gap-1 px-2"
                            title="Videos"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/resources?lecture=${lecture.id}&tab=files`,
                            )
                          }
                          className="text-xs text-green-600 flex items-center gap-1 px-2"
                          title="Files"
                        >
                          <FileText className="h-4 w-4" />
                          <span>({lecture.files?.length || 0})</span>
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/resources?lecture=${lecture.id}&tab=quizzes`,
                            )
                          }
                          className="text-xs text-purple-600 flex items-center gap-1 px-2"
                          title="Quizzes"
                        >
                          <HelpCircle className="h-4 w-4" />
                          <span>({lecture.quizzes?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">
                No lectures yet for this subject.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
