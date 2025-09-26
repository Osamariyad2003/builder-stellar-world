import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMaps } from "@/hooks/useMaps";
import { MapPin, Plus, Trash2 } from "lucide-react";

export default function Maps() {
  const { maps, loading, error, createMap, deleteMap } = useMaps();
  const [form, setForm] = useState({ name: "", location: "", description: "", video_url: "", type: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await createMap(form);
    setForm({ name: "", location: "", description: "", video_url: "", type: "" });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">Maps</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Map</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Map name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Location"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="">Select type</option>
                <option value="قاعة دراسية">قاعة دراسية</option>
                <option value="لابات">لابات</option>
                <option value="مدرج">مدرج</option>
                <option value="قاعات امتحانات">قاعات امتحانات</option>
                <option value="مطعم">مطعم</option>
                <option value="مصلى">مصلى</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input
                value={form.video_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, video_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                {saving ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Maps ({maps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : maps.length === 0 ? (
            <div className="text-muted-foreground">No maps yet.</div>
          ) : (
            <div className="grid gap-3">
              {maps.map((m) => (
                <div
                  key={m.id}
                  className="p-3 border rounded flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.location}
                    </div>
                    {m.type && (
                      <div className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium">{m.type}</span></div>
                    )}
                    {m.description && (
                      <div className="text-xs text-muted-foreground mt-1">{m.description}</div>
                    )}
                    {m.video_url && (
                      <a
                        className="text-xs text-blue-600 hover:underline"
                        href={m.video_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {m.video_url}
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMap(m.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
