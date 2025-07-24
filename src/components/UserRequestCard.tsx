import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, CheckCircle, Clock, Edit, Trash2, MoreVertical, Users, RefreshCcw, TriangleAlert, Hourglass, ArrowDown, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { ApprovalRequestDialog } from "@/components/ApprovalRequestDialog";

interface Request {
  id: string;
  title: string;
  platform: string;
  status: string;
  priority: string;
  requester: string;
  approvals: string[];
  createdAt: string;
  description: string;
  husky_id?: string;
  husky_approval?: Array<{
    id: number;
    level: number;
    status: string;
    approver_id: number;
    reason?: string;
  }>;
  // Additional fields for comprehensive details
  grade?: string;
  experience_level?: string;
  job_family?: string;
  business_description?: string;
  jd_p1?: string;
  jd_p2?: string;
  jd_p3?: string;
  created_at?: string;
  updated_at?: string;
  user?: any;
  platform_data?: any;
  lab?: any;
  feature_team?: any;
}

interface UserRequestCardProps {
  showActions?: boolean;
}

export const UserRequestCard = ({ showActions = false }: UserRequestCardProps) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobFamilies, setJobFamilies] = useState<{[key: number]: string}>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchUserRequests();
    }
  }, [user?.id]);

  const fetchUserRequests = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching requests for user ID:', user.id);
      
      // Fetch both user requests and job families
      const [result, jobFamilyData] = await Promise.all([
        apiService.getHuskiesByUser(user.id, 1, 10),
        apiService.getJobFamilies()
      ]);
      
      console.log('API Response:', result);
      console.log('Job families:', jobFamilyData);
      
      // Create job family mapping
      const jobFamilyMap: {[key: number]: string} = {};
      jobFamilyData.forEach(family => {
        jobFamilyMap[family.id] = family.name;
      });
      setJobFamilies(jobFamilyMap);
      
      // Transform backend data to frontend format
      const transformedRequests: Request[] = result.data?.map((item: any) => {
        console.log('Processing item:', item);
        return {
          id: item.id?.toString() || '',
          title: item.title || 'Untitled Request',
          platform: item.platform?.name || 'Unknown Platform',
          status: getStatusFromItem(item),
          priority: getPriorityFromAPI(item.priority),
          requester: item.user?.name || 'Unknown User',
          approvals: ['Tech Lead', 'Manager', 'Director'],
          createdAt: new Date(item.created_at).toLocaleDateString(),
          description: item.business_description || 'No description available',
          husky_id: item.husky_id || null, // Only use actual husky_id, don't fallback to regular id
          husky_approval: item.husky_approval || [],
          // Additional fields for detailed view
          grade: item.grade,
          experience_level: item.experience_level,
          job_family: jobFamilyMap[item.job_family] || item.job_family?.name || 'Unknown Job Family',
          business_description: item.business_description,
          jd_p1: item.jd_p1,
          jd_p2: item.jd_p2,
          jd_p3: item.jd_p3,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user: item.user,
          platform_data: item.platform,
          lab: item.lab,
          feature_team: item.feature_team
        };
      }) || [];
      
      console.log('Transformed requests:', transformedRequests);
      setRequests(transformedRequests);
    } catch (error) {
      console.error('Failed to fetch user requests:', error);
      toast({
        title: "Error",
        description: "Failed to load your requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusFromItem = (item: any) => {
    // Determine status based on husky_approval data
    if (item.husky_approval?.length > 0) {
      const approval = item.husky_approval[0];
      switch (approval.status) {
        case 'Approved': return 'Approved';
        case 'Rejected': return 'Rejected';
        default: return 'Pending';
      }
    }
    return 'Pending';
  };

  const getPriorityFromGrade = (grade: string) => {
    if (!grade) return 'Medium';
    const gradeNum = parseInt(grade);
    if (gradeNum >= 10) return 'High';
    if (gradeNum >= 5) return 'Medium';
    return 'Low';
  };

  const getPriorityFromAPI = (priority: string) => {
    // Handle both numeric and string priority values from API
    
    switch (priority) {
      case 'Low':
        return 'Low';
      case 'Medium':
        return 'Medium';
      case 'High':
        return 'High';
      default:
        return 'Medium'; // Default fallback
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500 text-white hover:bg-green-600";
      case "Rejected":
        return "bg-red-500 text-white hover:bg-red-600";
      case "Pending":
        return "bg-gradient-to-r from-yellow-300 to-yellow-500 text-black hover:from-yellow-400 hover:to-yellow-600";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800";
      case "Medium":
        return "bg-gradient-to-r from-amber-300 to-amber-500 text-black hover:from-amber-400 hover:to-amber-600";
      case "Low":
        return "bg-gradient-to-r from-blue-300 to-blue-500 text-white hover:from-blue-400 hover:to-blue-600";
      default:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <TriangleAlert className="w-4 h-4" />;
      case "Medium":
        return <Hourglass className="w-4 h-4" />;
      case "Low":
        return <ArrowDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4" />; 
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getCardBackgroundColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "Rejected":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      case "Pending":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      default:
        return "bg-white hover:shadow-md";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!requests.length) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-gray-500">No requests found for your account.</p>
          <Button variant="outline" className="mt-4" onClick={fetchUserRequests}>
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <RequestCardItem 
          key={request.id} 
          request={request} 
          showActions={showActions}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          getCardBackgroundColor={getCardBackgroundColor}
          getPriorityIcon={getPriorityIcon}
          getStatusIcon={getStatusIcon}
        />
      ))}
    </div>
  );
};

