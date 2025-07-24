
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, XCircle, CheckCircle, Clock, TriangleAlert, ArrowDown, Hourglass } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { apiService } from "@/services/api";

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
  // Additional fields from API response
  grade?: string;
  experience_level?: string;
  job_family?: string;
  business_description?: string;
  jd_p1?: string;
  jd_p2?: string;
  jd_p3?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    name?: string;
    email?: string;
  };
  platform_data?: {
    name?: string;
  };
  lab?: {
    name?: string;
  };
  feature_team?: {
    name?: string;
  };
}

interface RequestCardProps {
  request: Request;
  showActions?: boolean;
}

export const RequestCard = ({ request, showActions = false }: RequestCardProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [approvers, setApprovers] = useState<{ [key: number]: any }>({});
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [detailedApprovals, setDetailedApprovals] = useState<any[]>([]);
  const [loadingDetailedApprovals, setLoadingDetailedApprovals] = useState(false);

  const handleViewDetails = async () => {
    setIsDetailsOpen(true);
    
    // Debug: Log the full request object
    console.log('RequestCard full request object:', request);
    console.log('RequestCard husky_approval array:', request.husky_approval);
    
    // Fetch approver details if we have approval data
    if (request.husky_approval && request.husky_approval.length > 0) {
      await fetchApproverDetails();
    }
    
    // Fetch detailed approval data with reason field
    if (request.husky_id) {
      await fetchDetailedApprovals();
    }
  };

  const fetchDetailedApprovals = async () => {
    if (loadingDetailedApprovals) return;
    
    try {
      setLoadingDetailedApprovals(true);
      console.log('Fetching detailed approval data for husky_id:', request.husky_id);
      const freshApprovalData = await apiService.getHuskyApprovalByHuskyId(parseInt(request.husky_id!));
      console.log('Fresh approval data:', freshApprovalData);
      
      if (freshApprovalData && Array.isArray(freshApprovalData)) {
        setDetailedApprovals(freshApprovalData);
      }
    } catch (error) {
      console.error('Failed to fetch detailed approval data:', error);
      setDetailedApprovals([]);
    } finally {
      setLoadingDetailedApprovals(false);
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
      return <CheckCircle className="w-4 h-4 text-white-800" />; 
    case "Rejected":
      return <XCircle className="w-4 h-4 text-white-800" />;
    case "Pending":
      return <Clock className="w-4 h-4 text-gray-800" />;
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
              className={`flex-1 h-2 rounded ${
                request.status === "Approved" ? "bg-green-500" : 
                index === 0 ? "bg-yellow-500" : "bg-gray-200"
              }`}
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
          let barColor = "bg-gray-200"; // Default: pending

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
                {request.platform_data?.name || request.platform}
              </Badge>
              {(request.lab?.name || process.env.NODE_ENV === 'development') && (
                <Badge variant="secondary" className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-md shadow-sm hover:bg-purple-200 transition">
                  Lab: {request.lab?.name || 'Test Lab'}
                </Badge>
              )}
              {(request.feature_team?.name || process.env.NODE_ENV === 'development') && (
                <Badge variant="secondary" className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md shadow-sm hover:bg-indigo-200 transition">
                  Team: {request.feature_team?.name || 'Test Team'}
                </Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
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
            <Badge  className={`${getPriorityColor(request.priority)} flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium`}>
              {getPriorityIcon(request.priority)}
              {request.priority}
            </Badge>
            <Badge  className={`${getStatusColor(request.status)} flex items-center gap-2 px-4 py-1 rounded-full text-base font-semibold`}>
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
                <span key={index}>{label}</span>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Request Details</span>
              {request.husky_id && (
                <Badge variant="outline" className="text-xs">
                  {request.husky_id}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information about the husky request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Title</h4>
                <p className="text-sm">{request.title}</p>
              </div>
              {request.husky_id && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Husky ID</h4>
                  <Badge variant="outline" className="text-xs">
                    {request.husky_id}
                  </Badge>
                </div>
              )}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Platform</h4>
                <p className="text-sm">{request.platform_data?.name || request.platform}</p>
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
                <p className="text-sm">{request.grade || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Experience Level</h4>
                <p className="text-sm">{request.experience_level || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Job Family</h4>
                <p className="text-sm">{request.job_family || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Created By</h4>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-blue-600 text-white">
                      {request.requester.split(' ')[0][0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{request.user?.name || request.requester}</span>
                    {request.user?.email && (
                      <span className="text-xs text-gray-500">{request.user.email}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Created At</h4>
                <p className="text-sm">{request.created_at ? new Date(request.created_at).toLocaleString() : request.createdAt}</p>
              </div>
              {request.updated_at && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Updated At</h4>
                  <p className="text-sm">{new Date(request.updated_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Business Description */}
            {request.business_description && (
              <>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Business Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {request.business_description}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Job Description Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Job Description</h4>
              
              {request.jd_p1 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-xs text-gray-600">Key Responsibilities (P1)</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {request.jd_p1}
                  </p>
                </div>
              )}

              {request.jd_p2 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-xs text-gray-600">Required Skills (P2)</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {request.jd_p2}
                  </p>
                </div>
              )}

              {request.jd_p3 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-xs text-gray-600">Tech Stack & Tools (P3)</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {request.jd_p3}
                  </p>
                </div>
              )}

              {/* Fallback description if no JD parts are available */}
              {!request.jd_p1 && !request.jd_p2 && !request.jd_p3 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-xs text-gray-600">Description</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {request.description}
                  </p>
                </div>
              )}
            </div>

            {/* Assignment Details */}
            {(request.lab?.name || request.feature_team?.name) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">Assignment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {request.lab?.name && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-xs text-gray-600">Lab</h5>
                        <Badge variant="secondary">{request.lab.name}</Badge>
                      </div>
                    )}
                    {request.feature_team?.name && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-xs text-gray-600">Feature Team</h5>
                        <Badge variant="secondary">{request.feature_team.name}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Approval Progress */}
            {request.husky_approval && request.husky_approval.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Approval Progress</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Approval Progress
                    </span>
                    <span className="text-xs text-gray-500">
                      {getCompletionCount()} Complete
                    </span>
                  </div>
                  {renderApprovalBars()}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {renderApprovalLabels().map((label, index) => (
                      <span key={`${label}-${index}`}>{label}</span>
                    ))}
                  </div>
                  
                  {/* Approval Steps Details */}
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {loadingApprovers && (
                      <div className="text-sm text-gray-500 italic">Loading approver details...</div>
                    )}
                    {request.husky_approval.sort((a, b) => a.level - b.level).map((approval) => {
                      return (
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
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
