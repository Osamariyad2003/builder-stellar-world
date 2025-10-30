import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useYears } from "@/hooks/useYears";
import { uploadImageToCloudinary, setLocalCloudinaryConfig } from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";
import { SubjectForm } from "@/components/admin/SubjectForm";
import { LectureForm } from "@/components/admin/LectureForm";

export default function YearPage() {
  const { id } = useParams();
  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false);
  const [isLectureFormOpen, setIsLectureFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string>("");

  const {
    years,
    subjects,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
    updateYear,
    createSubject,
    createLecture,
    deleteSubject,
    deleteLecture,
  } = useYears();

  const year = years.find((y: any) => y.id === id);

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">Loading...</CardContent>
      </Card>
    );
  }

  if (!year) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-destructive mb-4">Year not found</div>
          <div className="flex gap-2 justify-center">
            <Link to="/admin/years">
              <Button variant="outline">Back to Years</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSaveSubject = async (subjectData: any) => {
    try {
      await createSubject({ ...subjectData, yearId: year.id });
      setIsSubjectFormOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to add subject");
    }
  };

  const handleSaveLecture = async (lectureData: any) => {
    try {
      await createLecture(lectureData);
      setIsLectureFormOpen(false);
      setSelectedSubject(null);
    } catch (e) {
      console.error(e);
      alert("Failed to add lecture");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/years">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </Link>

          <div>
            {year.batchName ? (
              <>
                <h1 className="text-2xl font-bold">{year.batchName}</h1>
                <div className="text-sm text-muted-foreground">
                  Year {year.yearNumber}
                </div>
              </>
            ) : (
              <h1 className="text-2xl font-bold">Year {year.yearNumber}</h1>
            )}

            <p className="text-muted-foreground">
              Manage subjects and lectures for this year
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Buttons to open inline editor */}
          {!(window as any).__yearEditing && (
            <>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      try {
                        let imageUrl: string | null = null;
                        try {
                          imageUrl = await uploadImageToCloudinary(file);
                        } catch (cloudErr: any) {
                          console.warn("Cloudinary upload failed, attempting ImageKit fallback:", cloudErr?.message || cloudErr);
                          try {
                            imageUrl = await uploadToImageKitServer(file, file.name);
                          } catch (ikErr: any) {
                            console.error("ImageKit upload also failed:", ikErr);
                            throw cloudErr; // preserve original cloudinary error for UX
                          }
                        }

                        if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
                          console.error("Invalid upload response:", imageUrl);
                          alert("Image upload failed: unexpected response from upload provider");
                          (window as any).__yearEditing = false;
                          return;
                        }

                        await updateYear?.(year.id, {
                          imageUrl,
                          image_url: imageUrl,
                        });
                        // Force refresh
                        (window as any).__yearEditing = false;
                      } catch (e: any) {
                        console.error(e);
                        const msg = e?.message || String(e);
                        if (msg && msg.toLowerCase().includes("cloudinary cloud name is not configured")) {
                          const cloud = window.prompt("Cloudinary cloud name (e.g. dflp2vxn2):");
                          if (!cloud) {
                            alert("No cloud name provided. Upload cancelled.");
                            (window as any).__yearEditing = false;
                            return;
                          }
                          const preset = window.prompt("Unsigned upload preset (leave empty to use signed server flow):", "");
                          const apiKeyPrompt = window.prompt(
                            "Public Cloudinary API key (optional, e.g. 686641252611351):",
                            "",
                          );
                          try {
                            setLocalCloudinaryConfig(cloud, preset || null, apiKeyPrompt || null);
                            const imageUrl2 = await uploadImageToCloudinary(file);
                            console.log("Cloudinary upload result after config:", imageUrl2);
                            if (!imageUrl2 || typeof imageUrl2 !== "string" || !imageUrl2.startsWith("http")) {
                              alert("Image upload failed: unexpected response from Cloudinary");
                              (window as any).__yearEditing = false;
                              return;
                            }
                            await updateYear?.(year.id, { imageUrl: imageUrl2, image_url: imageUrl2 });
                          } catch (e2: any) {
                            console.error(e2);
                            alert("Image upload failed after configuring Cloudinary: " + (e2.message || e2));
                          }
                          (window as any).__yearEditing = false;
                          return;
                        }

                        alert("Image upload failed: " + (e.message || e));
                      }
                    };
                    input.click();
                  } catch (e) {
                    console.error(e);
                    alert("Could not open file dialog");
                  }
                }}
              >
                <Upload className="h-4 w-4 mr-2" />{" "}
                {year.imageUrl ? "Change Image" : "Add Image"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  (window as any).__yearEditing = true;
                  setEditingField("academicSupervisor");
                  setFieldValue(
                    (year as any).academicSupervisor ||
                      (year as any).acadmic_supervisor ||
                      "",
                  );
                }}
              >
                Academic Supervisor
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  (window as any).__yearEditing = true;
                  setEditingField("actor");
                  setFieldValue((year as any).actor || "");
                }}
              >
                Actor
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  (window as any).__yearEditing = true;
                  setEditingField("groupUrl");
                  setFieldValue(
                    (year as any).groupUrl || (year as any).group_url || "",
                  );
                }}
              >
                Group URL
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  (window as any).__yearEditing = true;
                  setEditingField("batchName");
                  setFieldValue(
                    (year as any).batchName || (year as any).batch_name || "",
                  );
                }}
              >
                Batch Name
              </Button>

              {year.imageUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={async () => {
                    if (!confirm("Remove year image?")) return;
                    try {
                      await updateYear?.(year.id, { imageUrl: "" });
                    } catch (e) {
                      console.error(e);
                      alert("Failed to remove year image");
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {editingField && (
        <div className="mt-4 flex items-center gap-2">
          <Input
            placeholder={
              editingField === "image"
                ? "Image URL"
                : editingField === "groupUrl"
                  ? "Group URL"
                  : editingField === "academicSupervisor"
                    ? "Academic Supervisor"
                    : "Actor"
            }
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            className="w-full max-w-2xl"
          />
          <Button
            onClick={async () => {
              try {
                const payload: any = {};
                if (editingField === "image") {
                  payload.imageUrl = fieldValue;
                } else if (editingField === "academicSupervisor") {
                  payload.academicSupervisor = fieldValue;
                  payload.acadmic_supervisor = fieldValue; // legacy
                } else if (editingField === "actor") {
                  payload.actor = fieldValue;
                } else if (editingField === "groupUrl") {
                  payload.groupUrl = fieldValue;
                  payload.group_url = fieldValue; // legacy
                } else if (editingField === "batchName") {
                  payload.batchName = fieldValue;
                  payload.batch_name = fieldValue; // legacy
                }
                await updateYear?.(year.id, payload);
                setEditingField(null);
                setFieldValue("");
                (window as any).__yearEditing = false;
              } catch (e) {
                console.error(e);
                alert("Failed to save field");
              }
            }}
          >
            Save
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEditingField(null);
              setFieldValue("");
              (window as any).__yearEditing = false;
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Subjects
            <Badge variant="secondary">
              {year.subjects?.length || 0} subjects
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setIsSubjectFormOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-3 w-3" /> Add Subject
            </Button>
          </div>

          {!year.subjects || year.subjects.length === 0 ? (
            <div className="text-center py-8">No subjects added yet.</div>
          ) : (
            <div className="grid gap-4">
              {year.subjects.map((subject: any) => (
                <Card key={subject.id} className="bg-secondary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {subject.imageUrl ? (
                          <img
                            src={subject.imageUrl}
                            alt={subject.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded" />
                        )}

                        <div>
                          <div className="font-medium text-lg">
                            {subject.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(subject.lectures || []).length} lectures
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedSubject(subject);
                            setIsLectureFormOpen(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          Add Lecture
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={async () => {
                            if (!confirm(`Delete subject "${subject.name}"?`))
                              return;
                            try {
                              await deleteSubject(subject.id);
                            } catch (e) {
                              console.error(e);
                              alert("Failed to delete subject");
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {subject.lectures && subject.lectures.length > 0 && (
                    <CardContent>
                      <div className="grid gap-3">
                        {subject.lectures.map((lecture: any) => (
                          <Card
                            key={lecture.id}
                            className="bg-background border"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="relative w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  {lecture.imageUrl ? (
                                    <img
                                      src={lecture.imageUrl}
                                      alt={lecture.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      No image
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm mb-1 truncate">
                                    {lecture.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                    {lecture.description ||
                                      "No description available"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          `Delete lecture "${lecture.name}"?`,
                                        )
                                      )
                                        return;
                                      try {
                                        await deleteLecture(
                                          subject.id,
                                          lecture.id,
                                        );
                                      } catch (e) {
                                        console.error(e);
                                        alert("Failed to delete lecture");
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isSubjectFormOpen && (
        <SubjectForm
          year={year.yearNumber}
          yearType={year.type}
          onClose={() => setIsSubjectFormOpen(false)}
          onSave={handleSaveSubject}
        />
      )}

      {isLectureFormOpen && selectedSubject && (
        <LectureForm
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
          yearType={year.type}
          onClose={() => {
            setIsLectureFormOpen(false);
            setSelectedSubject(null);
          }}
          onSave={handleSaveLecture}
        />
      )}
    </div>
  );
}
