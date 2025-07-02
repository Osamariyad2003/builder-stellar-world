import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and preferences
        </p>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <SettingsIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Application Settings</h3>
          <p className="text-muted-foreground mb-4">
            This section will provide configuration options for the admin panel.
          </p>
          <p className="text-sm text-muted-foreground">
            Features: User management, system configuration, backup settings,
            security options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
