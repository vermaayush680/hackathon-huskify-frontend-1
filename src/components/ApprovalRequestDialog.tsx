import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Users } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface ApprovalRequest {
  id: string;
  approverId: string;
  approverName: string;
  level: number;
}

interface ApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  huskyId: string;
  huskyTitle: string;
  onApprovalRequestsCreated?: () => void;
}

export const ApprovalRequestDialog = ({ 
  open, 
  onOpenChange, 
  huskyId, 
  huskyTitle, 
  onApprovalRequestsCreated 
}: ApprovalRequestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [existingApprovals, setExistingApprovals] = useState<any[]>([]);
  const [loadingExistingApprovals, setLoadingExistingApprovals] = useState(false);
  const { toast } = useToast();

  const levelLabels = {
    1: "Level 1",
    2: "Level 2", 
    3: "Level 3",
    4: "Level 4",
    5: "Level 5"
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchExistingApprovals();
      // Reset approval requests when dialog opens
      setApprovalRequests([]);
    }
  }, [open, huskyId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await apiService.getAllUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchExistingApprovals = async () => {
    try {
      setLoadingExistingApprovals(true);
      const approvalsData = await apiService.getHuskyApprovalByHuskyId(parseInt(huskyId));
      setExistingApprovals(approvalsData || []);
    } catch (error) {
      console.error('Failed to fetch existing approvals:', error);
      // Don't show error toast for this as it's not critical
      setExistingApprovals([]);
    } finally {
      setLoadingExistingApprovals(false);
    }
  };

  const addApprovalRequest = () => {
    const totalApprovals = approvalRequests.length + existingApprovals.length;
    if (totalApprovals >= 5) {
      toast({
        title: "Maximum Limit Reached",
        description: `You can only have maximum 5 total approvers. Currently you have ${existingApprovals.length} existing and ${approvalRequests.length} new approval requests.`,
        variant: "destructive",
      });
      return;
    }

    if (approvalRequests.length >= 5) {
      toast({
        title: "Maximum Limit Reached",
        description: "You can add maximum 5 new approvers at once.",
        variant: "destructive",
      });
      return;
    }

    const newRequest: ApprovalRequest = {
      id: Date.now().toString(),
      approverId: "",
      approverName: "",
      level: 1
    };

    setApprovalRequests([...approvalRequests, newRequest]);
  };

  const removeApprovalRequest = (id: string) => {
    setApprovalRequests(approvalRequests.filter(req => req.id !== id));
  };

  const updateApprovalRequest = (id: string, field: keyof ApprovalRequest, value: any) => {
    setApprovalRequests(approvalRequests.map(req => {
      if (req.id === id) {
        const updatedReq = { ...req, [field]: value };
        
        // If approverId is being updated, also update approverName
        if (field === 'approverId') {
          const selectedUser = users.find(user => user.id.toString() === value);
          updatedReq.approverName = selectedUser?.name || "";
        }
        
        return updatedReq;
      }
      return req;
    }));
  };

  const validateRequests = () => {
    if (approvalRequests.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one approver.",
        variant: "destructive",
      });
      return false;
    }

    const incompleteRequests = approvalRequests.filter(req => !req.approverId);
    if (incompleteRequests.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select approver for all requests.",
        variant: "destructive",
      });
      return false;
    }

    // Check for duplicate approvers
    const approverIds = approvalRequests.map(req => req.approverId);
    const uniqueApproverIds = new Set(approverIds);
    if (approverIds.length !== uniqueApproverIds.size) {
      toast({
        title: "Validation Error",
        description: "Each approver can only be selected once.",
        variant: "destructive",
      });
      return false;
    }

    // Check for duplicate levels
    const levels = approvalRequests.map(req => req.level);
    const uniqueLevels = new Set(levels);
    if (levels.length !== uniqueLevels.size) {
      toast({
        title: "Validation Error",
        description: "Each approval level can only be used once.",
        variant: "destructive",
      });
      return false;
    }

    // Check for duplicate levels with existing approvals
    const existingLevels = existingApprovals.map(approval => approval.level);
    const conflictingLevels = levels.filter(level => existingLevels.includes(level));
    if (conflictingLevels.length > 0) {
      toast({
        title: "Validation Error",
        description: `Approval level(s) ${conflictingLevels.join(', ')} already exist for this request.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return { label: "Approved", color: "bg-green-100 text-green-800" };
      case -1: return { label: "Rejected", color: "bg-red-100 text-red-800" };
      case 0: return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
      default: return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
  };

  const getApproverName = (approverId: number) => {
    const user = users.find(user => user.id === approverId);
    return user?.name || `User ID: ${approverId}`;
  };

  const getApproverDetails = (approverId: number) => {
    const user = users.find(user => user.id === approverId);
    return user || null;
  };

  const handleSubmit = async () => {
    if (!validateRequests()) {
      return;
    }

    try {
      setIsLoading(true);

      // Create bulk approval requests
      const bulkApprovalData = approvalRequests.map(request => ({
        huskyId: parseInt(huskyId),
        approverId: parseInt(request.approverId), 
        level: request.level
      }));

      await apiService.createBulkHuskyApprovals(bulkApprovalData);

      toast({
        title: "Approval Requests Created",
        description: `Successfully created ${approvalRequests.length} approval request(s).`,
      });

      // Reset and close dialog
      setApprovalRequests([]);
      onOpenChange(false);

      // Callback to refresh parent component
      if (onApprovalRequestsCreated) {
        onApprovalRequestsCreated();
      }

    } catch (error) {
      console.error('Failed to create approval requests:', error);
      toast({
        title: "Error",
        description: "Failed to create approval requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableUsers = (currentRequestId: string) => {
    const selectedApproverIds = approvalRequests
      .filter(req => req.id !== currentRequestId && req.approverId)
      .map(req => req.approverId);
    
    return users.filter(user => !selectedApproverIds.includes(user.id.toString()));
  };

  const getAvailableLevels = (currentRequestId: string) => {
    const selectedLevels = approvalRequests
      .filter(req => req.id !== currentRequestId)
      .map(req => req.level);
    
    // Also exclude levels that already exist in existing approvals
    const existingLevels = existingApprovals.map(approval => approval.level);
    const usedLevels = [...selectedLevels, ...existingLevels];
    
    return [1, 2, 3, 4, 5].filter(level => !usedLevels.includes(level));
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setApprovalRequests([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Request Approvals</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Info */}
          <div className="bg-blue-50 p-4 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-800">Request Details</Label>
              <div className="space-y-1">
                <p className="font-medium text-blue-900">{huskyTitle}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    Husky ID: {huskyId}
                  </Badge>
                  {!loadingExistingApprovals && (
                    <Badge variant="secondary" className="text-xs">
                      {existingApprovals.length} existing approval(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Existing Approvals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Current Approval Requests</Label>
              {loadingExistingApprovals && (
                <div className="text-sm text-gray-500">Loading...</div>
              )}
            </div>

            {existingApprovals.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border">
                <p className="text-gray-500 text-sm">
                  {loadingExistingApprovals ? "Loading existing approvals..." : "No approval requests found for this request"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {existingApprovals.map((approval, index) => {
                  const statusInfo = getStatusLabel(approval.status);
                  const approverDetails = getApproverDetails(approval.approver_id);
                  return (
                    <div key={approval.id || index} className="p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-xs font-medium">
                            Level {approval.level}
                          </Badge>
                          <Badge 
                            className={`text-xs ${statusInfo.color}`}
                            variant="secondary"
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {approval.created_at && (
                            <div>Created: {new Date(approval.created_at).toLocaleDateString()}</div>
                          )}
                          {approval.updated_at && approval.updated_at !== approval.created_at && (
                            <div>Updated: {new Date(approval.updated_at).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Detailed Approver Information */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Approver Details</span>
                            {approverDetails && (
                              <Badge variant="secondary" className="text-xs">
                                ID: {approverDetails.id}
                              </Badge>
                            )}
                          </div>
                          
                          {approverDetails ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-600">Name:</span>
                                  <span className="text-gray-900">{approverDetails.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-600">Email:</span>
                                  <span className="text-gray-900">{approverDetails.email}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {approverDetails.role && (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-600">Role:</span>
                                    <span className="text-gray-900">{approverDetails.role}</span>
                                  </div>
                                )}
                                {approverDetails.department && (
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-600">Department:</span>
                                    <span className="text-gray-900">{approverDetails.department}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Approver:</span> User ID: {approval.approver_id} (Details not available)
                            </div>
                          )}
                          
                          {/* Approval Level Description */}
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-600 text-xs">Approval Level:</span>
                              <span className="text-xs text-blue-600 font-medium">
                                {levelLabels[approval.level as keyof typeof levelLabels] || `Level ${approval.level}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Information */}
                      {approval.status !== 0 && approval.updated_at && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">
                              {approval.status === 1 ? 'Approved' : 'Rejected'} on:
                            </span>
                            <span className="ml-2">
                              {new Date(approval.updated_at).toLocaleDateString()} at {new Date(approval.updated_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Approval Requests Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-lg font-semibold">Add New Approval Requests</Label>
                <p className="text-sm text-gray-600">
                  Add additional approvers (total limit: 5 approvers including existing ones)
                </p>
                {existingApprovals.length > 0 && (
                  <p className="text-xs text-blue-600">
                    Currently {existingApprovals.length} existing approval(s), you can add {5 - existingApprovals.length} more
                  </p>
                )}
              </div>
              <Button
                onClick={addApprovalRequest}
                disabled={
                  (approvalRequests.length + existingApprovals.length) >= 5 || 
                  loadingUsers || 
                  loadingExistingApprovals
                }
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Approver</span>
              </Button>
            </div>

            {approvalRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No approvers added yet</p>
                <p className="text-sm text-gray-400">Click "Add Approver" to start adding approval requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvalRequests.map((request, index) => (
                  <div key={request.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <Label className="text-sm font-medium">
                        Approver #{index + 1}
                      </Label>
                      <Button
                        onClick={() => removeApprovalRequest(request.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Approver *</Label>
                        <Select 
                          value={request.approverId} 
                          onValueChange={(value) => updateApprovalRequest(request.id, 'approverId', value)}
                          disabled={loadingUsers}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select approver"} />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableUsers(request.id).map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <span>{user.name}</span>
                                  <span className="text-xs text-gray-500">({user.email})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Approval Level *</Label>
                        <Select 
                          value={request.level.toString()} 
                          onValueChange={(value) => updateApprovalRequest(request.id, 'level', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableLevels(request.id).map((level) => (
                              <SelectItem key={level} value={level.toString()}>
                                <div className="flex items-center space-x-2">
                                  <span>Level {level}</span>
                                  <span className="text-xs text-gray-500">
                                    ({levelLabels[level as keyof typeof levelLabels]})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {request.approverName && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {request.approverName}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Level {request.level} - {levelLabels[request.level as keyof typeof levelLabels]}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {approvalRequests.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Approval requests will be created with "Pending" status. 
                  Approvers will need to review and approve/reject these requests.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleDialogClose(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || approvalRequests.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? `Creating ${approvalRequests.length} Request(s)...` : `Create ${approvalRequests.length} Approval Request(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
