import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatData {
  title: string;
  value: string;
  description: string;
  icon: any;
}

interface DashboardData {
  stats: StatData[];
  requestsByDepartment: Array<{ name: string; value: number; fill: string }>;
  requestsByStatus: Array<{ status: string; count: number }>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardData | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [stats, setStats] = useState<StatData[]>([]);
  const [requestsByDepartment, setRequestsByDepartment] = useState<Array<{ name: string; value: number; fill: string }>>([]);
  const [requestsByStatus, setRequestsByStatus] = useState<Array<{ status: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Define colors for charts
  const departmentColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching dashboard data...');
      
      const dashboardData = await apiService.getDashboardStats();
      console.log('Dashboard data received:', dashboardData);
      
      // Set the main stats using the same structure as DashboardStats
      const statsData: StatData[] = [
        {
          title: "Total Requests",
          value: dashboardData.totalHusky.toString(),
          description: "All time requests",
          icon: Users
        },
        {
          title: "Pending Approval",
          value: dashboardData.pendingApproval.toString(),
          description: "Awaiting review",
          icon: Clock
        },
        {
          title: "Approved",
          value: dashboardData.approved.toString(),
          description: "Successfully approved",
          icon: CheckCircle
        },
        {
          title: "Rejected",
          value: dashboardData.rejected.toString(),
          description: "Rejected requests",
          icon: XCircle
        }
      ];
      setStats(statsData);

      // Transform requests by department data for pie chart
      const departmentData = Object.entries(dashboardData.requestsByDepartment || {}).map(([name, count], index) => ({
        name,
        value: typeof count === 'number' ? count : 0,
        fill: departmentColors[index % departmentColors.length]
      }));
      setRequestsByDepartment(departmentData);

      // Transform status counts for bar chart
      const statusData = Object.entries(dashboardData.requestStatusCounts || {}).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: typeof count === 'number' ? count : 0
      }));
      setRequestsByStatus(statusData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
      
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Using fallback data.",
        variant: "destructive",
      });
      
      // Fallback to mock data
      setStats([
        {
          title: "Total Requests",
          value: "0",
          description: "All time requests",
          icon: Users
        },
        {
          title: "Pending Approval",
          value: "0",
          description: "Awaiting review",
          icon: Clock
        },
        {
          title: "Approved",
          value: "0",
          description: "Successfully approved",
          icon: CheckCircle
        },
        {
          title: "Rejected",
          value: "0",
          description: "Rejected requests",
          icon: XCircle
        }
      ]);
      setRequestsByDepartment([
        { name: 'Engineering', value: 12, fill: '#3b82f6' },
        { name: 'Sales', value: 8, fill: '#10b981' },
        { name: 'Marketing', value: 6, fill: '#f59e0b' }
      ]);
      setRequestsByStatus([
        { status: 'Pending', count: 18 },
        { status: 'Approved', count: 12 },
        { status: 'Rejected', count: 5 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const contextValue: DashboardData = useMemo(() => ({
    stats,
    requestsByDepartment,
    requestsByStatus,
    isLoading,
    error,
    refreshData: fetchDashboardData
  }), [stats, requestsByDepartment, requestsByStatus, isLoading, error]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};
