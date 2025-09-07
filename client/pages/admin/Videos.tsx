import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLectures } from "@/hooks/useLectures";
import { useLectureVideos } from "@/hooks/useLectureResources";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export default function VideosPage() {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get("lecture");
  const { lectures, loading, error } = useLectures();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;

  const lecture = lectures.find((l) => l.id === lectureId);
  if (!lecture) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">No lecture selected</h3>
          <p className="text-muted-foreground mt-2">Select a lecture to view its videos.</p>
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
          <h1 className="text-2xl font-bold">Videos for {lecture.title || lecture.id}</h1>
          <p className="text-muted-foreground">{lecture.description}</p>
        </div>
        <div>
          <Link to="/admin/resources"><Button variant="ghost">Back</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Videos ({lecture.videos?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {lecture.videos && lecture.videos.length > 0 ? (
            <div className="space-y-3">
              {lecture.videos.map((v: any) => (
                <div key={v.id} className="p-3 border rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-32 h-18 object-cover rounded" />
                    ) : (
                      <div className="w-32 h-18 bg-muted rounded" />
                    )}
                    <div>
                      <div className="font-medium">{v.title || "Untitled"}</div>
                      <div className="text-sm text-muted-foreground">{v.description}</div>
                    </div>
                  </div>
                  <div>
                    <Button onClick={() => window.open(v.url || v.youtubeUrl || "", "_blank")}> <PlayCircle className="h-4 w-4 mr-2" /> Play </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No videos available for this lecture.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
