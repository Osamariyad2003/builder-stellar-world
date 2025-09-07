import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLectureQuizzes } from "@/hooks/useLectureResources";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function FlashcardsPage() {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get("lecture");
  const quizId = searchParams.get("quiz");

  const { items: quizzes, loading, error } = useLectureQuizzes(lectureId);
  const quiz = quizzes.find((q: any) => q.id === quizId);

  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<number[]>([]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!quiz) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">Quiz not found</h3>
          <p className="text-muted-foreground mt-2">Select a quiz to start flashcards.</p>
          <div className="mt-4">
            <Link to="/admin/quizzes"><Button>Back</Button></Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const questions = quiz.questions || [];
  const totalWeight = questions.reduce((s: number, q: any) => s + ((q.weight && Number(q.weight)) || 1), 0);

  const current = questions[index];
  const currentWeight = (current && (current.weight || 1)) || 1;

  const currentMark = marks[index] ?? 0;

  const setMarkForIndex = (i: number, value: number) => {
    const copy = [...marks];
    copy[i] = value;
    setMarks(copy);
  };

  const totalMarked = marks.reduce((s, m, i) => s + (m || 0), 0);
  const percent = Math.round((totalMarked / totalWeight) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flashcards: {quiz.title}</h1>
          <p className="text-muted-foreground">Fill marks per question. Total progress shows weighted score.</p>
        </div>
        <div>
          <Link to="/admin/quizzes"><Button variant="ghost">Back</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm">Total: {totalWeight} points — Current: {totalMarked} points</div>
          <Progress value={percent} />
          <div className="text-xs text-muted-foreground mt-2">{percent}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question {index + 1} / {questions.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="font-medium">{current.question}</div>
            {current.imageUrl && (
              <img src={current.imageUrl} alt="question" className="w-full max-w-md object-contain" />
            )}

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Weight: {currentWeight}</div>
              <label className="text-sm">Mark (0 - {currentWeight})</label>
              <input
                type="number"
                min={0}
                max={currentWeight}
                value={currentMark}
                onChange={(e) => setMarkForIndex(index, Math.max(0, Math.min(currentWeight, Number(e.target.value) || 0)))}
                className="border rounded px-2 py-1 w-24"
              />
            </div>

            <div className="flex gap-2">
              <Button disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>Previous</Button>
              <Button disabled={index === questions.length - 1} onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>Next</Button>
              <Button variant="outline" onClick={() => { setMarks([]); setIndex(0); }}>Reset</Button>
            </div>

            <div className="mt-4">
              <Button onClick={() => alert(`Final score: ${totalMarked}/${totalWeight} (${percent}%)`)}>Finish</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
