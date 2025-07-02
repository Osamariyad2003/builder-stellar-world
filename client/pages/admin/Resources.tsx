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
} from "lucide-react";

// Mock lecture data
const mockLectures = [
  {
    id: "1",
    title: "Introduction to Human Anatomy",
    description:
      "Basic overview of human body systems and anatomical terminology",
    subject: "Anatomy",
    order: 1,
    createdAt: new Date("2024-01-15"),
    createdBy: "Dr. Johnson",
    videos: [
      {
        id: "v1",
        title: "Body Systems Overview",
        youtubeUrl: "https://youtube.com/watch?v=abc123",
        duration: "45:30",
        description: "Complete overview of all body systems",
        uploadedAt: new Date("2024-01-15"),
        uploadedBy: "Dr. Johnson",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
      },
      {
        id: "v2",
        title: "Anatomical Terminology",
        youtubeUrl: "https://youtube.com/watch?v=def456",
        duration: "30:15",
        description: "Medical terminology and anatomical positions",
        uploadedAt: new Date("2024-01-15"),
        uploadedBy: "Dr. Johnson",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop",
      },
    ],
    files: [
      {
        id: "f1",
        title: "Anatomy Reference Guide",
        fileUrl: "/files/anatomy-guide.pdf",
        fileType: "PDF",
        fileSize: "2.5 MB",
        description: "Comprehensive anatomy reference with diagrams",
        uploadedAt: new Date("2024-01-15"),
        uploadedBy: "Dr. Johnson",
      },
      {
        id: "f2",
        title: "Body Systems Worksheet",
        fileUrl: "/files/body-systems.docx",
        fileType: "DOCX",
        fileSize: "1.2 MB",
        description: "Practice worksheet for body systems",
        uploadedAt: new Date("2024-01-15"),
        uploadedBy: "Dr. Johnson",
      },
    ],
    quizzes: [
      {
        id: "q1",
        title: "Anatomy Basics Quiz",
        description: "Test your knowledge of basic anatomical concepts",
        questions: [],
        timeLimit: 30,
        passingScore: 70,
        createdAt: new Date("2024-01-15"),
        createdBy: "Dr. Johnson",
      },
    ],
  },
  {
    id: "2",
    title: "Cardiovascular System",
    description: "Detailed study of heart anatomy and blood circulation",
    subject: "Physiology",
    order: 2,
    createdAt: new Date("2024-01-16"),
    createdBy: "Dr. Smith",
    videos: [
      {
        id: "v3",
        title: "Heart Anatomy Deep Dive",
        youtubeUrl: "https://youtube.com/watch?v=ghi789",
        duration: "55:20",
        description: "Detailed exploration of heart chambers and valves",
        uploadedAt: new Date("2024-01-16"),
        uploadedBy: "Dr. Smith",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=300&h=200&fit=crop",
      },
    ],
    files: [
      {
        id: "f3",
        title: "Heart Diagram Collection",
        fileUrl: "/files/heart-diagrams.pdf",
        fileType: "PDF",
        fileSize: "4.1 MB",
        description: "Detailed heart anatomy diagrams",
        uploadedAt: new Date("2024-01-16"),
        uploadedBy: "Dr. Smith",
      },
    ],
    quizzes: [
      {
        id: "q2",
        title: "Cardiovascular Quiz",
        description: "Test your understanding of the cardiovascular system",
        questions: [],
        timeLimit: 45,
        passingScore: 75,
        createdAt: new Date("2024-01-16"),
        createdBy: "Dr. Smith",
      },
    ],
  },
];

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredLectures = mockLectures.filter(
    (lecture) =>
      lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecture.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateNew = () => {
    setSelectedLecture(null);
    setIsFormOpen(true);
  };

  const handleEdit = (lecture: any) => {
    setSelectedLecture(lecture);
    setIsFormOpen(true);
  };

  if (isFormOpen) {
    return (
      <LectureForm
        lecture={selectedLecture}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLecture(null);
        }}
        onSave={(lectureData) => {
          console.log("Save lecture:", lectureData);
          setIsFormOpen(false);
          setSelectedLecture(null);
        }}
      />
    );
  }

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

      {/* Lectures List */}
      <div className="space-y-6">
        {filteredLectures.map((lecture) => (
          <Card key={lecture.id} className="hover:shadow-md transition-shadow">
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
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <PlayCircle className="h-4 w-4 text-green-600" />
                    Videos ({lecture.videos.length})
                  </div>
                  {lecture.videos.length > 0 ? (
                    <div className="space-y-2">
                      {lecture.videos.map((video) => (
                        <div
                          key={video.id}
                          className="p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex gap-3">
                            {video.thumbnailUrl && (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {video.duration}
                              </div>
                            </div>
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
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Files ({lecture.files.length})
                  </div>
                  {lecture.files.length > 0 ? (
                    <div className="space-y-2">
                      {lecture.files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 bg-secondary/50 rounded-lg"
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {file.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {file.fileType}
                            </Badge>
                            <span>{file.fileSize}</span>
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
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                    Quizzes ({lecture.quizzes.length})
                  </div>
                  {lecture.quizzes.length > 0 ? (
                    <div className="space-y-2">
                      {lecture.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="p-3 bg-secondary/50 rounded-lg"
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {quiz.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {quiz.timeLimit}min
                            <span>•</span>
                            <span>{quiz.passingScore}% pass</span>
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

      {filteredLectures.length === 0 && (
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
