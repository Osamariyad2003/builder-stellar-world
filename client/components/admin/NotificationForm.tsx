import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Notification } from "@shared/types";
import { ArrowLeft, Save, Bell } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useYears } from "@/hooks/useYears";

interface NotificationFormProps {
  notification?: Notification | null;
  onClose: () => void;
  onSave: (notification: Omit<Notification, "id">) => void;
}

export function NotificationForm({ notification, onClose, onSave }: NotificationFormProps) {
  const { users } = useUsers();
  const { years } = useYears();
  const [formData, setFormData] = useState({
    userId: "",
    title: "",
    message: "",
    type: "news" as "news" | "announcement" | "system",
    relatedId: "",
    batchId: "",
    yearId: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification) {
      setFormData({
        userId: notification.userId || "",
        title: notification.title || "",
        message: notification.message || "",
        type: notification.type || "news",
        relatedId: notification.relatedId || "",
        batchId: notification.batchId || "",
        yearId: "",
      });
    }
  }, [notification]);

  // Get batchId from yearId if yearId is selected
  useEffect(() => {
    if (formData.yearId) {
      const selectedYear = years.find((y) => y.id === formData.yearId);
      if (selectedYear?.batchId) {
        setFormData((prev) => ({ ...prev, batchId: selectedYear.batchId || "" }));
      }
    }
  }, [formData.yearId, years]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const notificationData: Omit<Notification, "id"> = {
        userId: formData.userId,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        relatedId: formData.relatedId || undefined,
        read: false,
        createdAt: new Date(),
        batchId: formData.batchId || undefined,
      };

      onSave(notificationData);
    } catch (error) {
      console.error("Error saving notification:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique batches from years
  const batches = Array.from(
    new Set(
      years
        .map((y) => ({ id: y.batchId, name: y.batchName }))
        .filter((b) => b.id)
        .map((b) => JSON.stringify(b))
    )
  ).map((b) => JSON.parse(b));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {notification ? "Edit Notification" : "Create Notification"}
            </h1>
            <p className="text-muted-foreground">
              {notification
                ? "Update the notification details"
                : "Create a new notification for users"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Content</CardTitle>
                <CardDescription>
                  Main notification information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter notification title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your notification message here..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "news" | "announcement" | "system") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relatedId">Related ID (Optional)</Label>
                  <Input
                    id="relatedId"
                    placeholder="e.g., news article ID"
                    value={formData.relatedId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        relatedId: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: ID of related item (e.g., news article ID)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>
                  Select who should receive this notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, userId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id || ""}>
                          {user.displayName || user.email || user.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a specific user to notify
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearId">Year (Optional)</Label>
                  <Select
                    value={formData.yearId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, yearId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id || ""}>
                          {year.batchName
                            ? `${year.batchName} - Year ${year.yearNumber}`
                            : `Year ${year.yearNumber}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a year will automatically set the batch
                  </p>
                </div>

                {formData.batchId && (
                  <div className="space-y-2">
                    <Label htmlFor="batchId">Batch ID</Label>
                    <Input
                      id="batchId"
                      value={formData.batchId}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically set from selected year
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {notification ? "Update Notification" : "Create Notification"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
