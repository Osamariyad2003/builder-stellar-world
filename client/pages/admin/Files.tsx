import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLectures } from "@/hooks/useLectures";
import { useLectureFiles } from "@/hooks/useLectureResources";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit2, Trash2 } from "lucide-react";

export default function FilesPage() {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get("lecture");
  const { lectures, loading: lecturesLoading, error: lecturesError } = useLectures();
  const { items: files, loading, error } = useLectureFiles(lectureId);

  if (loading || lecturesLoading) return <div>Loading...</div>;
  if (error || lecturesError) return <div className="text-destructive">{error || lecturesError}</div>;

  const lecture = lectures.find((l) => l.id === lectureId);
  if (!lecture) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">No lecture selected</h3>
          <p className="text-muted-foreground mt-2">Select a lecture to view its files.</p>
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
          <h1 className="text-2xl font-bold">Files for {lecture.title || lecture.id}</h1>
          <p className="text-muted-foreground">{lecture.description}</p>
        </div>
        <div>
          <Link to="/admin/resources"><Button variant="ghost">Back</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Files ({lecture.files?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {files && files.length > 0 ? (
            <div className="space-y-3">
              {files.map((f: any) => (
                <div key={f.id} className="p-4 border rounded flex items-center justify-between hover:bg-muted/50 transition">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-base">{f.filename || f.title || f.name || "Untitled File"}</div>
                      <div className="text-sm text-muted-foreground">{f.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {f.fileSize && <span>Size: <strong>{f.fileSize}</strong></span>}
                        {f.uploadedAt && <span> • Uploaded: <strong>{new Date(f.uploadedAt).toLocaleDateString()}</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(f.fileUrl || f.url || "", "_blank")}
                      title="Download File"
                    >
                      <Download className="h-5 w-5 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => alert('Edit file functionality coming soon')}
                      title="Edit File"
                    >
                      <Edit2 className="h-5 w-5 text-amber-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => alert('Delete file functionality coming soon')}
                      className="text-destructive"
                      title="Delete File"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No files available for this lecture.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
