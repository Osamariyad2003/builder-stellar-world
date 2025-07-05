import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfessors } from "@/hooks/useProfessors";
import { ProfessorForm } from "@/components/admin/ProfessorForm";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  MapPin,
  User,
  Loader2,
} from "lucide-react";

export default function Professors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    professors,
    loading,
    error,
    createProfessor,
    updateProfessor,
    deleteProfessor,
    isOfflineMode,
  } = useProfessors();

  const filteredProfessors = professors.filter(
    (professor) =>
      professor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this professor?")) {
      try {
        await deleteProfessor(id);
      } catch (error) {
        console.error("Error deleting professor:", error);
        alert("Failed to delete professor. Please try again.");
      }
    }
  };

  if (isFormOpen) {
    return (
      <ProfessorForm
        professor={selectedProfessor}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProfessor(null);
        }}
        onSave={async (professorData) => {
          try {
            if (selectedProfessor) {
              await updateProfessor(selectedProfessor.id!, professorData);
            } else {
              await createProfessor(professorData as any);
            }
            setIsFormOpen(false);
            setSelectedProfessor(null);
          } catch (error) {
            console.error("Error saving professor:", error);
            alert("Failed to save professor. Please try again.");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Professors Management</h1>
          <p className="text-muted-foreground">
            Manage faculty information and profiles
            {isOfflineMode && (
              <span className="ml-2 text-orange-600 font-medium">
                • Working in offline mode
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Professor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search professors by name, department, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading professors...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">
              ⚠️ Error loading professors
            </div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Professors Grid */}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfessors.map((professor) => (
            <Card
              key={professor.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={professor.imageUrl}
                        alt={professor.name}
                      />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {professor.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {professor.department}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedProfessor(professor);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(professor.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{professor.email}</span>
                  </div>
                  {professor.officeLocation && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{professor.officeLocation}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && filteredProfessors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No professors found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "No professors match your search criteria."
                : "Start by adding your first professor."}
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Professor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
