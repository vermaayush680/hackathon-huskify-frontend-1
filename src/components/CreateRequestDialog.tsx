import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, Trash2 } from "lucide-react";

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRequest?: (requestData: any) => void;
  editMode?: boolean;
  initialData?: {
    id?: string;
    title?: string;
    grade?: string;
    priority?: string;
    business_description?: string;
    experience_level?: string;
    jd_p1?: string;
    jd_p2?: string;
    jd_p3?: string;
    job_family_id?: string;
    lab_id?: string;
    feature_team_id?: string;
  };
  huskyId: string;
}
interface ApprovalRequest {
  id: string;
  approverId: string;
  approverName: string;
  level: number;
}

export const CreateRequestDialog = ({ open, onOpenChange, onCreateRequest, editMode = false, initialData, huskyId }: CreateRequestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState<any[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<any>(null);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
  const [showAvailableResources, setShowAvailableResources] = useState(false);
  const [jobFamilies, setJobFamilies] = useState<Array<{ value: string; label: string }>>([]);
  const [labs, setLabs] = useState<Array<{ value: string; label: string }>>([]);
  const [featureTeams, setFeatureTeams] = useState<Array<{ value: string; label: string }>>([]);
  const { toast } = useToast();
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [existingApprovals, setExistingApprovals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingExistingApprovals, setLoadingExistingApprovals] = useState(false);

  const levelLabels = {
    1: "Level 1",
    2: "Level 2",
    3: "Level 3",
    4: "Level 4",
    5: "Level 5"
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    grade: initialData?.grade || "",
    priority: initialData?.priority || "2",
    business_description: initialData?.business_description || "",
    experience_level: initialData?.experience_level || "Senior",
    jd_p1: initialData?.jd_p1 || "",
    jd_p2: initialData?.jd_p2 || "",
    jd_p3: initialData?.jd_p3 || "",
    job_family_id: initialData?.job_family_id || "2",
    lab_id: initialData?.lab_id || "1",
    feature_team_id: initialData?.feature_team_id || "1",
  });

  // Update form data when initialData changes or dialog opens
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        title: initialData.title || "",
        grade: initialData.grade || "",
        priority: initialData.priority || "2",
        business_description: initialData.business_description || "",
        experience_level: initialData.experience_level || "Senior",
        jd_p1: initialData.jd_p1 || "",
        jd_p2: initialData.jd_p2 || "",
        jd_p3: initialData.jd_p3 || "",
        job_family_id: initialData.job_family_id || "2",
        lab_id: initialData.lab_id || "1",
        feature_team_id: initialData.feature_team_id || "1",
      });
    } else if (open && !editMode) {
      // Reset form for new request
      setFormData({
        title: "",
        grade: "",
        priority: "2",
        business_description: "",
        experience_level: "Senior",
        jd_p1: "",
        jd_p2: "",
        jd_p3: "",
        job_family_id: "2",
        lab_id: "1",
        feature_team_id: "1",
      });
    }
  }, [open, initialData, editMode]);

  // Fetch job families, labs, and feature teams when component mounts or dialog opens
  useEffect(() => {
    // Only fetch data when dialog is open and data hasn't been loaded yet
    if (!open) return;

    // Check if data is already loaded to avoid unnecessary API calls
    if (jobFamilies.length > 0 && labs.length > 0 && featureTeams.length > 0) {
      return;
    }

    const fetchData = async () => {
      try {
        const [jobFamilyData, labData, featureTeamData] = await Promise.all([
          apiService.getJobFamilies(),
          apiService.getLabs(),
          apiService.getFeatureTeams()
        ]);

        // Format job families
        const formattedJobFamilies = jobFamilyData.map(family => ({
          value: family.id.toString(),
          label: family.name
        }));
        setJobFamilies(formattedJobFamilies);

        // Format labs
        const formattedLabs = labData.map(lab => ({
          value: lab.id.toString(),
          label: lab.name
        }));
        setLabs(formattedLabs);

        // Format feature teams
        const formattedFeatureTeams = featureTeamData.map(team => ({
          value: team.id.toString(),
          label: team.name
        }));
        setFeatureTeams(formattedFeatureTeams);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load dropdown data",
          variant: "destructive",
        });
        // Fallback to hardcoded values
        setJobFamilies([
          { value: "1", label: "Engineering" },
          { value: "2", label: "Product" },
          { value: "3", label: "Design" },
          { value: "4", label: "Marketing" },
          { value: "5", label: "Sales" },
          { value: "6", label: "Operations" }
        ]);
        setLabs([
          { value: "1", label: "Lab 1" },
          { value: "2", label: "Lab 2" }
        ]);
        setFeatureTeams([
          { value: "1", label: "Team A" },
          { value: "2", label: "Team B" }
        ]);
      }
    };

    fetchData();
  }, [open, jobFamilies.length, labs.length, featureTeams.length, toast]);

  // Helper function to determine badge variant for match percentage
  const getMatchVariant = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 70) return "default";
    return "secondary";
  };

  // Reset duplicate check state when dialog closes
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setShowDuplicates(false);
      setDuplicateResults([]);
      setSelectedDuplicate(null);
      setShowDuplicateDetails(false);
      setShowAvailableResources(false);
      setFormData({
        title: "",
        grade: "",
        priority: "2",
        business_description: "",
        experience_level: "Senior",
        jd_p1: "",
        jd_p2: "",
        jd_p3: "",
        job_family_id: "2",
        lab_id: "1",
        feature_team_id: "1",
      });
    }
    onOpenChange(isOpen);
  };

  const handleViewDuplicateDetails = (duplicate: any) => {
    setSelectedDuplicate(duplicate);
    setShowDuplicateDetails(true);
  };

  const handleCheckAvailableResources = () => {
    setShowAvailableResources(!showAvailableResources);

    if (!showAvailableResources) {
      toast({
        title: "Available Resources",
        description: "This feature is coming soon! We're working on showing matching team members.",
        variant: "default",
      });
    }
  };

  const grades = ["C", "D", "E", "F", "G", "H"];
  const experienceLevels = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead'];
  const priorities = [
    { value: "1", label: "Low" },
    { value: "2", label: "Medium" },
    { value: "3", label: "High" }
  ];

  const validationErrorMessagae = (formData) => {
    const requiredFields = {
      title: formData.title,
      jd_p1: formData.jd_p1,
      jd_p2: formData.jd_p2,
      jd_p3: formData.jd_p3,
      experience_level: formData.experience_level,
      grade: formData.grade,
      priority: formData.priority,
      job_family_id: formData.job_family_id,
      lab_id: formData.lab_id,
      feature_team_id: formData.feature_team_id,
      business_description: formData.business_description,
    };
    // Get names of missing fields
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key.replace(/_/g, ' ').toUpperCase());

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in the following required field(s): ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
  }

  // Helper function to check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.title &&
      formData.jd_p1 &&
      formData.jd_p2 &&
      formData.jd_p3 &&
      formData.experience_level &&
      formData.grade &&
      formData.priority &&
      formData.job_family_id &&
      formData.lab_id &&
      formData.feature_team_id &&
      formData.business_description
    );
  };

  const handleCheckDuplicates = async () => {
    validationErrorMessagae(formData)
    if (!formData.title || !formData.grade) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least Title and Grade to check for duplicates.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCheckingDuplicates(true);

      const checkData = {
        title: formData.title,
        jdP1: formData.jd_p1,
        jdP2: formData.jd_p2,
        jdP3: formData.jd_p3,
        experience: formData.experience_level,
        grade: formData.grade,
        priority: parseInt(formData.priority),
        jobFamilyId: parseInt(formData.job_family_id),
        labId: parseInt(formData.lab_id),
        featureTeamId: parseInt(formData.feature_team_id),
        businessDescription: formData.business_description,
        createdByUserId: parseInt(localStorage.getItem('userId') || '1'),
      };

      // Call the duplicate check API
      const results = await apiService.checkDuplicateHusky(checkData);

      setDuplicateResults(results || []);
      setShowDuplicates(true);

      if (results && results.length > 0) {
        toast({
          title: "Potential Duplicates Found",
          description: `Found ${results.length} similar request(s). Please review them below.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Duplicates Found",
          description: "No similar requests found. You can proceed with creating this request.",
        });
      }

    } catch (error) {
      console.error('Failed to check duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    validationErrorMessagae(formData)
    if (!validateRequests()) {
      return;
    }
    if (!formData.title || !formData.grade) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title and Grade).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const requestData = {
        title: formData.title,
        jd_p1: formData.jd_p1,
        jd_p2: formData.jd_p2,
        jd_p3: formData.jd_p3,
        experience_level: formData.experience_level,
        grade: formData.grade,
        priority: parseInt(formData.priority),
        job_family_id: parseInt(formData.job_family_id),
        lab_id: parseInt(formData.lab_id),
        feature_team_id: parseInt(formData.feature_team_id),
        business_description: formData.business_description,
      };

      if (editMode && initialData?.id) {
        // Update existing request

        const bulkApprovalData = approvalRequests.map(request => ({
          huskyId: parseInt(huskyId),
          approverId: parseInt(request.approverId),
          level: request.level
        }));

        await apiService.createBulkHuskyApprovals(bulkApprovalData);
        setApprovalRequests([]);
        await apiService.updateHusky(parseInt(initialData.id), requestData);

        toast({
          title: "Request Updated Successfully",
          description: "Your husky request has been updated.",
        });
      } else {
        // Create new request
        const response = await apiService.createHusky(requestData);

        // Create bulk approval requests
        const bulkApprovalData = approvalRequests.map(request => ({
          huskyId: parseInt(response?.id),
          approverId: parseInt(request.approverId),
          level: request.level
        }));

        await apiService.createBulkHuskyApprovals(bulkApprovalData);
        setApprovalRequests([]);

        toast({
          title: "Request Created Successfully",
          description: "Your husky request has been submitted for approval.",
        });
      }

      // Reset and close dialog
      onOpenChange(false);

      // Reset form and close dialog
      handleDialogClose(false);

      // Call the callback if provided (to refresh parent component)
      if (onCreateRequest) {
        onCreateRequest(requestData);
      }

    } catch (error) {
      console.error('Failed to create request:', error);
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
  const getAvailableUsers = (currentRequestId: string) => {
    const selectedApproverIds = approvalRequests
      .filter(req => req.id !== currentRequestId && req.approverId)
      .map(req => req.approverId);

    return users.filter(user => !selectedApproverIds.includes(user.id.toString()));
  };

  useEffect(() => {
    fetchUsers();
    // Reset approval requests when dialog opens
    setApprovalRequests([]);
    if (open && huskyId !== "") {
      fetchExistingApprovals();
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
  const getAvailableLevels = (currentRequestId: string) => {
    const selectedLevels = approvalRequests
      .filter(req => req.id !== currentRequestId)
      .map(req => req.level);

    // Also exclude levels that already exist in existing approvals
    const existingLevels = existingApprovals.map(approval => approval.level);
    const usedLevels = [...selectedLevels, ...existingLevels];

    return [1, 2, 3, 4, 5].filter(level => !usedLevels.includes(level));
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

  const removeApprovalRequest = (id: string) => {
    setApprovalRequests(approvalRequests.filter(req => req.id !== id));
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
  const getApproverDetails = (approverId: number) => {
    const user = users.find(user => user.id === approverId);
    return user || null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Husky Request" : "Create New Husky Request"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request Title *</Label>
              <Input
                placeholder="e.g., Senior Software Engineer - Platform Team"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade *</Label>
                <Select value={formData.grade} onValueChange={(grade) => setFormData({ ...formData, grade })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select value={formData.experience_level} onValueChange={(experience_level) => setFormData({ ...formData, experience_level })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={formData.priority} onValueChange={(priority) => setFormData({ ...formData, priority })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Job Family *</Label>
                <Select value={formData.job_family_id} onValueChange={(job_family_id) => setFormData({ ...formData, job_family_id })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job family" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobFamilies.map((family) => (
                      <SelectItem key={family.value} value={family.value}>
                        {family.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lab *</Label>
                <Select value={formData.lab_id} onValueChange={(lab_id) => setFormData({ ...formData, lab_id })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.value} value={lab.value}>
                        {lab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Feature Team *</Label>
                <Select value={formData.feature_team_id} onValueChange={(feature_team_id) => setFormData({ ...formData, feature_team_id })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feature team" />
                  </SelectTrigger>
                  <SelectContent>
                    {featureTeams.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Description *</Label>
              <Textarea
                placeholder="Describe the business need and justification"
                value={formData.business_description}
                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Job Description Details *</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Key Responsibilities (P1) *</Label>
                  <Input
                    placeholder="e.g., Backend development, API design"
                    value={formData.jd_p1}
                    onChange={(e) => setFormData({ ...formData, jd_p1: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Required Skills (P2) *</Label>
                  <Input
                    placeholder="e.g., Python, React, AWS"
                    value={formData.jd_p2}
                    onChange={(e) => setFormData({ ...formData, jd_p2: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Tech Stack/Tools (P3) *</Label>
                  <Input
                    placeholder="e.g., Node.js, Express, MySQL"
                    value={formData.jd_p3}
                    onChange={(e) => setFormData({ ...formData, jd_p3: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Existing Approvals Section */}
            {open && huskyId !== "" && <div className="space-y-4">
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
            </div>}

            {/* Appproval section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-lg font-semibold">Add New Approval Requests</Label>
                  <p className="text-sm text-gray-600">
                    Add additional approvers (total limit: 5 approvers including existing ones)
                  </p>
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

            {/* Duplicate Results Section */}
            {showDuplicates && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Duplicate Check Results ({duplicateResults.length} found)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDuplicates(false)}
                    >
                      Hide Results
                    </Button>
                  </div>

                  {duplicateResults.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="min-w-[300px]">Title</TableHead>
                            <TableHead className="min-w-[120px]">Husky ID</TableHead>
                            <TableHead className="min-w-[150px]">Created By</TableHead>
                            <TableHead className="min-w-[100px]">Match %</TableHead>
                            <TableHead className="w-[80px]">Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {duplicateResults.map((result: any, index: number) => {
                            const husky = result.husky || result;
                            const similarity = result.similarity || 0;
                            const matchPercentage = (similarity * 100).toFixed(2);

                            return (
                              <TableRow key={husky.id || index} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  <div
                                    title={husky.title}
                                    className="truncate max-w-[280px]"
                                  >
                                    {husky.title}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {husky.husky_id ? (
                                    <Badge variant="outline" className="text-xs">
                                      {husky.husky_id}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 text-xs">No ID</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {husky.user?.name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={getMatchVariant(parseFloat(matchPercentage))}
                                    className="font-mono text-xs"
                                  >
                                    {matchPercentage}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDuplicateDetails(result)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No duplicate requests found!</p>
                      <p className="text-sm">You can proceed with creating this request.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Available Resource Section */}
            {showAvailableResources && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Available Resources
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        Feature Preview
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAvailableResources(false)}
                      >
                        Hide Resources
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md p-8">
                    <div className="text-center space-y-3">
                      <div className="text-lg font-semibold text-gray-600">Available Resources</div>
                      <div className="text-2xl font-bold text-blue-600">Coming Soon</div>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        We're working on a feature to show available resources that match your request criteria.
                        This will help you find existing team members with similar skills.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isLoading || isCheckingDuplicates}
            >
              Cancel
            </Button>

            {editMode ? (
              // Edit mode: Show only update button, no duplicate checking
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Updating..." : "Update Request"}
              </Button>
            ) : !showDuplicates ? (
              <div className="flex space-x-2">
                <Button
                  onClick={handleCheckAvailableResources}
                  disabled={isLoading || isCheckingDuplicates}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  {showAvailableResources ? "Hide Resources" : "Available Resources"}
                </Button>
                <Button
                  onClick={handleCheckDuplicates}
                  disabled={!isFormValid() || isCheckingDuplicates}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isCheckingDuplicates ? "Checking..." : "Check Duplicates"}
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleCheckAvailableResources}
                  disabled={isLoading || isCheckingDuplicates}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  {showAvailableResources ? "Hide Resources" : "Available Resources"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckDuplicates}
                  disabled={isCheckingDuplicates || isLoading}
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  {isCheckingDuplicates ? "Checking..." : "Recheck"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Creating..." : "Create Request"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Details Dialog */}
      <Dialog open={showDuplicateDetails} onOpenChange={(open) => {
        if (!open) {
          setShowDuplicateDetails(false);
          setSelectedDuplicate(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duplicate Request Details</DialogTitle>
          </DialogHeader>

          {selectedDuplicate && (
            <div className="space-y-6">
              {(() => {
                const husky = selectedDuplicate.husky || selectedDuplicate;
                const similarity = selectedDuplicate.similarity || 0;
                const matchPercentage = (similarity * 100).toFixed(2);

                return (
                  <>
                    {/* Match Percentage Header */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Similarity Match</h3>
                        <Badge
                          variant={getMatchVariant(parseFloat(matchPercentage))}
                          className="text-lg font-mono px-3 py-1"
                        >
                          {matchPercentage}%
                        </Badge>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Title</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {husky.title}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Husky ID</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {husky.husky_id ? (
                            <Badge variant="outline">{husky.husky_id}</Badge>
                          ) : (
                            <span className="text-gray-400">No ID assigned</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Experience Level</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <Badge variant="secondary">{husky.experience_level}</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Grade</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <Badge variant="outline">{husky.grade}</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Created By</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {husky.user?.name || 'Unknown'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {husky.created_at ? new Date(husky.created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Job Description Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Job Description</h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Key Responsibilities</Label>
                          <div className="p-3 bg-gray-50 rounded border min-h-[80px] whitespace-pre-wrap">
                            {husky.jd_p1 || 'No key responsibilities specified'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Required Skills</Label>
                          <div className="p-3 bg-gray-50 rounded border min-h-[80px] whitespace-pre-wrap">
                            {husky.jd_p2 || 'No required skills specified'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Tech Stack & Additional Requirements</Label>
                          <div className="p-3 bg-gray-50 rounded border min-h-[80px] whitespace-pre-wrap">
                            {husky.jd_p3 || 'No tech stack specified'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {(husky.lab?.name || husky.platform?.name || husky.feature_team?.name) && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Assignment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {husky.lab?.name && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">Lab</Label>
                              <div className="p-2 bg-gray-50 rounded border">
                                <Badge variant="secondary">{husky.lab.name}</Badge>
                              </div>
                            </div>
                          )}

                          {husky.platform?.name && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">Platform</Label>
                              <div className="p-2 bg-gray-50 rounded border">
                                <Badge variant="secondary">{husky.platform.name}</Badge>
                              </div>
                            </div>
                          )}

                          {husky.feature_team?.name && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">Feature Team</Label>
                              <div className="p-2 bg-gray-50 rounded border">
                                <Badge variant="secondary">{husky.feature_team.name}</Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowDuplicateDetails(false);
                setSelectedDuplicate(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
