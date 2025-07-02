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
} from "lucide-react";

// Mock data - replace with real data from Firestore
const mockNews = [
  {
    id: "1",
    title: "Revolutionary Gene Therapy Shows Promise in Cancer Treatment",
    content:
      "Recent studies demonstrate significant progress in targeted gene therapy...",
    authorName: "Dr. Sarah Johnson",
    authorId: "user1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    tags: ["oncology", "gene-therapy", "research"],
    isPinned: true,
    viewsCount: 1247,
    attachments: [],
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
  },
  {
    id: "2",
    title: "Medical Education Technology Trends for 2024",
    content:
      "Exploring the latest innovations in medical education platforms...",
    authorName: "Prof. Michael Chen",
    authorId: "user2",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
    tags: ["education", "technology", "trends"],
    isPinned: false,
    viewsCount: 892,
    attachments: [],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop",
  },
  {
    id: "3",
    title: "New Guidelines for Emergency Medicine Protocols",
    content:
      "Updated protocols for emergency medical procedures and best practices...",
    authorName: "Dr. Emily Rodriguez",
    authorId: "user3",
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
    tags: ["emergency", "protocols", "guidelines"],
    isPinned: false,
    viewsCount: 654,
    attachments: ["protocol-guide.pdf"],
    imageUrl:
      "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=300&h=200&fit=crop",
  },
];

export default function News() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const filteredNews = mockNews.filter(
    (news) =>
      news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  const handleEdit = (news: any) => {
    setSelectedNews(news);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    // Implement delete functionality
    console.log("Delete news:", id);
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
        onSave={(newsData) => {
          console.log("Save news:", newsData);
          setIsFormOpen(false);
          setSelectedNews(null);
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
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Article
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((news) => (
          <Card key={news.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {news.imageUrl && (
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold line-clamp-1">
                          {news.title}
                        </h3>
                        {news.isPinned && (
                          <Pin className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {news.content}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {news.tags.map((tag) => (
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
                          {news.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {news.viewsCount} views
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "No articles match your search criteria."
                : "Start by creating your first news article."}
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Article
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
