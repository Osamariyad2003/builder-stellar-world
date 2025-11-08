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
import { ProductForm } from "@/components/admin/ProductForm";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import {
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";
import {
  Store as StoreIcon,
  Plus,
  Tag,
  Search,
  Edit2,
  Trash2,
  Package,
  DollarSign,
  Image,
  Loader2,
} from "lucide-react";

export default function Store() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const {
    products,
    loading,
    error,
    isOfflineMode,
    createProduct,
    updateProduct,
    deleteProduct,
    retryConnection,
  } = useProducts();

  const { createOrder } = useOrders();

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string,
  ) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      await deleteProduct(productId);
    }
  };

  if (isProductFormOpen) {
    return (
      <ProductForm
        product={selectedProduct}
        onClose={() => {
          setIsProductFormOpen(false);
          setSelectedProduct(null);
        }}
        onSave={async (productData) => {
          try {
            if (selectedProduct) {
              await updateProduct(selectedProduct.id, productData);
            } else {
              await createProduct(productData);
            }
            setIsProductFormOpen(false);
            setSelectedProduct(null);
          } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product. Please try again.");
          }
        }}
      />
    );
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Manage store products and categories
            </p>
            {isOfflineMode && (
              <span className="flex items-center gap-1 text-orange-600 font-medium text-sm">
                <div className="h-2 w-2 bg-orange-600 rounded-full" />
                Offline Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">
              ⚠️ Error loading products
            </div>
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
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Price
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {products.length > 0
                    ? (
                        products.reduce((sum, p) => {
                          const displayPrice = (p.types && p.types.length>0) ? p.types[0].price : p.price || 0;
                          return sum + displayPrice;
                        }, 0) / products.length
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    new Set(
                      products
                        .map((p) => p.categoryId)
                        .filter((c) => c && c.trim()),
                    ).size
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4" />
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                Categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {filteredProducts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? "No products found" : "No products yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Add your first product to get started"}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleAddProduct}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Product
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling!.style.display =
                                "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            display:
                              product.images && product.images[0]
                                ? "none"
                                : "flex",
                          }}
                        >
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-1">
                            {product.name}
                          </CardTitle>
                          <div className="mt-2">
                            {(product.types && product.types.length>0) ? (
                              <div className="flex gap-2 flex-wrap">
                                {product.types.map((t:any, i:number)=>(
                                  <Badge key={i} variant="secondary" className="flex items-center gap-2">
                                    <span className="font-medium">{t.name}</span>
                                    <span className="text-sm text-muted-foreground">${t.price.toFixed(2)}</span>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xl font-bold">${(product.price||0).toFixed(2)}</div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>

                            {/* Change Image button - behaves like Years change image */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                try {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = "image/*";
                                  input.onchange = async () => {
                                    const file = input.files?.[0];
                                    if (!file) return;
                                    try {
                                      let imageUrl: string | null = null;
                                      try {
                                        imageUrl =
                                          await uploadImageToCloudinary(file);
                                      } catch (cloudErr: any) {
                                        console.warn(
                                          "Cloudinary upload failed, trying ImageKit fallback",
                                          cloudErr?.message || cloudErr,
                                        );
                                        try {
                                          imageUrl =
                                            await uploadToImageKitServer(
                                              file,
                                              file.name,
                                            );
                                        } catch (ikErr: any) {
                                          console.error(
                                            "ImageKit upload failed:",
                                            ikErr,
                                          );
                                          throw cloudErr;
                                        }
                                      }

                                      if (
                                        !imageUrl ||
                                        typeof imageUrl !== "string" ||
                                        !imageUrl.startsWith("http")
                                      ) {
                                        console.error(
                                          "Invalid upload response:",
                                          imageUrl,
                                        );
                                        alert(
                                          "Image upload failed: unexpected response from upload provider",
                                        );
                                        return;
                                      }

                                      await updateProduct(product.id!, {
                                        images: [imageUrl],
                                      });
                                    } catch (e: any) {
                                      console.error(e);
                                      const msg = e?.message || String(e);
                                      const lower = (msg || "").toLowerCase();
                                      if (
                                        lower.includes(
                                          "cloudinary cloud name is not configured",
                                        )
                                      ) {
                                        const cloud = window.prompt(
                                          "Cloudinary cloud name (e.g. dflp2vxn2):",
                                        );
                                        if (!cloud) {
                                          alert(
                                            "No cloud name provided. Upload cancelled.",
                                          );
                                          return;
                                        }
                                        const preset = window.prompt(
                                          "Unsigned upload preset (leave empty to use signed server flow):",
                                          "",
                                        );
                                        const apiKeyPrompt = window.prompt(
                                          "Public Cloudinary API key (optional, e.g. 686641252611351):",
                                          "",
                                        );
                                        try {
                                          setLocalCloudinaryConfig(
                                            cloud,
                                            preset || null,
                                            apiKeyPrompt || null,
                                          );
                                          const imageUrl2 =
                                            await uploadImageToCloudinary(file);
                                          console.log(
                                            "Cloudinary upload result after config:",
                                            imageUrl2,
                                          );
                                          if (
                                            !imageUrl2 ||
                                            typeof imageUrl2 !== "string" ||
                                            !imageUrl2.startsWith("http")
                                          ) {
                                            alert(
                                              "Image upload failed: unexpected response from Cloudinary",
                                            );
                                            return;
                                          }
                                          await updateProduct(product.id!, {
                                            images: [imageUrl2],
                                          });
                                        } catch (e2: any) {
                                          console.error(e2);
                                          alert(
                                            "Image upload failed after configuring Cloudinary: " +
                                              (e2.message || e2),
                                          );
                                        }
                                        return;
                                      } else if (
                                        lower.includes(
                                          "cloudinary signing did not return an api key",
                                        ) ||
                                        lower.includes(
                                          "missing required parameter - api_key",
                                        ) ||
                                        lower.includes(
                                          "missing required parameter 'api_key'",
                                        )
                                      ) {
                                        const apiKey = window.prompt(
                                          "Public Cloudinary API key (e.g. 686641252611351):",
                                          "",
                                        );
                                        if (apiKey && apiKey.trim()) {
                                          try {
                                            setLocalCloudinaryConfig(
                                              null,
                                              null,
                                              apiKey.trim(),
                                            );
                                            const imageUrl2 =
                                              await uploadImageToCloudinary(
                                                file,
                                              );
                                            if (
                                              !imageUrl2 ||
                                              typeof imageUrl2 !== "string" ||
                                              !imageUrl2.startsWith("http")
                                            ) {
                                              alert(
                                                "Image upload failed: unexpected response from Cloudinary",
                                              );
                                              return;
                                            }
                                            await updateProduct(product.id!, {
                                              images: [imageUrl2],
                                            });
                                            return;
                                          } catch (e2: any) {
                                            console.error(e2);
                                            alert(
                                              "Image upload failed after setting API key: " +
                                                (e2.message || e2),
                                            );
                                            return;
                                          }
                                        }
                                      }

                                      alert(
                                        "Image upload failed: " +
                                          (e.message || e),
                                      );
                                    }
                                  };
                                  input.click();
                                } catch (e) {
                                  console.error(e);
                                  alert("Could not open file dialog");
                                }
                              }}
                              className="h-8 w-8"
                            >
                              <Image className="h-3 w-3" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteProduct(product.id!, product.name)
                              }
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const name = window.prompt("Your full name:");
                                  if (!name) return;
                                  const email = window.prompt("Your email:");
                                  if (!email) return;
                                  const qtyStr =
                                    window.prompt("Quantity:", "1") || "1";
                                  const qty = parseInt(qtyStr) || 1;
                                  const phone =
                                    window.prompt("Phone (optional):", "") ||
                                    "";
                                  const address =
                                    window.prompt("Address (optional):", "") ||
                                    "";

                                  await createOrder({
                                    username: name,
                                    userName: name,
                                    userEmail: email,
                                    userPhone: phone,
                                    address,
                                    items: [
                                      {
                                        productId: product.id!,
                                        name: product.name,
                                        quantity: qty,
                                        price: product.price,
                                      },
                                    ],
                                    total: product.price * qty,
                                    status: "pending",
                                    createdAt: new Date(),
                                  });

                                  alert("Order placed successfully");
                                } catch (e) {
                                  console.error(e);
                                  alert("Failed to place order");
                                }
                              }}
                            >
                              Buy
                            </Button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          ${product.price.toFixed(2)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{product.createdAt.toLocaleDateString()}</span>
                          {product.categoryId && (
                            <Badge variant="secondary" className="text-xs">
                              {product.categoryId}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Categories</h2>
                <Button disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
              <Card>
                <CardContent className="text-center py-12">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Category Management
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Category management will be implemented in the future.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For now, you can specify category IDs when creating
                    products.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
