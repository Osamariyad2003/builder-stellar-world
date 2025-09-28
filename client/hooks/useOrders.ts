import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@shared/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("orderDate", "desc"));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        try {
          // fetch products map to resolve productIds to names/prices
          const productsSnap = await getDocs(collection(db, "products"));
          const productsMap: Record<string, any> = {};
          productsSnap.forEach((p) => {
            const pd = p.data();
            productsMap[p.id] = { id: p.id, name: pd.name || pd.title || "", price: pd.price || 0 };
          });

          const data: Order[] = [];
          snap.forEach((d) => {
            const v = d.data() as any;

            // Build items array either from v.items or from legacy v.productsIds
            let items: any[] = [];
            if (v.items && Array.isArray(v.items) && v.items.length > 0) {
              items = v.items;
            } else if (v.productsIds && Array.isArray(v.productsIds)) {
              items = v.productsIds.map((pid: string) => ({
                productId: pid,
                name: productsMap[pid]?.name || pid,
                quantity: 1,
                price: productsMap[pid]?.price || 0,
              }));
            }

            // Determine total from various possible fields
            const total = v.total || v.totalAmount || v.totalPrice || 0;

            // Address/phone fields may use different names
            const address = v.address || v.shippingaddress || v.shippingAddress || "";
            const userPhone = v.userPhone || v.user_phone || v.phone || "";

            // Robust createdAt parsing
            let createdAt = new Date();
            if (v.createdAt && typeof v.createdAt.toDate === "function") {
              createdAt = v.createdAt.toDate();
            } else if (v.orderDate && typeof v.orderDate.toDate === "function") {
              createdAt = v.orderDate.toDate();
            } else if (v.orderDate) {
              createdAt = new Date(v.orderDate);
            }

            data.push({
              id: d.id,
              userId: v.userId || v.user_id || "",
              userName: v.userName || v.user_name || v.customerName || "",
              userEmail: v.userEmail || v.email || "",
              userPhone: userPhone,
              address: address,
              items: items,
              total: total,
              // Prefer reading the lowercase `iscompleted` flag as source of truth
              iscompleted: v.iscompleted === true || v.isCompleted === true || false,
              status: v.status || (v.iscompleted === true ? "completed" : "pending"),
              createdAt: createdAt,
              updatedAt: v.updatedAt?.toDate?.(),
            });
          });

          setOrders(data);
          setLoading(false);
        } catch (e) {
          console.error("Error processing orders:", e);
          setError("Failed to load orders");
          setLoading(false);
        }
      },
      (e) => {
        console.error("Failed to load orders:", e);
        setError("Failed to load orders");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const createOrder = async (order: Omit<Order, "id">) => {
    try {
      await addDoc(collection(db, "orders"), { ...order, createdAt: new Date() });
    } catch (e) {
      console.error("Error creating order:", e);
    }
  };

  const updateOrder = async (id: string, patch: Partial<Order>) => {
    try {
      const updatePayload: any = { ...patch, updatedAt: new Date() };
      if (patch.status === "completed" || (patch as any).isCompleted) {
        updatePayload.isCompleted = true;
        updatePayload.iscompleted = true; // backward compatibility with existing field name
        updatePayload.completedAt = new Date();
        updatePayload.status = "completed";
      }
      await updateDoc(doc(db, "orders", id), updatePayload);
    } catch (e) {
      console.error("Error updating order:", e);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (e) {
      console.error("Error deleting order:", e);
    }
  };

  return { orders, loading, error, createOrder, updateOrder, deleteOrder };
}
