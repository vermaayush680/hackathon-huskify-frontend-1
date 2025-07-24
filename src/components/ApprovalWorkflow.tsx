
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, MessageCircle, Eye, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

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
  approvalId?: number; // Add approval ID for update operations
  approvalCount: number; // Number of approval levels for this request
  currentApprovalLevel: number; // Current approval level (1-based)
  completedApprovalCount?: number; // Number of completed approvals
  husky_id?: string; // Add husky_id property (optional)
}

interface ApprovalWorkflowProps {
  requests: Request[];
  onRefresh?: () => void;
}

export const ApprovalWorkflow = ({ requests, onRefresh }: ApprovalWorkflowProps) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Rejection dialog state
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestToReject, setRequestToReject] = useState<Request | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('Fetching all users...');
      const usersData = await apiService.getAllUsers();
      console.log('Received users data:', usersData);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getApproverDetails = (approverId: number) => {
    const user = users.find(user => user.id === approverId);
    return user || null;
  };

  const getApproverName = (approverId: number) => {
    const user = users.find(user => user.id === approverId);
    return user?.name || `User ID: ${approverId}`;
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return { label: "Approved", color: "bg-green-100 text-green-800" };
      case -1: return { label: "Rejected", color: "bg-red-100 text-red-800" };
      case 0: return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
      default: return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setIsProcessing(requestId);
      
      // Find the request to get the approval ID
      const request = requests.find(req => req.id === requestId);
      console.log('Found request for approval:', request);
      
      if (!request || !request.approvalId) {
        throw new Error("Approval ID not found for this request");
      }

      console.log('Calling updateHuskyApproval with ID:', request.approvalId, 'status: APproved');
      
      // Call the update husky approval API
      await apiService.updateHuskyApproval(request.approvalId, {
        status: 'Approved' // 1 for approved as specified
      });

      toast({
        title: "Request Approved",
        description: `Request ${requestId} has been approved successfully.`,
      });

      // Call the refresh callback to update the data
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to approve request:", error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = (requestId: string) => {
    // Find the request and open rejection dialog
    const request = requests.find(req => req.id === requestId);
    if (request) {
      setRequestToReject(request);
      setIsRejectionDialogOpen(true);
      setRejectionReason("");
    }
  };

  const handleRejectWithReason = async () => {
    if (!requestToReject || !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(requestToReject.id);
      
      console.log('Found request for rejection:', requestToReject);
      
      if (!requestToReject.approvalId) {
        throw new Error("Approval ID not found for this request");
      }

      console.log('Calling updateHuskyApproval with ID:', requestToReject.approvalId, 'status: Rejected, reason:', rejectionReason);

      // Call the update husky approval API with rejection reason
      await apiService.updateHuskyApproval(requestToReject.approvalId, {
        status: 'Rejected', // -1 for rejected as specified
        reason: rejectionReason.trim()
      });

      toast({
        title: "Request Rejected",
        description: `Request ${requestToReject.id} has been rejected.`,
      });

      // Close the rejection dialog
      setIsRejectionDialogOpen(false);
      setRequestToReject(null);
      setRejectionReason("");

      // Call the refresh callback to update the data
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleViewDetails = (request: Request) => {
    console.log('Viewing details for request:', request);
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const approvalSteps = [
    { level: 1, title: "Manager Review", description: "Initial review by direct manager" },
    { level: 2, title: "Director Approval", description: "Department director approval" },
    { level: 3, title: "VP Approval", description: "Vice President final approval" }
  ];

  // Helper function to get the current step title
  const getCurrentStepTitle = (level: number) => {
    const stepTitles: { [key: number]: string } = {
      1: "1st Level Review",
      2: "2nd Level Review",
      3: "3rd Level Review",
      4: "4th Level Review",
      5: "5th Level Review"
    };
    return stepTitles[level] || `Level ${level} Review`;
  };

  // Helper function to render progress bars
  const renderProgressBars = (currentLevel: number, totalLevels: number, completedCount?: number) => {
    const bars = [];
    for (let i = 1; i <= totalLevels; i++) {
      let barColor = "bg-gray-200"; // Future levels (not reached)
      
      // If we have completed count info, use it; otherwise fall back to current level logic
      if (completedCount !== undefined) {
        if (i <= completedCount) {
          barColor = "bg-green-500"; // Completed levels
        } else if (i === currentLevel) {
          barColor = "bg-yellow-500"; // Current level
        }
      } else {
        // Fallback logic
        if (i < currentLevel) {
          barColor = "bg-green-500"; // Completed levels
        } else if (i === currentLevel) {
          barColor = "bg-yellow-500"; // Current level
        }
      }
      
      bars.push(
        <div key={i} className={`flex-1 h-2 rounded ${barColor}`} />
      );
      
      // Add spacer between bars (except for the last one)
      if (i < totalLevels) {
        bars.push(
          <div key={`spacer-${i}`} className="w-1" />
        );
      }
    }
    return bars;
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {requests.map((request) => (
        <Card key={request.id} className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  {request.husky_id && (
                    <Badge variant="outline" className="text-xs">
                      {request.husky_id}
                    </Badge>
                  )}
                </div>
                <CardDescription>{request.description}</CardDescription>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-blue-600 text-white">
                        {request.requester.split(' ')[0][0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">{request.requester}</span>
                  </div>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{request.createdAt}</span>
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </div>
                            <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleViewDetails(request)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Current Approval Step */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Current Step: {getCurrentStepTitle(request.currentApprovalLevel)}
                </span>
                <span className="text-xs text-gray-500">
                  Step {request.currentApprovalLevel} of {request.approvalCount}
                </span>
              </div>
              <div className="flex mb-2">
                {renderProgressBars(request.currentApprovalLevel, request.approvalCount, request.completedApprovalCount)}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing === request.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isProcessing === request.id ? "Processing..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing === request.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isProcessing === request.id ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
            <p className="text-gray-500">There are no requests waiting for your approval at this time.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Husky Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Request Details</span>
              {selectedRequest?.husky_id && (
                <Badge variant="outline" className="text-xs">
                  {selectedRequest.husky_id}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information about the husky request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Title</h4>
                  <p className="text-sm">{selectedRequest.title}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Platform</h4>
                  <p className="text-sm">{selectedRequest.platform}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Status</h4>
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Priority</h4>
                  <Badge variant="secondary">{selectedRequest.priority}</Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Requester</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-blue-600 text-white">
                        {selectedRequest.requester.split(' ')[0][0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedRequest.requester}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Created At</h4>
                  <p className="text-sm">{selectedRequest.createdAt}</p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Description</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {selectedRequest.description}
                </p>
              </div>

              <Separator />

              {/* Approval Progress */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Approval Progress</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Current Step: {getCurrentStepTitle(selectedRequest.currentApprovalLevel)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Step {selectedRequest.currentApprovalLevel} of {selectedRequest.approvalCount}
                    </span>
                  </div>
                  <div className="flex">
                    {renderProgressBars(selectedRequest.currentApprovalLevel, selectedRequest.approvalCount, selectedRequest.completedApprovalCount)}
                  </div>
                  
                  {/* Detailed Approvers Information */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-sm text-gray-700">Approval Details</h5>
                    </div>
                    
                    {/* Basic Approval Information from Request Object */}
                    <div className="bg-blue-50 p-3 rounded border">
                      <h6 className="font-semibold text-sm text-blue-800 mb-2">Basic Approval Information</h6>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Current Level:</span>
                          <span className="font-medium">{selectedRequest.currentApprovalLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Total Levels:</span>
                          <span className="font-medium">{selectedRequest.approvalCount}</span>
                        </div>
                        {selectedRequest.completedApprovalCount !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-blue-700">Completed:</span>
                            <span className="font-medium">{selectedRequest.completedApprovalCount}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Show approval levels even without detailed data */}
                      <div className="mt-3">
                        <h6 className="font-medium text-sm text-blue-700 mb-2 block">Approval Levels:</h6>
                        <div className="space-y-2">
                          {Array.from({ length: selectedRequest.approvalCount }, (_, i) => {
                            const level = i + 1;
                            const isCompleted = selectedRequest.completedApprovalCount ? level <= selectedRequest.completedApprovalCount : level < selectedRequest.currentApprovalLevel;
                            const isCurrent = level === selectedRequest.currentApprovalLevel;
                            
                            return (
                              <div key={level} className={`flex items-center space-x-3 p-2 rounded ${
                                isCompleted ? 'bg-green-50' : isCurrent ? 'bg-orange-50' : 'bg-gray-50'
                              }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                  isCompleted ? 'bg-green-500 text-white' : 
                                  isCurrent ? 'bg-yellow-500 text-white' : 
                                  'bg-gray-300 text-gray-600'
                                }`}>
                                  {level}
                                </div>
                                <span className="text-sm font-medium">
                                  {getCurrentStepTitle(level)}
                                </span>
                                <div className="ml-auto">
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : isCurrent ? (
                                    <Clock className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full bg-gray-300" />
                                  )}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Pending'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Dialog */}
              <Separator />
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleApprove(selectedRequest.id);
                    setIsDetailsOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing === selectedRequest.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isProcessing === selectedRequest.id ? "Processing..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    handleReject(selectedRequest.id);
                  }}
                  disabled={isProcessing === selectedRequest.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isProcessing === selectedRequest.id ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>Reject Request</span>
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will help the requester understand the decision.
            </DialogDescription>
          </DialogHeader>

          {requestToReject && (
            <div className="space-y-4">
              {/* Request Info */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium text-sm text-gray-800">{requestToReject.title}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {requestToReject.husky_id || requestToReject.id}
                    </Badge>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{requestToReject.requester}</span>
                  </div>
                </div>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-sm font-medium">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Please explain why this request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 text-right">
                  {rejectionReason.length}/500 characters
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectionDialogOpen(false);
                setRequestToReject(null);
                setRejectionReason("");
              }}
              disabled={isProcessing === requestToReject?.id}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectWithReason}
              disabled={!rejectionReason.trim() || isProcessing === requestToReject?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isProcessing === requestToReject?.id ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
