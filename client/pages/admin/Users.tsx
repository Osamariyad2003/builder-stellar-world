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

  const getYearFromId = (id?: string, createdAt?: any) => {
    if (!id) return "-";
    // Look for a 4-digit year in the id (e.g., 2023, 2001)
    const match = id.match(/(19|20)\d{2}/);
    if (match) return match[0];
    // Fallback to createdAt if present
    if (createdAt) {
      try {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) return String(d.getFullYear());
      } catch (e) {
        // ignore
      }
    }
    return "-";
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
            (() => {
              // Group users by yearLabel if present, otherwise 'Unassigned'
              const groups: Record<string, any[]> = {};
              users.forEach((u: any) => {
                const label = u.yearLabel && String(u.yearLabel).trim() !== "" ? String(u.yearLabel) : "Unassigned";
                if (!groups[label]) groups[label] = [];
                groups[label].push(u);
              });

              // Sort keys: Year N ascending, then others, then Unassigned last
              const keys = Object.keys(groups).sort((a, b) => {
                const ma = a.match(/Year\s*(\d+)/i);
                const mb = b.match(/Year\s*(\d+)/i);
                if (ma && mb) return parseInt(ma[1], 10) - parseInt(mb[1], 10);
                if (ma) return -1;
                if (mb) return 1;
                if (a === "Unassigned") return 1;
                if (b === "Unassigned") return -1;
                return a.localeCompare(b);
              });

              return (
                <div className="space-y-6">
                  {keys.map((k) => (
                    <div key={k}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{k} <span className="text-sm text-muted-foreground">({groups[k].length})</span></h3>
                      </div>

                      <div className="space-y-2">
                        {groups[k].map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <Avatar className="h-12 w-12">
                                {u.photoURL ? (
                                  <AvatarImage src={u.photoURL} alt={u.displayName} />
                                ) : (
                                  <AvatarFallback>
                                    {u.displayName?.[0] || "U"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{u.displayName}</div>
                                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                                <div className="text-xs text-muted-foreground mt-1">Created: {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                                  <span className="ml-3">Year: {u.yearLabel || getYearFromId(u.id, u.createdAt)}</span>
                                </div>
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
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
