import React from "react";
import { useOrders } from "@/hooks/useOrders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import OrderCard from "@/components/admin/OrderCard";

export default function Orders() {
  const { orders, loading, error, updateOrder, deleteOrder } = useOrders();

  const changeStatus = async (id: string | undefined, status: any) => {
    if (!id) return;
    await updateOrder(id, { status });
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">View and manage store orders</p>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-destructive">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onChangeStatus={changeStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
