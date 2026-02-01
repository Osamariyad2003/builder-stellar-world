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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationForm } from "@/components/admin/NotificationForm";
import { useNotifications } from "@/hooks/useNotifications";
import { useUsers } from "@/hooks/useUsers";
import {
  Plus,
  Search,
  Bell,
  BellRing,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Calendar,
  User,
  Loader2,
  MessageSquare,
} from "lucide-react";

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { notifications, loading, error, createNotification, updateNotification, markAsRead, markAllAsRead, deleteNotification, unreadCount } =
    useNotifications();
  const { users } = useUsers();

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.displayName || user?.email || userId;
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(notification.userId).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const unreadNotifications = filteredNotifications.filter((n) => !n.read);
  const readNotifications = filteredNotifications.filter((n) => n.read);

  const handleEdit = (notification: any) => {
    setSelectedNotification(notification);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        await deleteNotification(id);
      } catch (error) {
        console.error("Error deleting notification:", error);
        alert("Failed to delete notification. Please try again.");
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      alert("Failed to mark notification as read. Please try again.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (window.confirm("Mark all notifications as read?")) {
      try {
        await markAllAsRead();
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        alert("Failed to mark all notifications as read. Please try again.");
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedNotification(null);
    setIsFormOpen(true);
  };

  if (isFormOpen) {
    return (
      <NotificationForm
        notification={selectedNotification}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedNotification(null);
        }}
        onSave={async (notificationData) => {
          try {
            if (selectedNotification) {
              await updateNotification(selectedNotification.id, notificationData);
            } else {
              await createNotification(notificationData);
            }
            setIsFormOpen(false);
            setSelectedNotification(null);
          } catch (error) {
            console.error("Error saving notification:", error);
            alert("Failed to save notification. Please try again.");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications Management</h1>
          <p className="text-muted-foreground">
            Create and manage notifications for users
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Notification
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${filteredNotifications.length} total notifications`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({filteredNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="read">
                  Read ({readNotifications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={notification.read ? "opacity-75" : "border-primary/50"}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                                )}
                                <h3 className="font-semibold text-lg">
                                  {notification.title}
                                </h3>
                                <Badge variant="outline">{notification.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getUserName(notification.userId)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {notification.createdAt.toLocaleDateString()}
                                </div>
                                {notification.batchId && (
                                  <Badge variant="secondary" className="text-xs">
                                    Batch: {notification.batchId.slice(0, 8)}...
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarkAsRead(notification.id!)}
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(notification)}
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(notification.id!)}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-4">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BellRing className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No unread notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unreadNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className="border-primary/50"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                                <h3 className="font-semibold text-lg">
                                  {notification.title}
                                </h3>
                                <Badge variant="outline">{notification.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getUserName(notification.userId)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {notification.createdAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsRead(notification.id!)}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(notification)}
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(notification.id!)}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="read" className="mt-4">
                {readNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No read notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {readNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className="opacity-75"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {notification.title}
                                </h3>
                                <Badge variant="outline">{notification.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getUserName(notification.userId)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {notification.createdAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(notification)}
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(notification.id!)}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
