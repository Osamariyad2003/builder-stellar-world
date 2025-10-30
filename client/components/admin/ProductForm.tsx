import React, { useState } from "react";
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
import { ArrowLeft, Save, Package, Plus, X, Image } from "lucide-react";
import { Product } from "@/shared/types";
import {
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
  uploadUrlToServer,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (product: any) => void;
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    images: product?.images || [""],
    categoryId: product?.categoryId || "",
  });

  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        images: formData.images.filter((img) => img.trim() !== ""),
      };

      onSave(productData);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? value : img)),
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {product ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-muted-foreground">
              {product ? "Update product details" : "Create a new product"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Product Information
            </CardTitle>
            <CardDescription>
              Basic information about the product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Medical Textbook"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the product..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category ID (Optional)</Label>
              <Input
                id="categoryId"
                placeholder="e.g., books, equipment"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Add image URLs for the product
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addImageField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.images.map((image, index) => (
              <div
                key={index}
                className={`flex gap-2 items-center ${dragIndex === index ? 'border-2 border-dashed p-2 rounded' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragIndex(index); }}
                onDragEnter={(e) => { e.preventDefault(); setDragIndex(index); }}
                onDragLeave={() => { setDragIndex(null); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragIndex(null);
                  try {
                    const dt = e.dataTransfer;
                    if (!dt) return;
                    if (dt.files && dt.files.length > 0) {
                      const file = dt.files[0];
                      try {
                        let imageUrl: string | null = null;
                        try {
                          imageUrl = await uploadImageToCloudinary(file);
                        } catch (cloudErr: any) {
                          console.warn('Cloudinary upload failed, trying ImageKit fallback', cloudErr?.message || cloudErr);
                          imageUrl = await uploadToImageKitServer(file, file.name);
                        }

                        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                          updateImage(index, imageUrl);
                        } else {
                          alert('Upload failed: unexpected response from upload provider');
                        }
                      } catch (err: any) {
                        console.error('Drop upload error:', err);
                        alert('Upload failed: ' + (err?.message || err));
                      }
                      return;
                    }

                    // Fallback: support dragging an image URL (text/uri-list or text/plain)
                    const text = dt.getData('text/uri-list') || dt.getData('text/plain');
                    if (text && text.startsWith('http')) {
                      const should = window.confirm('Upload the dragged URL to Cloudinary and replace it?\n' + text);
                      if (!should) return;
                      const result = await uploadUrlToServer(text);
                      if (result && typeof result === 'string' && result.startsWith('http')) {
                        updateImage(index, result);
                      } else {
                        alert('Upload failed: unexpected response from server');
                      }
                    }
                  } catch (err: any) {
                    console.error('Drop upload error:', err);
                    alert('Image upload failed: ' + (err?.message || err));
                  }
                }}
              >
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => updateImage(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try {
                      const current = formData.images[index]?.trim();
                      if (current && (current.startsWith("http://") || current.startsWith("https://"))) {
                        // Upload remote URL to server/Cloudinary, fallback to ImageKit
                        try {
                          const should = window.confirm("Upload the current URL to Cloudinary/ImageKit and replace it?\n" + current);
                          if (!should) return;

                          try {
                            const result = await uploadUrlToServer(current);
                            if (result && typeof result === "string" && result.startsWith("http")) {
                              updateImage(index, result);
                              return;
                            }
                          } catch (e) {
                            console.warn("uploadUrlToServer failed, will try ImageKit:", e?.message || e);
                          }

                          // Fallback to ImageKit server upload of remote URL
                          try {
                            const ikResult = await uploadToImageKitServer(current);
                            if (ikResult && typeof ikResult === "string" && ikResult.startsWith("http")) {
                              updateImage(index, ikResult);
                              return;
                            } else {
                              alert("Upload failed: unexpected response from ImageKit");
                            }
                          } catch (ikErr: any) {
                            console.error("ImageKit URL upload error:", ikErr);
                            alert("URL upload failed: " + (ikErr?.message || ikErr));
                          }
                        } catch (e: any) {
                          console.error("URL upload error:", e);
                          alert("URL upload failed: " + (e?.message || e));
                        }
                        return;
                      }

                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        try {
                          let imageUrl: string | null = null;
                          try {
                            imageUrl = await uploadImageToCloudinary(file);
                          } catch (cloudErr: any) {
                            console.warn('Cloudinary upload failed, trying ImageKit fallback', cloudErr?.message || cloudErr);
                            try {
                              imageUrl = await uploadToImageKitServer(file, file.name);
                            } catch (ikErr) {
                              console.error('ImageKit upload failed:', ikErr);
                              throw cloudErr;
                            }
                          }

                          if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
                            alert('Upload failed: unexpected response from upload provider');
                            return;
                          }

                          updateImage(index, imageUrl);
                        } catch (e: any) {
                          const msg = e?.message || String(e);
                          console.error('Upload error:', e);
                          if (
                            msg
                              .toLowerCase()
                              .includes(
                                'cloudinary cloud name is not configured',
                              )
                          ) {
                            const cloud = window.prompt(
                              'Cloudinary cloud name (e.g. dflp2vxn2):',
                            );
                            if (!cloud) {
                              alert('No cloud name provided.');
                              return;
                            }
                            const preset = window.prompt(
                              'Unsigned upload preset (leave empty to use signed server flow):',
                              '',
                            );
                            const apiKeyPrompt = window.prompt(
                              'Public Cloudinary API key (optional, e.g. 686641252611351):',
                              '',
                            );
                            setLocalCloudinaryConfig(cloud, preset || null, apiKeyPrompt || null);
                            try {
                              const imageUrl2 = await uploadImageToCloudinary(file);
                              if (
                                !imageUrl2 ||
                                typeof imageUrl2 !== 'string' ||
                                !imageUrl2.startsWith('http')
                              ) {
                                alert('Upload failed: unexpected response from Cloudinary');
                                return;
                              }
                              updateImage(index, imageUrl2);
                            } catch (e2: any) {
                              console.error('Retry upload error:', e2);
                              alert('Upload failed after configuring Cloudinary: ' + (e2.message || e2));
                            }
                          } else {
                            alert('Image upload failed: ' + (e.message || e));
                          }
                        }
                      };
                      input.click();
                    } catch (e) {
                      console.error(e);
                      alert("Could not open file dialog");
                    }
                  }}
                >
                  <Image className="h-4 w-4" />
                </Button>

                {formData.images.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.name && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How the product will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  {formData.images[0] && formData.images[0].trim() && (
                    <img
                      src={formData.images[0]}
                      alt={formData.name}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{formData.name}</h3>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ${formData.price.toFixed(2)}
                    </p>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {formData.description}
                      </p>
                    )}
                    {formData.categoryId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {formData.categoryId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
