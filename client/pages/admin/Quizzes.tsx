import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLectures } from "@/hooks/useLectures";
import { useLectureQuizzes } from "@/hooks/useLectureResources";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function QuizzesPage() {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get("lecture");
  const { lectures, loading: lecturesLoading, error: lecturesError } = useLectures();
  const { items: quizzes, loading, error } = useLectureQuizzes(lectureId);

  if (loading || lecturesLoading) return <div>Loading...</div>;
  if (error || lecturesError) return <div className="text-destructive">{error || lecturesError}</div>;

  const lecture = lectures.find((l) => l.id === lectureId);
  if (!lecture) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">No lecture selected</h3>
          <p className="text-muted-foreground mt-2">Select a lecture to view its quizzes.</p>
          <div className="mt-4">
            <Link to="/admin/years"><Button>Back to Years</Button></Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quizzes for {lecture.title || lecture.id}</h1>
          <p className="text-muted-foreground">{lecture.description}</p>
        </div>
        <div>
          <Link to="/admin/resources"><Button variant="ghost">Back</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quizzes ({lecture.quizzes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {quizzes && quizzes.length > 0 ? (
            <div className="space-y-3">
              {quizzes.map((q: any) => (
                <div key={q.id} className="p-3 border rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-6 w-6 text-purple-600" />
                    <div>
                      <div className="font-medium">{q.title || "Untitled Quiz"}</div>
                      <div className="text-sm text-muted-foreground">{q.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">Type: <strong>{(q as any).type || 'multiple_choice'}</strong></div>
                    </div>
                  </div>
                  <div>
                    {((q as any).type || 'multiple_choice') === 'flashcard' ? (
                      <Button onClick={() => window.location.href = `/admin/flashcards?lecture=${lectureId}&quiz=${q.id}`}>Flashcards</Button>
                    ) : (
                      <Button onClick={() => alert('Multiple choice runner not implemented. Use Flashcards or implement MCQ runner.')}>Start</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No quizzes available for this lecture.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
