import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Newspaper,
  PlayCircle,
  Users,
  Store,
  Settings,
  FileText,
  HelpCircle,
  BookOpen,
  MapPin,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/admin" },
  { icon: Newspaper, label: "News", path: "/admin/news" },
  { icon: BookOpen, label: "Years", path: "/admin/years" },
  { icon: Users, label: "Professors", path: "/admin/professors" },
  { icon: Store, label: "Store", path: "/admin/store" },
  { icon: BookOpen, label: "Maps", path: "/admin/maps" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-16",
      )}
    >
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  !isOpen && "justify-center",
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>

            {item.children && isOpen && (
              <div className="ml-6 mt-2 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                      )
                    }
                  >
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{child.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
