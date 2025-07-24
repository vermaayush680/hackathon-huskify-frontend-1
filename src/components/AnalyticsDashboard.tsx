
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

export const AnalyticsDashboard = () => {
  const { stats, requestsByDepartment, requestsByStatus, isLoading } = useDashboard();

  // Mock data for charts that don't have API endpoints yet
  const requestsByMonth = [
    { month: 'Jan', requests: 15 },
    { month: 'Feb', requests: 22 },
    { month: 'Mar', requests: 28 },
    { month: 'Apr', requests: 35 },
    { month: 'May', requests: 42 },
    { month: 'Jun', requests: 38 }
  ];

  const averageApprovalTime = [
    { week: 'Week 1', days: 5.2 },
    { week: 'Week 2', days: 4.8 },
    { week: 'Week 3', days: 6.1 },
    { week: 'Week 4', days: 4.5 }
  ];

  const getIconColor = (icon: any) => {
    switch (icon) {
      case CheckCircle:
        return "text-green-600";
      case XCircle:
        return "text-red-600";
      case Clock:
        return "text-orange-600";
      default:
        return "text-blue-600";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">{stat.title}</CardTitle>
              <stat.icon className={`h-6 w-6 ${getIconColor(stat.icon)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-base text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Requests by Department</CardTitle>
            <CardDescription>Distribution of demand requests across different job families</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={requestsByDepartment}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {requestsByDepartment.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {requestsByDepartment.length === 0 && (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>Current status of all requests in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={requestsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            {requestsByStatus.length === 0 && (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
