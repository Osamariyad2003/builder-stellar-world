import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
  Upload,
} from "lucide-react";
import { useBooks, BookData } from "@/hooks/useBooks";
import {
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";

export default function Books() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    isbn: "",
    publishedDate: "",
    publisher: "",
    category: "",
    imageUrl: "",
    pdfUrl: "",
  });

  const {
    books,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
    clearCache,
    createBook,
    updateBook,
    deleteBook,
  } = useBooks();

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      description: "",
      isbn: "",
      publishedDate: "",
      publisher: "",
      category: "",
      imageUrl: "",
      pdfUrl: "",
    });
  };

  const handleAddBook = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      alert("Please fill in title and author");
      return;
    }

    try {
      await createBook({
        title: formData.title.trim(),
        author: formData.author.trim(),
        description: formData.description.trim(),
        isbn: formData.isbn.trim(),
        publishedDate: formData.publishedDate,
        publisher: formData.publisher.trim(),
        category: formData.category.trim(),
        imageUrl: formData.imageUrl,
        pdfUrl: formData.pdfUrl,
      });

      resetForm();
      setIsAddDialogOpen(false);
      alert("Book added successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to add book");
    }
  };

  const handleEditBook = async () => {
    if (!editingBook?.id) return;

    if (!formData.title.trim() || !formData.author.trim()) {
      alert("Please fill in title and author");
      return;
    }

    try {
      await updateBook(editingBook.id, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        description: formData.description.trim(),
        isbn: formData.isbn.trim(),
        publishedDate: formData.publishedDate,
        publisher: formData.publisher.trim(),
        category: formData.category.trim(),
        imageUrl: formData.imageUrl,
        pdfUrl: formData.pdfUrl,
      });

      resetForm();
      setEditingBook(null);
      setIsEditDialogOpen(false);
      alert("Book updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update book");
    }
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`Delete book "${bookTitle}"? This cannot be undone.`))
      return;

    try {
      await deleteBook(bookId);
      alert("Book deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete book");
    }
  };

  const openEditDialog = (book: BookData) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || "",
      isbn: book.isbn || "",
      publishedDate: book.publishedDate || "",
      publisher: book.publisher || "",
      category: book.category || "",
      imageUrl: book.imageUrl || "",
      pdfUrl: book.pdfUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImageUrl: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let imageUrl: string | null = null;
      try {
        imageUrl = await uploadImageToCloudinary(file);
      } catch (cloudErr: any) {
        console.warn(
          "Cloudinary upload failed, trying ImageKit",
          cloudErr?.message || cloudErr,
        );
        imageUrl = await uploadToImageKitServer(file, file.name);
      }

      if (!imageUrl) {
        alert("Upload failed");
        return;
      }

      setImageUrl(imageUrl);
      alert("Image uploaded successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    }
  };

  const sampleBooks = [
    {
      title: "Human Anatomy and Physiology",
      author: "Elaine N. Marieb",
      description: "A comprehensive guide to human anatomy and physiological systems with detailed illustrations and clinical correlations.",
      isbn: "978-0134580999",
      publishedDate: "2019-01-15",
      publisher: "Pearson",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0134580990.01.L.jpg",
      pdfUrl: "https://example.com/anatomy.pdf",
    },
    {
      title: "Pharmacology: From Principles to Practice",
      author: "Harold Kalant",
      description: "Essential pharmacology textbook covering drug mechanisms, interactions, and clinical applications.",
      isbn: "978-0702031519",
      publishedDate: "2018-06-20",
      publisher: "Elsevier",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/070203151X.01.L.jpg",
      pdfUrl: "https://example.com/pharmacology.pdf",
    },
    {
      title: "Pathology: The Big Picture",
      author: "Jonathan S. Schneider",
      description: "A concise overview of pathological processes, disease mechanisms, and clinical manifestations.",
      isbn: "978-0071798310",
      publishedDate: "2017-03-10",
      publisher: "McGraw-Hill",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0071798315.01.L.jpg",
      pdfUrl: "https://example.com/pathology.pdf",
    },
    {
      title: "Clinical Biochemistry",
      author: "Peter Baynes",
      description: "Biochemical principles and their clinical applications in diagnosis and treatment.",
      isbn: "978-0323529570",
      publishedDate: "2019-08-14",
      publisher: "Elsevier",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0323529577.01.L.jpg",
      pdfUrl: "https://example.com/biochemistry.pdf",
    },
    {
      title: "Internal Medicine Essentials",
      author: "Lawrence M. Tierney Jr.",
      description: "Core concepts and practical approaches to common internal medicine conditions.",
      isbn: "978-0071839600",
      publishedDate: "2016-09-22",
      publisher: "McGraw-Hill",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0071839607.01.L.jpg",
      pdfUrl: "https://example.com/internal_medicine.pdf",
    },
    {
      title: "Surgery: Basic Science and Clinical Evidence",
      author: "Jorge I. New",
      description: "Fundamental surgical principles, evidence-based practices, and clinical decision-making.",
      isbn: "978-0393712605",
      publishedDate: "2020-01-16",
      publisher: "W.W. Norton",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0393712605.01.L.jpg",
      pdfUrl: "https://example.com/surgery.pdf",
    },
    {
      title: "Pediatrics: A Comprehensive Guide",
      author: "Karen J. Marcdante",
      description: "Complete pediatric reference covering development, diseases, and management of children's health.",
      isbn: "978-0323567558",
      publishedDate: "2019-07-11",
      publisher: "Elsevier",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0323567556.01.L.jpg",
      pdfUrl: "https://example.com/pediatrics.pdf",
    },
    {
      title: "Obstetrics and Gynecology",
      author: "Beckmann Charles R.",
      description: "Comprehensive obstetric and gynecological care principles and clinical management.",
      isbn: "978-0323479929",
      publishedDate: "2018-04-20",
      publisher: "Elsevier",
      category: "Medical",
      imageUrl: "https://images-na.ssl-images-amazon.com/images/P/0323479928.01.L.jpg",
      pdfUrl: "https://example.com/obstetrics.pdf",
    },
  ];

  const handleSeedData = async () => {
    if (!confirm("This will add 8 sample books to your collection. Continue?"))
      return;

    let successCount = 0;
    let failureCount = 0;

    for (const book of sampleBooks) {
      try {
        await createBook(book);
        successCount++;
      } catch (err) {
        console.error("Failed to add book:", book.title, err);
        failureCount++;
      }
    }

    alert(`Sample data added! Success: ${successCount}, Failed: ${failureCount}`);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (book.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) || false),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Books Management</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Manage your book collection</p>
            {connectionStatus === "offline" && (
              <span className="flex items-center gap-1 text-orange-600 font-medium text-sm">
                <div className="h-2 w-2 bg-orange-600 rounded-full" />
                Offline Mode
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearCache();
              alert("Cache cleared. Data will be refreshed from server.");
            }}
            title="Clear cached data and fetch fresh from server"
          >
            🔄 Refresh Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedData}
            title="Add sample books to test the collection"
          >
            📚 Add Sample Data
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogDescription>
                  Fill in the book details below
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Book title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Author *
                  </label>
                  <Input
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Description
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    ISBN
                  </label>
                  <Input
                    value={formData.isbn}
                    onChange={(e) =>
                      setFormData({ ...formData, isbn: e.target.value })
                    }
                    placeholder="ISBN"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Published Date
                  </label>
                  <Input
                    type="date"
                    value={formData.publishedDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publishedDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Publisher
                  </label>
                  <Input
                    value={formData.publisher}
                    onChange={(e) =>
                      setFormData({ ...formData, publisher: e.target.value })
                    }
                    placeholder="Publisher"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Category
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Medical, Science, Fiction"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Book Cover Image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      placeholder="Image URL or click upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = async () => {
                          await handleImageUpload(
                            {
                              target: { files: input.files },
                            } as any,
                            (url) =>
                              setFormData({ ...formData, imageUrl: url }),
                          );
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    PDF URL
                  </label>
                  <Input
                    value={formData.pdfUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, pdfUrl: e.target.value })
                    }
                    placeholder="Link to PDF file"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button onClick={handleAddBook}>Add Book</Button>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading books...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">⚠️ Error loading books</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={retryConnection} variant="outline">
                Retry Connection
              </Button>
              <Button
                onClick={() => window.location.replace(window.location.href)}
                variant="ghost"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, category, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {filteredBooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {books.length === 0 ? "No books found" : "No books match your search"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {books.length === 0
                    ? "Start by adding your first book to the collection."
                    : "Try adjusting your search terms."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex gap-3">
                      {book.imageUrl ? (
                        <img
                          src={book.imageUrl}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-md flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-24 rounded-md flex-shrink-0 bg-muted flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm line-clamp-2 mb-1">
                          {book.title}
                        </CardTitle>
                        <CardDescription className="text-xs mb-2">
                          by {book.author}
                        </CardDescription>
                        {book.category && (
                          <Badge variant="secondary" className="text-xs">
                            {book.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pb-3">
                    <div className="space-y-2 text-sm">
                      {book.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {book.description}
                        </p>
                      )}
                      {book.isbn && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">ISBN:</span> {book.isbn}
                        </div>
                      )}
                      {book.publisher && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Publisher:</span>{" "}
                          {book.publisher}
                        </div>
                      )}
                      {book.publishedDate && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Published:</span>{" "}
                          {new Date(book.publishedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <div className="flex gap-2 p-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(book)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() =>
                        handleDeleteBook(book.id || "", book.title)
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Update the book details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Book title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Author *</label>
              <Input
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                placeholder="Author name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">ISBN</label>
              <Input
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
                placeholder="ISBN"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Published Date
              </label>
              <Input
                type="date"
                value={formData.publishedDate}
                onChange={(e) =>
                  setFormData({ ...formData, publishedDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Publisher
              </label>
              <Input
                value={formData.publisher}
                onChange={(e) =>
                  setFormData({ ...formData, publisher: e.target.value })
                }
                placeholder="Publisher"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Category
              </label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g., Medical, Science, Fiction"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Book Cover Image URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="Image URL or click upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async () => {
                      await handleImageUpload(
                        {
                          target: { files: input.files },
                        } as any,
                        (url) =>
                          setFormData({ ...formData, imageUrl: url }),
                      );
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">PDF URL</label>
              <Input
                value={formData.pdfUrl}
                onChange={(e) =>
                  setFormData({ ...formData, pdfUrl: e.target.value })
                }
                placeholder="Link to PDF file"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={handleEditBook}>Update Book</Button>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
