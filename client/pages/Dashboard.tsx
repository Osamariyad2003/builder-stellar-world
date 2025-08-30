import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  PlayCircle,
  Users,
  Store,
  TrendingUp,
  DollarSign,
  BookOpen,
} from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { useProducts } from "@/hooks/useProducts";
import { useProfessors } from "@/hooks/useProfessors";
import { useYears } from "@/hooks/useYears";

const recentActivity = [
  {
    id: 1,
    type: "news",
    title: "New cardiology study published",
    time: "2 hours ago",
    author: "Dr. Smith",
  },
  {
    id: 2,
    type: "video",
    title: "Anatomy lecture uploaded",
    time: "4 hours ago",
    author: "Prof. Johnson",
  },
  {
    id: 3,
    type: "quiz",
    title: "Pharmacology quiz created",
    time: "6 hours ago",
    author: "Dr. Brown",
  },
  {
    id: 4,
    type: "product",
    title: "New stethoscope added to store",
    time: "1 day ago",
    author: "Admin",
  },
];

export default function Dashboard() {
  const { news, loading: newsLoading } = useNews();
  const { products, loading: productsLoading } = useProducts();
  const { professors, loading: professorsLoading } = useProfessors();
  const { years, loading: yearsLoading } = useYears();

  const totalNews = news.length;
  const totalProfessors = professors.length;
  const storeRevenue = products.reduce((s, p)=> s + (p.price || 0), 0);
  const totalVideos = years.reduce((acc, y)=> acc + y.subjects.reduce((sa,s)=> sa + s.lectures.reduce((la,l)=> la + (l.videos?.length||0),0),0), 0);

  const stats = [
    { title: "Total News Articles", value: newsLoading ? "..." : String(totalNews), change: "+12%", icon: Newspaper, color: "text-blue-600" },
    { title: "Video Resources", value: yearsLoading ? "..." : String(totalVideos), change: "+5%", icon: PlayCircle, color: "text-green-600" },
    { title: "Active Professors", value: professorsLoading ? "..." : String(totalProfessors), change: "+2%", icon: Users, color: "text-purple-600" },
    { title: "Store Revenue", value: productsLoading ? "..." : `$${storeRevenue.toLocaleString()}`, change: "+18%", icon: DollarSign, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the MedJust Admin Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs">
                <Badge variant="secondary" className="text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </Badge>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{activity.author}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors text-left">
                <Newspaper className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Create News Article</p>
                  <p className="text-xs text-muted-foreground">
                    Publish new content
                  </p>
                </div>
              </button>
              <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors text-left">
                <PlayCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Upload Video</p>
                  <p className="text-xs text-muted-foreground">
                    Add learning resource
                  </p>
                </div>
              </button>
              <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors text-left">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Add Professor</p>
                  <p className="text-xs text-muted-foreground">
                    Register new faculty
                  </p>
                </div>
              </button>
              <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors text-left">
                <Store className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">Add Product</p>
                  <p className="text-xs text-muted-foreground">
                    Expand store catalog
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
