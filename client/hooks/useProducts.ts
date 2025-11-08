import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/shared/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Mock data for offline mode
  const mockProducts: Product[] = [
    {
      id: "product1",
      productId: "product1",
      name: "Medical Textbook",
      description: "Comprehensive medical textbook for students",
      price: 89.99,
      images: ["https://example.com/book1.jpg"],
      categoryId: "books",
      createdAt: new Date(),
    },
    {
      id: "product2",
      productId: "product2",
      name: "Stethoscope",
      description: "Professional grade stethoscope",
      price: 120.0,
      images: ["https://example.com/stethoscope.jpg"],
      categoryId: "equipment",
      createdAt: new Date(),
    },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      // Quick timeout to activate offline mode if Firebase is slow
      const quickTimeout = setTimeout(() => {
        if (loading && !isOfflineMode) {
          console.log(
            "🔄 Firebase taking too long - switching to offline mode",
          );
          setIsOfflineMode(true);
          setLoading(false);
          setError("Working in offline mode - Firebase unavailable");
          setProducts(mockProducts);
        }
      }, 3000);

      try {
        console.log("🔄 Fetching products from Firebase...");
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = [];

        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            productId: data.productId || doc.id,
            name: data.name || "",
            description: data.description || "",
            price: data.price || 0,
            types: data.types || (data.price ? [{ name: 'Default', price: data.price }] : []),
            images: data.images || [],
            categoryId: data.categoryId || "",
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        clearTimeout(quickTimeout);
        setProducts(
          productsData.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          ),
        );
        setLoading(false);
        setError(null);
        console.log("✅ Products loaded successfully:", productsData.length);
      } catch (error: any) {
        clearTimeout(quickTimeout);

        // Handle Firebase offline errors gracefully
        if (error.isFirebaseOfflineError) {
          // Expected offline error - handle silently
          console.log("🔄 Firebase offline mode detected - using mock data");
        } else {
          console.error(
            "Firebase error - switching to offline mode:",
            error.message,
          );
        }

        setIsOfflineMode(true);
        setLoading(false);
        setError("Working in offline mode - Firebase unavailable");
        setProducts(mockProducts);
      }
    };

    fetchProducts();
  }, []);

  const createProduct = async (
    productData: Omit<Product, "id" | "productId" | "createdAt">,
  ) => {
    if (isOfflineMode) {
      const newProduct: Product = {
        id: `product_${Date.now()}`,
        productId: `product_${Date.now()}`,
        ...productData,
        createdAt: new Date(),
      };

      setProducts((prev) => [newProduct, ...prev]);
      console.log("✅ Added product to offline mode:", newProduct.name);
      return;
    }

    try {
      const newProduct = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images,
        categoryId: productData.categoryId || "",
        createdAt: new Date(),
        productId: "", // Will be updated with document ID
      };

      console.log("📝 Creating new product:", newProduct);

      // Create new document in products collection
      const docRef = await addDoc(collection(db, "products"), newProduct);

      // Update the document to include its own ID as productId
      await updateDoc(docRef, {
        productId: docRef.id,
      });

      console.log("✅ Created product with ID:", docRef.id);

      // Refresh data — use replace to force full navigation avoiding HMR race
      window.location.replace(window.location.href);
    } catch (error) {
      console.error("Error creating product:", error);
      // Fall back to offline mode
      setIsOfflineMode(true);
      await createProduct(productData);
    }
  };

  const updateProduct = async (
    productId: string,
    productData: Partial<Product>,
  ) => {
    if (isOfflineMode) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, ...productData } : product,
        ),
      );
      console.log("✅ Updated product in offline mode");
      return;
    }

    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, productData);
      console.log("✅ Updated product in Firebase:", productId);

      // Refresh data — use replace to force full navigation avoiding HMR race
      window.location.replace(window.location.href);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (isOfflineMode) {
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      console.log("✅ Deleted product from offline mode");
      return;
    }

    try {
      await deleteDoc(doc(db, "products", productId));
      console.log("✅ Deleted product from Firebase:", productId);

      // Refresh data — use replace to force full navigation avoiding HMR race
      window.location.replace(window.location.href);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const retryConnection = () => {
    console.log("🔄 Retrying Firebase connection...");
    setLoading(true);
    setError(null);
    setIsOfflineMode(false);
    // Force full navigation to reload app state without invoking HMR socket logic
    window.location.replace(window.location.href);
  };

  return {
    products,
    loading,
    error,
    isOfflineMode,
    createProduct,
    updateProduct,
    deleteProduct,
    retryConnection,
  };
}
