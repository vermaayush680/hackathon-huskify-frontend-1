import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Plus, LogOut, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardStats } from "@/components/DashboardStats";
import { RequestCard } from "@/components/RequestCard";
import { UserRequestCard } from "@/components/UserRequestCard";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { ApprovalWorkflow } from "@/components/ApprovalWorkflow";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentPlatform } from "@/utils/platform";

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  // State for API data
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const pageSize = 10;

  // State for approval requests
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);

  // State for users dropdown
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Track current platform to trigger refresh when it changes
  const [currentPlatform, setCurrentPlatform] = useState<string | null>(null);

  // Add loading priorities and sequencing
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState<string[]>([]);
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState(false);

  // Determine user role for display
  const getUserRole = (role: number | undefined): string => {
    if (role === 3) return "Admin";
    if (role === 2) return "Manager";
    return "User";
  };
  const userRole = getUserRole(user?.role);

  // Centralized data loading with graceful handling
  const loadDashboardData = async (options: {
    loadUsers?: boolean;
    loadRequests?: boolean;
    loadApprovals?: boolean;
    isRefresh?: boolean;
  } = {}) => {
    // Prevent concurrent calls
    if (isLoadingDashboardData) {
      console.log('Dashboard data loading already in progress, skipping...');
      return;
    }

    const { 
      loadUsers = true, 
      loadRequests = true, 
      loadApprovals = false, // Only load approvals when needed
      isRefresh = false 
    } = options;

    console.log('Loading dashboard data:', options);
    
    try {
      setIsLoadingDashboardData(true);
      
      // Priority 1: Load users first (needed for other operations)
      if (loadUsers && (!users.length || isRefresh)) {
        setLoadingQueue(prev => [...prev, 'users']);
        await fetchUsers();
        setLoadingQueue(prev => prev.filter(item => item !== 'users'));
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Priority 2: Load requests
      if (loadRequests) {
        setLoadingQueue(prev => [...prev, 'requests']);
        await fetchRequests();
        setLoadingQueue(prev => prev.filter(item => item !== 'requests'));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Priority 3: Load approvals (only if needed)
      if (loadApprovals) {
        setLoadingQueue(prev => [...prev, 'approvals']);
        await fetchApprovalRequests();
        setLoadingQueue(prev => prev.filter(item => item !== 'approvals'));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsInitialLoad(false);
      setLoadingQueue([]);
      setIsLoadingDashboardData(false);
    }
  };

  // Check if initial data loading is complete
  const isInitialDataLoaded = () => {
    return !isInitialLoad && !loadingQueue.includes('users') && !loadingQueue.includes('requests');
  };

  // Single useEffect for initial platform detection and data loading
  useEffect(() => {
    const platform = getCurrentPlatform();
    if (platform && platform !== currentPlatform) {
      setCurrentPlatform(platform);
      
      // Only load data if this is the initial load or platform actually changed
      if (!currentPlatform || platform !== currentPlatform) {
        // Reset states for new platform
        setIsLoadingRequests(true);
        setIsLoadingApprovals(true);
        setIsLoadingUsers(true);
        setCurrentPage(1);
        setRequests([]);
        setApprovalRequests([]);
        setUsers([]);
        
        // Load initial data
        loadDashboardData({ 
          loadUsers: true, 
          loadRequests: true, 
          loadApprovals: false, 
          isRefresh: true 
        });
      }
    }
  }, [location.pathname]); // Only watch for URL path changes

  // Handle pagination and filter changes (immediate reload)
  useEffect(() => {
    if (!isInitialLoad && currentPlatform) {
      loadDashboardData({ 
        loadUsers: false, 
        loadRequests: true, 
        loadApprovals: false 
      });
    }
  }, [currentPage, filterRole]);

  // Handle search changes with debouncing (500ms delay)
  useEffect(() => {
    if (!isInitialLoad && currentPlatform) {
      if (searchTerm !== "") {
        const debounceTimer = setTimeout(() => {
          loadDashboardData({ 
            loadUsers: false, 
            loadRequests: true, 
            loadApprovals: false 
          });
        }, 500);

        return () => clearTimeout(debounceTimer);
      } else {
        // Immediate load when search is cleared
        loadDashboardData({ 
          loadUsers: false, 
          loadRequests: true, 
          loadApprovals: false 
        });
      }
    }
  }, [searchTerm]);

  // Handle tab changes (load approvals only when needed)
  useEffect(() => {
    if (activeTab === 'approvals' && !isInitialLoad && currentPlatform) {
      loadDashboardData({ 
        loadUsers: false, 
        loadRequests: false, 
        loadApprovals: true 
      });
    }
  }, [activeTab]);

  const fetchRequests = async (retryCount = 0) => {
    try {
      setIsLoadingRequests(true);
      const params = {
        page: currentPage,
        pageSize,
        search: searchTerm,
        ...(filterRole !== "all" && { created_by_user: filterRole })
      };

      console.log('Fetching requests with params:', params);
      const response = await apiService.getAllHuskies(params);
      console.log('API response:', response);
      
      // Check if response has data
      if (!response || !response.data) {
        console.warn('No data in response:', response);
        setRequests([]);
        setTotalRequests(0);
        return;
      }

      // Transform API data to match frontend interface
      const transformedRequests = response.data.map((husky: any) => {
        return {
          id: husky.husky_id || husky.id || `NA`,
          title: husky.title || "Untitled Request",
          platform: husky.platform?.name || "Unknown",
          status: getStatusFromText(husky.status),
          priority: getPriorityFromText(husky.priority),
          requester: husky.user?.name || husky.created_by_user || "Unknown User",
          approvals: ["Manager", "Director", "VP"], // This would come from approval data
          createdAt: husky.created_at ? new Date(husky.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          description: husky.business_description || husky.jd_p1 || "No description provided",
          grade: husky.grade || "N/A",
          experience_level: husky.experience_level || "N/A",
          job_family: husky.job_family?.name || "Unknown",
          husky_id: husky.husky_id,
          husky_approval: husky.husky_approval || [],
          // Additional fields for detailed view
          business_description: husky.business_description,
          jd_p1: husky.jd_p1,
          jd_p2: husky.jd_p2,
          jd_p3: husky.jd_p3,
          created_at: husky.created_at,
          updated_at: husky.updated_at,
          user: husky.user,
          platform_data: husky.platform,
          lab: husky.lab,
          feature_team: husky.feature_team
        };
      });

      console.log('Transformed requests:', transformedRequests);
      setRequests(transformedRequests);
      setTotalRequests(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && (error as any)?.name === 'NetworkError') {
        console.log(`Retrying request fetch, attempt ${retryCount + 1}`);
        setTimeout(() => fetchRequests(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Show user-friendly error message
      if (!loadingQueue.includes('requests')) {
        toast({
          title: "Connection Issue",
          description: "Unable to load requests. Please check your connection.",
          variant: "destructive",
        });
      }
      
      // Set empty state on error
      setRequests([]);
      setTotalRequests(0);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchApprovalRequests = async (retryCount = 0) => {
    try {
      setIsLoadingApprovals(true);
      console.log('Fetching approval requests for user:', user?.id);
      
      // Use the getHuskyApprovalByUser API
      const response = await apiService.getHuskyApprovalByUser(user?.id);
      console.log('Approval API response:', response);
      
      // Transform the approval data to match the Request interface
      const transformedApprovals = response.map((approval: any) => {
        console.log('Processing approval:', approval);
        
        // Get approval count from the backend data
        const approvalCount = approval.husky?.totalApprovalCount || 3; // Default to 3 if not provided
        const currentApprovalLevel = approval.husky?.currentApprovalLevel || approval.level || 1;

        return {
          id: approval.husky?.husky_id || approval.husky?.id || `APR-${approval.id}`,
          title: approval.husky?.title || "Untitled Request",
          platform: approval.husky?.platform?.name || "Unknown",
          status: getApprovalStatusText(approval.status),
          priority: getPriorityText(approval.husky?.priority || approval.husky?.grade || "Medium"),
          requester: approval.husky?.user?.name || "Unknown User",
          approvals: ["Manager", "Director", "VP"], // This could be enhanced with actual approval chain
          createdAt: approval.husky?.created_at ? new Date(approval.husky.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          description: approval.husky?.business_description || approval.husky?.jd_p1 || "No description provided",
          grade: approval.husky?.grade || "N/A",
          experience_level: approval.husky?.experience_level || "N/A",
          job_family: approval.husky?.job_family?.name || "Unknown",
          approvalId: approval.id,
          approverLevel: approval.level,
          approvalComment: approval.comment,
          approvalCount: approvalCount,
          currentApprovalLevel: currentApprovalLevel,
          completedApprovalCount: approval.husky?.completedApprovalCount || 0,
          husky_id: approval.husky?.husky_id || `REQ-${approval.husky?.id || approval.id}`,
          // Add additional fields that might be needed
          lab: approval.husky?.lab?.name || "Unknown Lab",
          feature_team: approval.husky?.feature_team?.name || "Unknown Team",
          platform_data: approval.husky?.platform
        };
      });

      console.log('Transformed approval requests:', transformedApprovals);
      const pendingApprovals = transformedApprovals.filter(req => req.status.toLowerCase() === "pending");
      console.log('Filtered pending approvals:', pendingApprovals);
      console.log('Total approvals count:', transformedApprovals.length);
      console.log('Pending approvals count:', pendingApprovals.length);
      setApprovalRequests(transformedApprovals);
    } catch (error) {
      console.error('Failed to fetch approval requests:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && (error as any)?.name === 'NetworkError') {
        console.log(`Retrying approval fetch, attempt ${retryCount + 1}`);
        setTimeout(() => fetchApprovalRequests(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Show user-friendly error message
      if (!loadingQueue.includes('approvals')) {
        toast({
          title: "Connection Issue",
          description: "Unable to load approvals. Please check your connection.",
          variant: "destructive",
        });
      }
      
      setApprovalRequests([]);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const getApprovalStatusText = (status: string): string => {
    // Handle both string and numeric status values
    if (typeof status === 'string') {
      return status; // If it's already a string, return as is
    }
  };

  const getStatusFromText = (status: string): string => {
    if (!status) return "Pending";
    const statusLower = status.toLowerCase();
    if (statusLower === "approved") return "Approved";
    if (statusLower === "rejected") return "Rejected";
    if (statusLower === "pending") return "Pending";
    return "Pending"; // default fallback
  };

  const getPriorityFromText = (priority: string): string => {
    if (!priority) return "Medium";
    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high") return "High";
    if (priorityLower === "medium") return "Medium";
    if (priorityLower === "low") return "Low";
    return "Medium"; // default fallback
  };

  const getPriorityText = (priority: string | number): string => {
    // Handle string priority values from API
    if (typeof priority === 'string') {
      const priorityLower = priority.toLowerCase();
      if (priorityLower === "high") return "High";
      if (priorityLower === "medium") return "Medium";
      if (priorityLower === "low") return "Low";
      return priority; // Return as is if it's already a valid string
    }
    
    // Handle numeric priority values (legacy)
    switch (priority) {
      case 3: return "High";
      case 2: return "Medium";
      case 1: return "Low";
      default: return "Medium";
    }
  };

  const fetchUsers = async (retryCount = 0) => {
    try {
      setIsLoadingUsers(true);
      console.log('Fetching users for dropdown...');
      
      const response = await apiService.getAllUsers();
      console.log('Users API response:', response);
      
      // Transform users data for dropdown
      const transformedUsers = response?.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email
      })) || [];

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && (error as any)?.name === 'NetworkError') {
        console.log(`Retrying users fetch, attempt ${retryCount + 1}`);
        setTimeout(() => fetchUsers(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Show user-friendly error message
      if (!loadingQueue.includes('users')) {
        toast({
          title: "Connection Issue",
          description: "Unable to load user data. Some filters may not work.",
          variant: "destructive",
        });
      }
      
      // Set empty array on error
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateRequest = (response: any) => {
    // The API call is now handled in CreateRequestDialog
    // This callback is just used to refresh the data after successful creation
    fetchRequests();
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Husky Demand Portal</h1>
            </div>
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-600 text-white text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-sm font-medium text-gray-900">
                {user.name}
              </span>
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 border border-blue-300 font-medium px-2 py-1 rounded-md shadow-sm hover:bg-blue-200 transition"
              >
                {userRole}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Queue Indicator */}
        {loadingQueue.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">
                Loading {loadingQueue.join(', ')}...
              </span>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!isInitialDataLoaded()}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            {!isInitialDataLoaded() ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                <DashboardStats />

                {/* Search and Filter */}
                <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                        <CardTitle className="mb-2">
                          Active Husky Requests
                        </CardTitle>
                        <CardDescription className="font-normal text-gray-600 leading-relaxed text-base text-gray-700">
                          Centralized view of all demand requests across platforms
                        </CardDescription>
                      </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadDashboardData({ loadUsers: false, loadRequests: true, loadApprovals: false })}
                  disabled={loadingQueue.includes('requests')}
                >
                   <RefreshCcw className="w-4 h-4" />
                  {loadingQueue.includes('requests') ? "Loading..." : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => {
                        e.preventDefault();
                        setSearchTerm(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      className="w-full"
                    />
                    {isLoadingRequests && requests.length > 0 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by created by user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>Loading users...</SelectItem>
                      ) : (
                        users.map((user) => (
                          <SelectItem 
                            key={user.id} 
                            value={user.id.toString()}
                          >
                            {user.name} ({user.email || `ID: ${user.id}`})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {isLoadingRequests && requests.length === 0 ? (
                    // Loading skeletons only when no existing data
                    Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </Card>
                    ))
                  ) : requests.length === 0 ? (
                    <Card className="p-8">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm || filterRole !== "all" 
                            ? "Try adjusting your search or filter criteria." 
                            : "No husky requests have been created yet."}
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Request
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    requests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">My Requests</h2>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
            
            <div className="grid gap-4">
              <UserRequestCard showActions />
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Pending Approvals</h2>
            {isLoadingApprovals ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ApprovalWorkflow 
                requests={approvalRequests.filter(req => req.status.toLowerCase() === "pending")} 
                onRefresh={fetchApprovalRequests}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <CreateRequestDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onCreateRequest={handleCreateRequest}
        huskyId=""
      />
    </div>
  );
};

export default Index;
