import React from "react";
import { useParams, Link } from "react-router-dom";
import { useYears } from "@/hooks/useYears";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, HelpCircle } from "lucide-react";

export default function SubjectPage() {
  const { id } = useParams();
  const { subjects, loading } = useYears();

  const subject = subjects.find((s) => s.id === id);

  if (loading) return <div>Loading...</div>;

  if (!subject) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">Subject not found</h3>
          <p className="text-muted-foreground mt-2">The subject you requested does not exist.</p>
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
        <div>
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
              subject.lectures.map((lecture) => (
                <div key={lecture.id} className="p-3 border rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{lecture.name}</div>
                    <div className="text-sm text-muted-foreground">{lecture.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <PlayCircle className="h-4 w-4" /> View
                    </a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Files ({lecture.files?.length || 0})
                    </a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                      <HelpCircle className="h-4 w-4" /> Quizzes ({lecture.quizzes?.length || 0})
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No lectures yet for this subject.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
