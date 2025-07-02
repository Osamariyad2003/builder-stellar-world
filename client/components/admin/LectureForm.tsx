import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Lecture } from "@shared/types";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  PlayCircle,
  FileText,
  HelpCircle,
  Edit2,
  Trash2,
  Upload,
  Link as LinkIcon,
  Clock,
} from "lucide-react";

interface LectureFormProps {
  lecture?: Lecture | null;
  onClose: () => void;
  onSave: (lecture: Partial<Lecture>) => void;
}

export function LectureForm({ lecture, onClose, onSave }: LectureFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    order: 1,
    videos: [] as any[],
    files: [] as any[],
    quizzes: [] as any[],
  });
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);

  // Video form state
  const [videoForm, setVideoForm] = useState({
    title: "",
    youtubeUrl: "",
    duration: "",
    description: "",
    thumbnailUrl: "",
  });

  // File form state
  const [fileForm, setFileForm] = useState({
    title: "",
    fileType: "",
    fileSize: "",
    description: "",
    fileUrl: "",
  });

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    timeLimit: 30,
    passingScore: 70,
  });

  useEffect(() => {
    if (lecture) {
      setFormData({
        title: lecture.title || "",
        description: lecture.description || "",
        subject: lecture.subject || "",
        order: lecture.order || 1,
        videos: lecture.videos || [],
        files: lecture.files || [],
        quizzes: lecture.quizzes || [],
      });
    }
  }, [lecture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lectureData: Partial<Lecture> = {
        ...formData,
        ...(lecture
          ? {}
          : {
              createdAt: new Date(),
              createdBy: "Current User",
            }),
      };

      onSave(lectureData);
    } catch (error) {
      console.error("Error saving lecture:", error);
    } finally {
      setLoading(false);
    }
  };

  const addVideo = () => {
    if (videoForm.title && videoForm.youtubeUrl) {
      const newVideo = {
        id: `v_${Date.now()}`,
        ...videoForm,
        uploadedAt: new Date(),
        uploadedBy: "Current User",
      };
      setFormData((prev) => ({
        ...prev,
        videos: [...prev.videos, newVideo],
      }));
      setVideoForm({
        title: "",
        youtubeUrl: "",
        duration: "",
        description: "",
        thumbnailUrl: "",
      });
    }
  };

  const removeVideo = (videoId: string) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== videoId),
    }));
  };

  const addFile = () => {
    if (fileForm.title && fileForm.fileType) {
      const newFile = {
        id: `f_${Date.now()}`,
        ...fileForm,
        uploadedAt: new Date(),
        uploadedBy: "Current User",
      };
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, newFile],
      }));
      setFileForm({
        title: "",
        fileType: "",
        fileSize: "",
        description: "",
        fileUrl: "",
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
  };

  const addQuiz = () => {
    if (quizForm.title) {
      const newQuiz = {
        id: `q_${Date.now()}`,
        ...quizForm,
        questions: [],
        createdAt: new Date(),
        createdBy: "Current User",
      };
      setFormData((prev) => ({
        ...prev,
        quizzes: [...prev.quizzes, newQuiz],
      }));
      setQuizForm({
        title: "",
        description: "",
        timeLimit: 30,
        passingScore: 70,
      });
    }
  };

  const removeQuiz = (quizId: string) => {
    setFormData((prev) => ({
      ...prev,
      quizzes: prev.quizzes.filter((q) => q.id !== quizId),
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {lecture ? "Edit Lecture" : "Create Lecture"}
            </h1>
            <p className="text-muted-foreground">
              {lecture
                ? "Update the lecture and its resources"
                : "Create a new lecture with videos, files, and quizzes"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Lecture Details</TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Videos ({formData.videos.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files ({formData.files.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quizzes ({formData.quizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lecture Information</CardTitle>
                <CardDescription>
                  Basic information about the lecture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter lecture title..."
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Anatomy, Physiology..."
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this lecture covers..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Video</CardTitle>
                <CardDescription>
                  Add educational videos from YouTube
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="videoTitle">Video Title</Label>
                    <Input
                      id="videoTitle"
                      placeholder="Enter video title..."
                      value={videoForm.title}
                      onChange={(e) =>
                        setVideoForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL</Label>
                    <Input
                      id="youtubeUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoForm.youtubeUrl}
                      onChange={(e) =>
                        setVideoForm((prev) => ({
                          ...prev,
                          youtubeUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      placeholder="e.g., 45:30"
                      value={videoForm.duration}
                      onChange={(e) =>
                        setVideoForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                    <Input
                      id="thumbnailUrl"
                      placeholder="https://example.com/thumb.jpg"
                      value={videoForm.thumbnailUrl}
                      onChange={(e) =>
                        setVideoForm((prev) => ({
                          ...prev,
                          thumbnailUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoDescription">Description</Label>
                  <Textarea
                    id="videoDescription"
                    placeholder="Describe the video content..."
                    value={videoForm.description}
                    onChange={(e) =>
                      setVideoForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <Button type="button" onClick={addVideo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </CardContent>
            </Card>

            {/* Video List */}
            {formData.videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Added Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{video.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {video.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {video.duration && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {video.duration}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              YouTube
                            </Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVideo(video.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add File</CardTitle>
                <CardDescription>
                  Add educational documents and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fileTitle">File Title</Label>
                    <Input
                      id="fileTitle"
                      placeholder="Enter file title..."
                      value={fileForm.title}
                      onChange={(e) =>
                        setFileForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fileType">File Type</Label>
                    <Input
                      id="fileType"
                      placeholder="e.g., PDF, DOCX, PPT"
                      value={fileForm.fileType}
                      onChange={(e) =>
                        setFileForm((prev) => ({
                          ...prev,
                          fileType: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fileSize">File Size</Label>
                    <Input
                      id="fileSize"
                      placeholder="e.g., 2.5 MB"
                      value={fileForm.fileSize}
                      onChange={(e) =>
                        setFileForm((prev) => ({
                          ...prev,
                          fileSize: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fileUrl">File URL</Label>
                    <Input
                      id="fileUrl"
                      placeholder="/files/document.pdf"
                      value={fileForm.fileUrl}
                      onChange={(e) =>
                        setFileForm((prev) => ({
                          ...prev,
                          fileUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileDescription">Description</Label>
                  <Textarea
                    id="fileDescription"
                    placeholder="Describe the file content..."
                    value={fileForm.description}
                    onChange={(e) =>
                      setFileForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <Button type="button" onClick={addFile}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add File
                </Button>
              </CardContent>
            </Card>

            {/* File List */}
            {formData.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Added Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{file.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {file.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {file.fileType}
                            </Badge>
                            {file.fileSize && (
                              <Badge variant="outline" className="text-xs">
                                {file.fileSize}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Quiz</CardTitle>
                <CardDescription>
                  Create quizzes to test student understanding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quizTitle">Quiz Title</Label>
                  <Input
                    id="quizTitle"
                    placeholder="Enter quiz title..."
                    value={quizForm.title}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quizDescription">Description</Label>
                  <Textarea
                    id="quizDescription"
                    placeholder="Describe what this quiz covers..."
                    value={quizForm.description}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="1"
                      value={quizForm.timeLimit}
                      onChange={(e) =>
                        setQuizForm((prev) => ({
                          ...prev,
                          timeLimit: parseInt(e.target.value) || 30,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={quizForm.passingScore}
                      onChange={(e) =>
                        setQuizForm((prev) => ({
                          ...prev,
                          passingScore: parseInt(e.target.value) || 70,
                        }))
                      }
                    />
                  </div>
                </div>
                <Button type="button" onClick={addQuiz}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quiz
                </Button>
              </CardContent>
            </Card>

            {/* Quiz List */}
            {formData.quizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Added Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                          <HelpCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {quiz.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {quiz.timeLimit}min
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {quiz.passingScore}% pass
                            </Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuiz(quiz.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading
              ? "Saving..."
              : lecture
                ? "Update Lecture"
                : "Create Lecture"}
          </Button>
        </div>
      </form>
    </div>
  );
}
