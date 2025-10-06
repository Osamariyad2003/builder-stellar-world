import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, Trash2, Edit2 } from "lucide-react";
import { ResearchForm } from "@/components/admin/ResearchForm";
import { useResearch } from "@/hooks/useResearch";

export default function Research() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { research, loading, error, createResearch, updateResearch, deleteResearch } = useResearch();

  const filtered = research.filter((r) => r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelected(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this research entry?")) {
      await deleteResearch(id);
    }
  };

  if (isFormOpen) {
    return (
      <ResearchForm
        research={selected}
        onClose={() => {
          setIsFormOpen(false);
          setSelected(null);
        }}
        onSave={async (data) => {
          try {
            if (selected) {
              await updateResearch(selected.id, data);
            } else {
              await createResearch(data as any);
            }
            setIsFormOpen(false);
            setSelected(null);
          } catch (err) {
            console.error(err);
            alert("Failed to save. Please try again.");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Research</h1>
          <p className="text-muted-foreground">Manage research projects and student/faculty submissions</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Research
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by project title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading research entries...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">⚠️ Error loading research</div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold line-clamp-1">{r.projectTitle}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{r.abstract}</p>
                        <div className="flex gap-2 flex-wrap mt-3 text-xs text-muted-foreground">
                          {(r.fieldOfResearch || []).map((f: string) => (
                            <span key={f} className="bg-muted px-2 py-1 rounded text-xs">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" onClick={() => handleEdit(r)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleDelete(r.id!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
