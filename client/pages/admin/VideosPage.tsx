import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLectures } from "@/hooks/useLectures";
import { useLectureVideos } from "@/hooks/useLectureResources";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Edit2, Trash2 } from "lucide-react";

export default function VideosPage() {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get("lecture");
  const { lectures, loading: lecturesLoading, error: lecturesError } = useLectures();
  const { items: videos, loading, error } = useLectureVideos(lectureId);

  if (loading || lecturesLoading) return <div>Loading...</div>;
  if (error || lecturesError) return <div className="text-destructive">{error || lecturesError}</div>;

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
          <CardTitle>Videos ({videos?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {videos && videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((v: any) => (
                <div key={v.id} className="p-4 border rounded flex items-center justify-between hover:bg-muted/50 transition">
                  <div className="flex items-center gap-4 flex-1">
                    {v.thumbnailUrl && (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title || "Video"}
                        className="w-32 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-base">{v.title || "Untitled Video"}</div>
                      <div className="text-sm text-muted-foreground">{v.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {v.duration && <span>Duration: <strong>{v.duration}</strong></span>}
                        {v.url && <span> • <strong>{v.url.split('/').pop()}</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => window.open(v.url, '_blank')}
                      title="Open Video"
                    >
                      <PlayCircle className="h-5 w-5 text-blue-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => alert('Edit video functionality coming soon')}
                      title="Edit Video"
                    >
                      <Edit2 className="h-5 w-5 text-amber-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => alert('Delete video functionality coming soon')}
                      className="text-destructive"
                      title="Delete Video"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
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
