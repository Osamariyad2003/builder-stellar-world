import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, FileText, HelpCircle, Plus } from "lucide-react";

export default function Resources() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resources Management</h1>
          <p className="text-muted-foreground">
            Manage videos, files, and quizzes for medical students
          </p>
        </div>
      </div>

      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Video Resources</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Video Management</h3>
              <p className="text-muted-foreground mb-4">
                This section will allow you to manage YouTube videos organized
                by medical subjects.
              </p>
              <p className="text-sm text-muted-foreground">
                Features: Add YouTube videos, organize by subject, manage
                thumbnails and metadata.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">File Resources</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">File Management</h3>
              <p className="text-muted-foreground mb-4">
                This section will allow you to upload and manage educational
                files.
              </p>
              <p className="text-sm text-muted-foreground">
                Features: Firebase Storage integration, file categorization,
                access control.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Quiz Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quiz Builder</h3>
              <p className="text-muted-foreground mb-4">
                This section will provide a comprehensive quiz creation and
                management system.
              </p>
              <p className="text-sm text-muted-foreground">
                Features: Multi-choice questions, image support, automatic
                grading, analytics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
