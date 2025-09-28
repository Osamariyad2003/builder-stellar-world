import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle, XCircle } from "lucide-react";

interface OrderCardProps {
  order: any;
  onChangeStatus: (id: string | undefined, status: string) => Promise<void> | void;
  onDelete: (id: string | undefined) => Promise<void> | void;
}

export default function OrderCard({ order, onChangeStatus, onDelete }: OrderCardProps) {
  return (
    <Card key={order.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Order for {order.username || order.userName}
            <div className="text-xs text-muted-foreground">{order.createdAt?.toLocaleString?.()}</div>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge variant={order.status === "completed" || (order as any).iscompleted ? "default" : "secondary"}>
              {order.status}
              {(order as any).iscompleted ? " • completed" : ""}
            </Badge>

            <Button variant="ghost" size="sm" onClick={() => onChangeStatus(order.id, "completed")}>
              <CheckCircle className="h-4 w-4 mr-1" /> Complete
            </Button>

            <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)} className="text-destructive">
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
                order.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="text-sm">{it.name} x{it.quantity}</div>
                    <div className="font-medium">${(it.price * it.quantity).toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No item details. Products IDs may be attached in the raw order.</div>
              )}

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
          <Button onClick={() => onChangeStatus(order.id, "paid")}>
            <CheckCircle className="h-4 w-4 mr-2" /> Mark Paid
          </Button>
          <Button variant="outline" onClick={() => onChangeStatus(order.id, "cancelled")}>
            <XCircle className="h-4 w-4 mr-2" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
