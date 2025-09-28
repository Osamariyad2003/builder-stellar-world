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
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Order #{order.id} • {order.userName}
                    <div className="text-xs text-muted-foreground">{order.createdAt?.toLocaleString()}</div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === 'completed' || (order as any).iscompleted ? 'default' : 'secondary'}>
                      {order.status}{(order as any).iscompleted ? " • completed" : ""}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => changeStatus(order.id, 'completed')}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Complete
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Contact</div>
                    <div className="font-medium">{order.userName}</div>
                    <div className="text-sm">{order.userEmail}</div>
                    {order.userPhone && <div className="text-sm">{order.userPhone}</div>}
                    {order.address && <div className="text-sm">{order.address}</div>}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Items</div>
                    <div className="space-y-2 mt-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="text-sm">{it.name} x{it.quantity}</div>
                            <div className="font-medium">${(it.price * it.quantity).toFixed(2)}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No item details. Products IDs may be attached in the raw order.</div>
                      )}

                      {/* If there is a raw productsIds field, show it too (fallback) */}
                      {(order as any).productsIds && ((order as any).productsIds).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Product IDs: {((order as any).productsIds || []).join(", ")}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="font-medium">Total</div>
                        <div className="font-bold">${(order.total || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={() => changeStatus(order.id, "paid")}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Paid
                  </Button>
                  <Button variant="outline" onClick={() => changeStatus(order.id, "cancelled")}>
                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
