import React, { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsForm } from "@/components/admin/NewsForm";
import { useNews } from "@/hooks/useNews";
import { useNotifications } from "@/hooks/useNotifications";
import { useUsers } from "@/hooks/useUsers";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Pin,
  Calendar,
  User,
  Tag,
  Loader2,
  Newspaper,
  Bell,
  BellRing,
  Check,
} from "lucide-react";

export default function News() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNewsForNotifications, setSelectedNewsForNotifications] = useState<string | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<"en" | "ar">("en");

  const { news, loading, error, createNews, updateNews, deleteNews } =
    useNews();
  const { notifications } = useNotifications();
  const { users } = useUsers();

  const filteredNews = news.filter((newsItem) => {
    const title = typeof newsItem.title === "string"
      ? newsItem.title
      : newsItem.title[displayLanguage] || newsItem.title.en;
    const tags = typeof newsItem.tags === "object" && !Array.isArray(newsItem.tags)
      ? newsItem.tags[displayLanguage] || newsItem.tags.en
      : newsItem.tags || [];

    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    );
  });

  // Get notifications for a specific news article
  const getNotificationsForNews = (newsId: string | undefined) => {
    if (!newsId) return [];
    return notifications.filter((n) => n.relatedId === newsId);
  };

  // Get notification count for each news article
  const newsWithNotificationCount = useMemo(() => {
    return filteredNews.map((article) => ({
      ...article,
      notificationCount: getNotificationsForNews(article.id).length,
      notifications: getNotificationsForNews(article.id),
    }));
  }, [filteredNews, notifications]);

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.displayName || user?.email || userId;
  };

  const handleViewNotifications = (newsId: string) => {
    setSelectedNewsForNotifications(newsId);
  };

  const handleEdit = (news: any) => {
    setSelectedNews(news);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteNews(id);
      } catch (error) {
        console.error("Error deleting news:", error);
        alert("Failed to delete article. Please try again.");
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedNews(null);
    setIsFormOpen(true);
  };

  if (isFormOpen) {
    return (
      <NewsForm
        news={selectedNews}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedNews(null);
        }}
        onSave={async (newsData) => {
          try {
            if (selectedNews) {
              await updateNews(selectedNews.id, newsData);
            } else {
              await createNews(newsData as any);
            }
            setIsFormOpen(false);
            setSelectedNews(null);
          } catch (error) {
            console.error("Error saving news:", error);
            alert("Failed to save article. Please try again.");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">News Management</h1>
          <p className="text-muted-foreground">
            Create and manage news articles for medical students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 border rounded-lg p-1">
            <Button
              variant={displayLanguage === "en" ? "default" : "ghost"}
              onClick={() => setDisplayLanguage("en")}
              className="h-8 w-16 text-sm"
            >
              English
            </Button>
            <Button
              variant={displayLanguage === "ar" ? "default" : "ghost"}
              onClick={() => setDisplayLanguage("ar")}
              className="h-8 w-16 text-sm"
            >
              العربية
            </Button>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Article
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${displayLanguage === "ar" ? "right-3" : "left-3"}`} />
              <Input
                placeholder={displayLanguage === "en" ? "Search articles by title or tags..." : "البحث في المقالات حسب العنوان أو الكلمات الرئيسية..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={displayLanguage === "ar" ? "pr-10" : "pl-10"}
                dir={displayLanguage === "ar" ? "rtl" : "ltr"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading news articles...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">⚠️ Error loading news</div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* News List */}
      {!loading && !error && (
        <div className="space-y-4">
          {newsWithNotificationCount.map((news) => {
            const title = typeof news.title === "string"
              ? news.title
              : (news.title as any)?.[displayLanguage] || (news.title as any)?.en;
            const content = typeof news.content === "string"
              ? news.content
              : (news.content as any)?.[displayLanguage] || (news.content as any)?.en;
            const tags = typeof news.tags === "object" && news.tags && !Array.isArray(news.tags)
              ? (news.tags as any)?.[displayLanguage] || (news.tags as any)?.en || []
              : (news.tags as string[]) || [];
            return (
              <Card key={news.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4" dir={displayLanguage === "ar" ? "rtl" : "ltr"}>
                    {news.imageUrl && (
                      <img
                        src={news.imageUrl}
                        alt={typeof title === "string" ? title : ""}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold line-clamp-1">
                              {typeof title === "string" ? title : ""}
                            </h3>
                            {news.isPinned && (
                              <Pin className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {content}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {news.authorName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {newsItem.createdAt.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {newsItem.viewsCount} views
                            </div>
                          </div>
                          {news.notificationCount > 0 && (
                            <button
                              onClick={() => handleViewNotifications(news.id!)}
                              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Bell className="h-3 w-3" />
                              {news.notificationCount} notification{news.notificationCount > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${displayLanguage === "ar" ? "mr-4" : "ml-4"}`}>
                        {news.notificationCount > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewNotifications(news.id!)}
                            className="relative"
                            title={`View ${news.notificationCount} notification${news.notificationCount > 1 ? "s" : ""}`}
                          >
                            <BellRing className="h-4 w-4" />
                            <Badge
                              variant="default"
                              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {news.notificationCount}
                            </Badge>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(news)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(news.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      {!loading && !error && filteredNews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {displayLanguage === "en" ? "No articles found" : "لم يتم العثور على مقالات"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? displayLanguage === "en"
                  ? "No articles match your search criteria."
                  : "لا توجد مقالات تطابق معايير البحث الخاصة بك."
                : displayLanguage === "en"
                ? "Start by creating your first news article."
                : "ابدأ بإنشاء مقالتك الإخبارية الأولى."}
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {displayLanguage === "en" ? "Create Article" : "إنشاء مقالة"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notifications Dialog */}
      <Dialog
        open={selectedNewsForNotifications !== null}
        onOpenChange={(open) => !open && setSelectedNewsForNotifications(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications for News Article
            </DialogTitle>
            <DialogDescription>
              {selectedNewsForNotifications &&
                news.find((n) => n.id === selectedNewsForNotifications)?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedNewsForNotifications && (
            <div className="space-y-3 mt-4">
              {getNotificationsForNews(selectedNewsForNotifications).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications found for this article</p>
                </div>
              ) : (
                getNotificationsForNews(selectedNewsForNotifications).map((notification) => (
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
                            <h3 className="font-semibold">{notification.title}</h3>
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
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            Unread
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
