import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";

export default function Professors() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Professors Management</h1>
          <p className="text-muted-foreground">
            Manage faculty information and profiles
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Professor
        </Button>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Professor Management</h3>
          <p className="text-muted-foreground mb-4">
            This section will allow you to manage professor profiles and
            information.
          </p>
          <p className="text-sm text-muted-foreground">
            Features: Profile management, department organization, contact
            information, office locations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