interface RequestCardItemProps {
  request: Request;
  showActions: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getCardBackgroundColor: (status: string) => string;
  getPriorityIcon: (priority: string) => ReactNode;
  getStatusIcon: (status: string) => ReactNode;
}

const RequestCardItem = ({ request, showActions, getStatusColor, getPriorityColor, getCardBackgroundColor, getPriorityIcon, getStatusIcon }: RequestCardItemProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isApprovalRequestOpen, setIsApprovalRequestOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [approvers, setApprovers] = useState<{ [key: number]: any }>({});
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = async () => {
    setIsDetailsOpen(true);
    
    // Fetch approver details if we have approval data
    if (request.husky_approval && request.husky_approval.length > 0) {
      await fetchApproverDetails();
    }
  };

  const fetchApproverDetails = async () => {
    if (loadingApprovers) return;
    
    try {
      setLoadingApprovers(true);
      const approverPromises = request.husky_approval
        ?.filter(approval => approval.approver_id)
        .map(async (approval) => {
          try {
            const approverData = await apiService.getUserById(approval.approver_id);
            return { id: approval.approver_id, data: approverData };
          } catch (error) {
            console.error(`Failed to fetch approver ${approval.approver_id}:`, error);
            return { id: approval.approver_id, data: null };
          }
        }) || [];

      const results = await Promise.all(approverPromises);
      const approversMap: { [key: number]: any } = {};
      
      results.forEach(result => {
        if (result.data) {
          approversMap[result.id] = result.data;
        }
      });
      
      setApprovers(approversMap);
    } catch (error) {
      console.error('Failed to fetch approver details:', error);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const handleUpdate = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    // Refresh the data after edit
    window.location.reload();
  };

  const handleRequestApproval = () => {
    setIsApprovalRequestOpen(true);
  };

  const handleApprovalRequestsCreated = () => {
    // Refresh the data after approval requests are created
    window.location.reload();
  };

  // Prepare initial data for edit dialog
  const getInitialEditData = () => {
    const priorityMap = {
      'Low': '1',
      'Medium': '2', 
      'High': '3'
    };

    return {
      id: request.id,
      title: request.title,
      grade: request.grade || "",
      priority: priorityMap[request.priority as keyof typeof priorityMap] || "2",
      business_description: request.business_description || "",
      experience_level: request.experience_level || "Senior",
      jd_p1: request.jd_p1 || "",
      jd_p2: request.jd_p2 || "",
      jd_p3: request.jd_p3 || "",
      job_family_id: "2", // Default value, you might want to map this from request.job_family
    };
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await apiService.deleteHusky(parseInt(request.id));
      
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });
      setIsDeleteOpen(false);
      // Refresh the page to remove deleted item
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get approval level title
  const getApprovalLevelTitle = (level: number) => {
    return `Level ${level}`;
  };

  // Helper function to render approval progress bars
  const renderApprovalBars = () => {
    if (!request.husky_approval || request.husky_approval.length === 0) {
      // Fallback to default 3-level approval if no approval data
      return (
        <div className="flex space-x-1">
          {["Level 1", "Level 2", "Level 3"].map((approval, index) => (
            <div
              key={`${approval}-${index}`}
              className={`flex-1 h-3 rounded-full ${
                request.status === "Approved" ? "bg-gradient-to-r from-green-400 to-green-600" : 
                index === 0 ? "bg-gradient-to-r from-yellow-300 to-yellow-500" : "bg-gray-200"
              } transition duration-300 ease-in-out shadow-sm`}
            />
          ))}
        </div>
      );
    }

    // Sort approvals by level
    const sortedApprovals = [...request.husky_approval].sort((a, b) => a.level - b.level);
    
    return (
      <div className="flex space-x-1">
        {sortedApprovals.map((approval) => {
          let barColor = "bg-gray-200"; // Default: Pending
          
          if (approval.status === "Approved") {
            barColor = "bg-gradient-to-r from-green-400 to-green-600";
          } else if (approval.status === "Rejected") {
            barColor = "bg-gradient-to-r from-red-400 to-red-600";
          } else if (approval.status === "Pending") {
            barColor = "bg-gradient-to-r from-yellow-300 to-yellow-500";
          }
          
          return (
            <div
              key={approval.id}
              title={`Level ${approval.level}`}
              className={`flex-1 h-3 rounded-full ${barColor} transition duration-300 ease-in-out shadow-sm`}
            />
          );
        })}
      </div>
    );
  };

  // Helper function to render approval labels
  const renderApprovalLabels = () => {
    if (!request.husky_approval || request.husky_approval.length === 0) {
      return ["Level 1", "Level 2", "Level 3"];
    }
    
    const sortedApprovals = [...request.husky_approval].sort((a, b) => a.level - b.level);
    return sortedApprovals.map(approval => getApprovalLevelTitle(approval.level));
  };

  // Helper function to get completion count
  const getCompletionCount = () => {
    if (!request.husky_approval || request.husky_approval.length === 0) {
      return "0/0";
    }
    
    const completedCount = request.husky_approval.filter(a => a.status === 'Approved').length;
    const totalCount = request.husky_approval.length;
    return `${completedCount}/${totalCount}`;
  };

  return (
    <Card className={`transition-all duration-200 ${getCardBackgroundColor(request.status)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">
              {request.title}
              <span className="ml-1 text-base text-gray-700 font-normal">
                (Grade - {request.grade})
              </span>
            </CardTitle>
            <CardDescription className="text-base text-gray-700">{request.description}</CardDescription>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {request.husky_id && (
                <Badge variant="outline" className="text-sm font-semibold border-blue-500 text-blue-700 px-3 py-1 rounded-md shadow-sm hover:bg-blue-50 transition">
                  {request.husky_id}
                </Badge>
              )}
              <Badge variant="secondary" className="text-sm font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md shadow-sm hover:bg-gray-200 transition">
                {request.platform}
              </Badge>
              {(request.lab?.name) && (
                <Badge variant="secondary" className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-md shadow-sm hover:bg-purple-200 transition">
                  Lab: {request.lab?.name}
                </Badge>
              )}
              {(request.feature_team?.name) && (
                <Badge variant="secondary" className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md shadow-sm hover:bg-indigo-200 transition">
                  Team: {request.feature_team?.name}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-gray-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUpdate} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Update Request
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRequestApproval} className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Request Approval
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-blue-600 text-white">
                  {request.requester.split(' ')[0][0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{request.requester}</span>
            </div>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{request.createdAt}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getPriorityColor(request.priority)} flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium`}>
              {getPriorityIcon(request.priority)}
              {request.priority}
            </Badge>
            <Badge className={`${getStatusColor(request.status)} flex items-center gap-2 px-4 py-1 rounded-full text-base font-semibold`}>
              {getStatusIcon(request.status)}
              {request.status}
            </Badge>
          </div>
        </div>
        
        {/* Dynamic Approval Progress - Show different content based on approver presence */}
        {request.husky_approval && request.husky_approval.length > 0 ? (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600 font-semibold mb-2">
              <span>Approval Progress</span>
              <span>{getCompletionCount()} Complete</span>
            </div>
            {renderApprovalBars()}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              {renderApprovalLabels().map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600 font-semibold mb-2">
              <span>Approval Progress</span>
              <div className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded-md border border-dashed border-gray-300">
                No approvals have been added yet.
              </div>
              <span>{getCompletionCount()} Complete</span>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Request Details</span>
              {request.husky_id && (
                <Badge variant="outline" className="text-xs">
                  Husky ID: {request.husky_id}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the husky request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Title</h4>
                  <p className="text-sm">{request.title}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Platform</h4>
                  <p className="text-sm">{request.platform}</p>
                </div>
                {request.lab?.name && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">Lab</h4>
                    <p className="text-sm">{request.lab.name}</p>
                  </div>
                )}
                {request.feature_team?.name && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">Feature Team</h4>
                    <p className="text-sm">{request.feature_team.name}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Status</h4>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Priority</h4>
                  <Badge className={getPriorityColor(request.priority)}>
                    {request.priority}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Grade</h4>
                  <p className="text-sm">{request.grade || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Experience Level</h4>
                  <p className="text-sm">{request.experience_level || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Job Family</h4>
                  <p className="text-sm">{request.job_family || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Created At</h4>
                  <p className="text-sm">{request.created_at ? new Date(request.created_at).toLocaleString() : request.createdAt}</p>
                </div>
                {request.updated_at && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">Last Updated</h4>
                    <p className="text-sm">{new Date(request.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Enhanced User Information */}
            {request.user && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Requester</h4>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-blue-600 text-white">
                            {request.requester.split(' ')[0][0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{request.user.name || request.requester}</span>
                      </div>
                    </div>
                    {request.user.email && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Email</h4>
                        <p className="text-sm text-blue-600">{request.user.email}</p>
                      </div>
                    )}
                    {request.user.role !== undefined && (() => {
                      let roleLabel = 'User';
                      if (request.user.role === 3) {
                        roleLabel = 'Admin';
                      } else if (request.user.role === 2) {
                        roleLabel = 'Manager';
                      }
                      return (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700">Role</h4>
                          <p className="text-sm">{roleLabel}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Detailed Job Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Job Description Details</h3>
              
              {request.business_description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Business Description</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                    <pre className="whitespace-pre-wrap font-sans">{request.business_description}</pre>
                  </div>
                </div>
              )}
              
              {request.jd_p1 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Job Description Part 1</h4>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border">
                    <pre className="whitespace-pre-wrap font-sans">{request.jd_p1}</pre>
                  </div>
                </div>
              )}
              
              {request.jd_p2 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Job Description Part 2</h4>
                  <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md border">
                    <pre className="whitespace-pre-wrap font-sans">{request.jd_p2}</pre>
                  </div>
                </div>
              )}
              
              {request.jd_p3 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Job Description Part 3</h4>
                  <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border">
                    <pre className="whitespace-pre-wrap font-sans">{request.jd_p3}</pre>
                  </div>
                </div>
              )}
              
              {!request.business_description && !request.jd_p1 && !request.jd_p2 && !request.jd_p3 && (
                <div className="text-sm text-gray-500 italic">No detailed job description available</div>
              )}
            </div>

            <Separator />

            {/* Assignment Details */}
            {(request.platform_data || request.lab || request.feature_team) && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Assignment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {request.platform_data && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Platform Details</h4>
                        <div className="text-sm bg-gray-50 p-3 rounded-md border">
                          <p><strong>Name:</strong> {request.platform_data.name || 'N/A'}</p>
                          {request.platform_data.description && (
                            <p><strong>Description:</strong> {request.platform_data.description}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {request.lab && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Lab Assignment</h4>
                        <div className="text-sm bg-gray-50 p-3 rounded-md border">
                          <p><strong>Name:</strong> {request.lab.name || 'N/A'}</p>
                          {request.lab.description && (
                            <p><strong>Description:</strong> {request.lab.description}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {request.feature_team && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Feature Team</h4>
                        <div className="text-sm bg-gray-50 p-3 rounded-md border">
                          <p><strong>Name:</strong> {request.feature_team.name || 'N/A'}</p>
                          {request.feature_team.description && (
                            <p><strong>Description:</strong> {request.feature_team.description}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Approval Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Approval Progress</h3>
              
              {request.husky_approval && request.husky_approval.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress Overview</span>
                    <span className="text-xs text-gray-500">{getCompletionCount()} Complete</span>
                  </div>
                  
                  {renderApprovalBars()}
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {renderApprovalLabels().map((label, index) => (
                      <span key={`${label}-${index}`}>{label}</span>
                    ))}
                  </div>
                  
                  {/* Detailed Approval Steps */}
                  <div className="grid grid-cols-1 gap-2 mt-6">
                    <h4 className="font-semibold text-sm text-gray-700">Approval Steps</h4>
                    {loadingApprovers && (
                      <div className="text-sm text-gray-500 italic">Loading approver details...</div>
                    )}
                    {request.husky_approval.sort((a, b) => a.level - b.level).map((approval) => (
                      <div key={approval.id} className={`flex items-center space-x-3 p-3 rounded ${
                        approval.status === "Approved" ? 'bg-green-50' : 
                        approval.status === "Rejected" ? 'bg-red-50' :
                        approval.status === "Pending" ? 'bg-yellow-50' : 'bg-gray-50'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          approval.status === "Approved" ? 'bg-green-500 text-white' : 
                          approval.status === "Rejected" ? 'bg-red-500 text-white' :
                          approval.status === "Pending" ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-black' : 
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {approval.level}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {getApprovalLevelTitle(approval.level)}
                          </span>
                          {approval.approver_id && (
                            <div className="mt-1">
                              {approvers[approval.approver_id] ? (
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs bg-indigo-600 text-white">
                                      {approvers[approval.approver_id].name?.charAt(0)?.toUpperCase() || 'A'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-medium text-gray-800">
                                      {approvers[approval.approver_id].name || 'Unknown Approver'}
                                    </p>
                                    {approvers[approval.approver_id].email && (
                                      <p className="text-xs text-gray-600">
                                        {approvers[approval.approver_id].email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600">
                                  {loadingApprovers ? 'Loading approver...' : `Approver ID: ${approval.approver_id}`}
                                </p>
                              )}
                            </div>
                          )}
                          {approval.status === "Rejected" && approval.reason && (
                            <div className="mt-1 p-1 bg-red-100 rounded">
                              <p className="text-xs text-red-700">
                                <span className="font-medium">Reason:</span> {approval.reason}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-auto">
                          {approval.status === "Approved" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : approval.status === "Rejected" ? (
                            <div className="h-4 w-4 rounded-full bg-red-500" />
                          ) : approval.status === "Pending" ? (
                            <Clock className="h-4 w-4 text-orange-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No approval information available</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Request Dialog */}
      <CreateRequestDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editMode={true}
        initialData={getInitialEditData()}
        onCreateRequest={handleEditComplete}
        huskyId={request.id}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-red-500">
            <div className="font-medium text-sm">{request.title}</div>
            <div className="text-xs text-gray-600">
              {request.husky_id ? `Husky ID: ${request.husky_id}` : `Request ID: ${request.id}`}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Approval Request Dialog */}
      <ApprovalRequestDialog
        open={isApprovalRequestOpen}
        onOpenChange={setIsApprovalRequestOpen}
        huskyId={request.id}
        huskyTitle={request.title}
        onApprovalRequestsCreated={handleApprovalRequestsCreated}
      />
    </Card>
  );
};
