import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Users,
  FolderOpen,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Library, label: "Books", href: "/admin/books" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: FolderOpen, label: "Categories", href: "/admin/categories" },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold">KitabGhar</span>
          <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/admin" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`link-admin-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-4 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Home className="h-4 w-4" />
              Back to Site
            </Button>
          </Link>
          
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-sm">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive"
            onClick={logout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
