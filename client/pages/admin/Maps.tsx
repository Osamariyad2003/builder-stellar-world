import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMaps } from "@/hooks/useMaps";
import { MapPin, Plus, Trash2, Edit2 } from "lucide-react";
import { MapVideoCard } from "@/components/student/MapVideoCard";

export default function Maps() {
  const { maps, loading, error, createMap, updateMap, deleteMap } = useMaps();
  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    video_url: "",
    type: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () =>
    setForm({
      name: "",
      location: "",
      description: "",
      video_url: "",
      type: "",
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateMap(editingId, form);
      } else {
        await createMap(form);
      }
      resetForm();
      setEditingId(null);
    } catch (err) {
      console.error("Error saving map:", err);
      alert("Failed to save map");
    } finally {
      setSaving(false);
    }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
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
            <div className="md:col-span-3 flex justify-end space-x-2">
              {editingId ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Plus className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={saving}>
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? "Adding..." : "Add"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Video Gallery Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Video Gallery</h2>
          <p className="text-muted-foreground">View all location videos in gallery format</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div>Loading videos...</div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-destructive">{error}</div>
            </CardContent>
          </Card>
        ) : maps.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">No maps yet. Add one above to get started!</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((m) => (
              <div key={m.id} className="relative group">
                <MapVideoCard
                  id={m.id}
                  name={m.name}
                  description={m.description}
                  location={m.location}
                  type={m.type}
                  video_url={m.video_url}
                  thumbnailUrl={m.thumbnailUrl}
                />
                {/* Admin Controls Overlay */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(m.id);
                      setForm({
                        name: m.name || "",
                        location: m.location || "",
                        description: m.description || "",
                        video_url: m.video_url || "",
                        type: m.type || "",
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="shadow-lg"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${m.name}"?`)) {
                        deleteMap(m.id);
                      }
                    }}
                    className="shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
