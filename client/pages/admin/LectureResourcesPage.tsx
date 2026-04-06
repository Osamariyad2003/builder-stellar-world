import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLectureDetail } from "@/hooks/useLectureDetail";
import { useLectureFiles, useLectureVideos, useLectureQuizzes } from "@/hooks/useLectureResources";
import { useYears } from "@/hooks/useYears";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoForm } from "@/components/admin/VideoForm";
import { FileForm } from "@/components/admin/FileForm";
import { QuizForm } from "@/components/admin/QuizForm";
import { LectureForm } from "@/components/admin/LectureForm";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  PlayCircle,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";

type Panel = "main" | "lecture" | "video" | "file" | "quiz";

export default function LectureResourcesPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const subjectParam = searchParams.get("subject");
  const queryClient = useQueryClient();

  const { data: lecture, isLoading, error, refetch } = useLectureDetail(
    lectureId,
    subjectParam,
  );
  const {
    addVideo,
    addFile,
    addQuiz,
    removeVideo,
    removeFile,
    removeQuiz,
    updateLecture,
  } = useYears();

  const [panel, setPanel] = useState<Panel>("main");
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);

  const subjectId = lecture?.subjectId ?? subjectParam ?? "";

  const handleTabChange = (v: string) => {
    const next = new URLSearchParams();
    next.set("tab", v);
    if (subjectParam) next.set("subject", subjectParam);
    setSearchParams(next);
  };

  const invalidateLecture = () => {
    queryClient.invalidateQueries({ queryKey: ["lecture-detail"] });
  };

  // —— Full-screen forms (same pattern as Subject page) ——
  if (panel === "lecture" && lecture) {
    return (
      <LectureForm
        lecture={{
          id: lecture.id,
          name: lecture.title,
          description: lecture.description,
          order: lecture.order,
          imageUrl: lecture.imageUrl,
        }}
        subjectId={subjectId}
        subjectName={undefined}
        onClose={() => setPanel("main")}
        onSave={async (data) => {
          await updateLecture(lecture.id, {
            name: data.name,
            description: data.description,
            order: data.order,
            imageUrl: data.imageUrl,
          });
          setPanel("main");
          invalidateLecture();
          await refetch();
        }}
      />
    );
  }

  if (panel === "video" && lecture) {
    return (
      <VideoForm
        video={editingVideo}
        lectureId={lecture.id}
        onClose={() => {
          setPanel("main");
          setEditingVideo(null);
        }}
        onSave={async (videoData) => {
          if (editingVideo?.id) {
            const videoRef = doc(
              db,
              "Subjects",
              subjectId,
              "lectures",
              lecture.id,
              "videos",
              editingVideo.id,
            );
            await updateDoc(videoRef, {
              title: videoData.title,
              description: videoData.description,
              url: videoData.url,
              duration: videoData.duration,
              thumbnailUrl: videoData.thumbnailUrl,
              platform: videoData.platform,
            });
          } else {
            await addVideo(subjectId, lecture.id, {
              title: videoData.title,
              description: videoData.description,
              url: videoData.url,
              duration: videoData.duration,
              thumbnailUrl: videoData.thumbnailUrl,
              platform: videoData.platform,
            });
          }
          setPanel("main");
          setEditingVideo(null);
          invalidateLecture();
        }}
      />
    );
  }

  if (panel === "file" && lecture) {
    return (
      <FileForm
        file={editingFile}
        lectureId={lecture.id}
        onClose={() => {
          setPanel("main");
          setEditingFile(null);
        }}
        onSave={async (fileData) => {
          if (editingFile?.id) {
            const fileRef = doc(
              db,
              "Subjects",
              subjectId,
              "lectures",
              lecture.id,
              "files",
              editingFile.id,
            );
            await updateDoc(fileRef, {
              title: fileData.title,
              description: fileData.description,
              url: fileData.fileUrl || fileData.url,
              fileUrl: fileData.fileUrl,
              imageUrl: fileData.imageUrl,
            });
          } else {
            await addFile(subjectId, lecture.id, fileData);
          }
          setPanel("main");
          setEditingFile(null);
          invalidateLecture();
        }}
      />
    );
  }

  if (panel === "quiz" && lecture) {
    return (
      <QuizForm
        quiz={editingQuiz}
        onClose={() => {
          setPanel("main");
          setEditingQuiz(null);
        }}
        onSave={async (quizData) => {
          if (editingQuiz?.id) {
            const quizRef = doc(
              db,
              "Subjects",
              subjectId,
              "lectures",
              lecture.id,
              "quizzes",
              editingQuiz.id,
            );
            await updateDoc(quizRef, {
              title: quizData.title,
              description: quizData.description,
              duration: quizData.timeLimit ?? (quizData as { duration?: number }).duration,
              passRate: quizData.passingScore ?? (quizData as { passRate?: number }).passRate,
              questions: quizData.questions,
            });
          } else {
            await addQuiz(subjectId, lecture.id, quizData);
          }
          setPanel("main");
          setEditingQuiz(null);
          invalidateLecture();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle>Lecture not found</CardTitle>
          <CardDescription>
            {(error as Error)?.message || "This lecture may have been deleted."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link to="/admin/resources">Back to lectures</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Back">
            <Link to="/admin/resources">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{lecture.title}</h1>
              <Badge variant="secondary">Subject: {subjectId}</Badge>
              <Badge variant="outline">Order {lecture.order}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{lecture.description || "—"}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" /> {lecture.filesCount} files
              </Badge>
              <Badge variant="outline" className="gap-1">
                <PlayCircle className="h-3 w-3" /> {lecture.videosCount} videos
              </Badge>
              <Badge variant="outline" className="gap-1">
                <HelpCircle className="h-3 w-3" /> {lecture.quizzesCount} quizzes
              </Badge>
            </div>
          </div>
        </div>
        {lecture.imageUrl ? (
          <img
            src={lecture.imageUrl}
            alt=""
            className="w-28 h-28 object-cover rounded-lg border"
          />
        ) : null}
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lecture details</CardTitle>
                <CardDescription>Title, description, order, and image</CardDescription>
              </div>
              <Button onClick={() => setPanel("lecture")}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Title:</span> {lecture.title}
              </p>
              <p>
                <span className="text-muted-foreground">Order:</span> {lecture.order}
              </p>
              <p>
                <span className="text-muted-foreground">Updated:</span>{" "}
                {lecture.updatedAt?.toLocaleString?.() ?? "—"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          {tab === "files" && (
            <LectureFilesPanel
              lectureId={lecture.id}
              subjectId={subjectId || undefined}
              onAdd={() => {
                setEditingFile(null);
                setPanel("file");
              }}
              onEdit={(f) => {
                setEditingFile(f);
                setPanel("file");
              }}
              onDelete={async (id) => {
                if (!confirm("Delete this file?")) return;
                await removeFile(subjectId, lecture.id, id);
                invalidateLecture();
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {tab === "videos" && (
            <LectureVideosPanel
              lectureId={lecture.id}
              subjectId={subjectId || undefined}
              onAdd={() => {
                setEditingVideo(null);
                setPanel("video");
              }}
              onEdit={(v) => {
                setEditingVideo(v);
                setPanel("video");
              }}
              onDelete={async (id) => {
                if (!confirm("Delete this video?")) return;
                await removeVideo(subjectId, lecture.id, id);
                invalidateLecture();
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-4">
          {tab === "quizzes" && (
            <LectureQuizzesPanel
              lectureId={lecture.id}
              subjectId={subjectId || undefined}
              onAdd={() => {
                setEditingQuiz(null);
                setPanel("quiz");
              }}
              onEdit={(q) => {
                setEditingQuiz(q);
                setPanel("quiz");
              }}
              onDelete={async (id) => {
                if (!confirm("Delete this quiz?")) return;
                await removeQuiz(subjectId, lecture.id, id);
                invalidateLecture();
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LectureFilesPanel({
  lectureId,
  subjectId,
  onAdd,
  onEdit,
  onDelete,
}: {
  lectureId: string;
  subjectId?: string;
  onAdd: () => void;
  onEdit: (f: any) => void;
  onDelete: (id: string) => void;
}) {
  const { items, loading, error } = useLectureFiles(lectureId, subjectId);
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Files</CardTitle>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add file
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {!items?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No files yet.</p>
        ) : (
          items.map((f: any) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 p-3 border rounded-lg"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{f.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {f.url || f.fileUrl || ""}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onEdit(f)} aria-label="Edit file">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => onDelete(f.id)}
                  aria-label="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LectureVideosPanel({
  lectureId,
  subjectId,
  onAdd,
  onEdit,
  onDelete,
}: {
  lectureId: string;
  subjectId?: string;
  onAdd: () => void;
  onEdit: (v: any) => void;
  onDelete: (id: string) => void;
}) {
  const { items, loading, error } = useLectureVideos(lectureId, subjectId);
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Videos</CardTitle>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add video
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {!items?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No videos yet.</p>
        ) : (
          items.map((v: any) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-2 p-3 border rounded-lg"
            >
              <div className="min-w-0 flex items-center gap-3">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt="" className="w-20 h-12 object-cover rounded" />
                ) : (
                  <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                    <PlayCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{v.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-md">
                    {v.url || ""}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onEdit(v)} aria-label="Edit video">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => onDelete(v.id)}
                  aria-label="Delete video"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LectureQuizzesPanel({
  lectureId,
  subjectId,
  onAdd,
  onEdit,
  onDelete,
}: {
  lectureId: string;
  subjectId?: string;
  onAdd: () => void;
  onEdit: (q: any) => void;
  onDelete: (id: string) => void;
}) {
  const { items, loading, error } = useLectureQuizzes(lectureId, subjectId);
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quizzes</CardTitle>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add quiz
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {!items?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No quizzes yet.</p>
        ) : (
          items.map((q: any) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-2 p-3 border rounded-lg"
            >
              <div className="min-w-0">
                <div className="font-medium">{q.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground">
                  {q.duration ?? q.timeLimit ?? "—"} min • Pass {q.passRate ?? q.passingScore ?? "—"}%
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onEdit({
                      ...q,
                      timeLimit: q.duration ?? q.timeLimit ?? 30,
                      passingScore: q.passRate ?? q.passingScore ?? 70,
                    })
                  }
                  aria-label="Edit quiz"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => onDelete(q.id)}
                  aria-label="Delete quiz"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
