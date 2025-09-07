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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@shared/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: Order[] = [];
        snap.forEach((d) => {
          const v = d.data() as any;
          data.push({
            id: d.id,
            userId: v.userId || "",
            userName: v.userName || "",
            userEmail: v.userEmail || "",
            userPhone: v.userPhone || "",
            address: v.address || "",
            items: v.items || [],
            total: v.total || 0,
            status: v.status || "pending",
            createdAt: v.createdAt?.toDate?.() || new Date(),
            updatedAt: v.updatedAt?.toDate?.(),
          });
        });
        setOrders(data);
        setLoading(false);
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
      await updateDoc(doc(db, "orders", id), { ...patch, updatedAt: new Date() });
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
