import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Check } from "lucide-react";
import { initializePushNotifications, requestNotificationPermission } from "@/lib/pushNotifications";
import { useAuth } from "@/hooks/useAuth";

export function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (currentUser && permission === "granted") {
      // Initialize push notifications when user is logged in and permission is granted
      initializePushNotifications().catch((error) => {
        console.error("Failed to initialize push notifications:", error);
      });
    }
  }, [currentUser, permission]);

  const handleRequestPermission = async () => {
    setIsInitializing(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setPermission("granted");
      } else {
        setPermission(Notification.permission);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setPermission(Notification.permission);
    } finally {
      setIsInitializing(false);
    }
  };

  if (!("Notification" in window)) {
    return null; // Browser doesn't support notifications
  }

  if (permission === "granted") {
    return (
      <Card className="border-green-500/50 bg-green-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Push Notifications Enabled
          </CardTitle>
          <CardDescription>
            You will receive notifications for new news articles and updates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permission === "denied") {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <BellOff className="h-5 w-5" />
            Notifications Blocked
          </CardTitle>
          <CardDescription>
            Notifications are blocked. Please enable them in your browser settings to receive updates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Enable Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when new news articles are published for your batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleRequestPermission}
          disabled={isInitializing}
          className="w-full"
        >
          {isInitializing ? "Enabling..." : "Enable Notifications"}
        </Button>
      </CardContent>
    </Card>
  );
}
