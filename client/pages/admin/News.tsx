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
import { NewsForm } from "@/components/admin/NewsForm";
import { useNews } from "@/hooks/useNews";
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
} from "lucide-react";

export default function News() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [displayLanguage, setDisplayLanguage] = useState<"en" | "ar">("en");

  const { news, loading, error, createNews, updateNews, deleteNews } =
    useNews();

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
          {filteredNews.map((newsItem) => {
            const title = typeof newsItem.title === "string"
              ? newsItem.title
              : newsItem.title[displayLanguage] || newsItem.title.en;
            const content = typeof newsItem.content === "string"
              ? newsItem.content
              : newsItem.content[displayLanguage] || newsItem.content.en;
            const tags = typeof newsItem.tags === "object" && !Array.isArray(newsItem.tags)
              ? newsItem.tags[displayLanguage] || newsItem.tags.en
              : newsItem.tags || [];

            return (
              <Card key={newsItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4" dir={displayLanguage === "ar" ? "rtl" : "ltr"}>
                    {newsItem.imageUrl && (
                      <img
                        src={newsItem.imageUrl}
                        alt={title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold line-clamp-1">
                              {title}
                            </h3>
                            {newsItem.isPinned && (
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
                              {newsItem.authorName}
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
                        </div>
                        <div className={`flex items-center gap-2 ${displayLanguage === "ar" ? "mr-4" : "ml-4"}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(newsItem)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(newsItem.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
    </div>
  );
}
