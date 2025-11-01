import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/useUsers";
import { Trash2, UserPlus } from "lucide-react";

export default function Users() {
  const { users, loading, error, updateUser, deleteUser } = useUsers();

  const toggleAdmin = async (u: any) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    await updateUser(u.id, { role: newRole });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-muted-foreground">No users found.</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="h-12 w-12">
                      {u.photoURL ? (
                        <AvatarImage src={u.photoURL} alt={u.displayName} />
                      ) : (
                        <AvatarFallback>{u.displayName?.[0] || "U"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">Created: {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge>{u.role || "user"}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleAdmin(u)}>
                      {u.role === "admin" ? "Demote" : "Make Admin"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteUser(u.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
