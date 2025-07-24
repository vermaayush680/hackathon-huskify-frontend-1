// API Configuration and Service Layer
import { getCurrentPlatform } from '@/utils/platform';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  empId: number;
  roleId: number;
}

export interface HuskyRequest {
  id?: number;
  title: string;
  jd_p1?: string;
  jd_p2?: string;
  jd_p3?: string;
  experience_level?: string;
  grade?: string;
  priority: number;
  job_family_id: number;
  lab_id: number;
  feature_team_id: number;
  business_description?: string;
  platform_id?: number;
  created_by_user_id?: number;
}

export interface HuskyApproval {
  id?: number;
  husky_id: number;
  approver_id: number;
  level: number;
  status: string;
  reason?: string;
}

export interface JobFamily {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  husky_count: number;
}

export interface Lab {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureTeam {
  id: number;
  name: string;
  lab_id: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalHusky: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  requestsByDepartment: Array<{ department: string; count: number }>;
  requestStatusCounts: Array<{ status: string; count: number }>;
}

// API Service Class
class ApiService {
  private token: string | null = null;
  private platformName: string = 'Engineering'; // Default platform
  private unauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Method to set callback for handling 401 responses
  setUnauthorizedCallback(callback: () => void): void {
    this.unauthorizedCallback = callback;
  }

  private getHeaders(includeAuth = true, includePlatform = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (includePlatform) {
      // Get platform from URL or fallback to stored platform
      const currentPlatform = getCurrentPlatform();
      if (currentPlatform) {
        headers['Platform'] = currentPlatform;
      } else {
        headers['Platform'] = 'Engineering'; // Default fallback
      }
    }

    return headers;
  }

  private getPlatformHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': 'test1234'
    };
  }

  private async handleResponse<T>(response: Response, extractData: boolean = true): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If extractData is false, return the full response (for login which has user_role, user, etc.)
    if (!extractData) {
      return data;
    }
    
    // Otherwise, extract the data property if it exists
    return data.data || data;
  }

  // Helper method to decode JWT token
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  // Authentication APIs
  async login(credentials: LoginCredentials): Promise<{ token: string; userRole: number; user: string; userId: number; platformId: number }> {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: this.getHeaders(false, true),
      body: JSON.stringify(credentials),
    });

    const result = await this.handleResponse<{ 
      data: string; 
      userRole: number; 
      userId: number; 
      platformId: number; 
      name: string; 
      message: string 
    }>(response, false);
    
    this.token = result.data;
    
    // Store all the values from the backend response
    localStorage.setItem('authToken', this.token!);
    localStorage.setItem('userId', result.userId?.toString() || '1');
    localStorage.setItem('userRole', result.userRole?.toString() || '1');
    localStorage.setItem('platformId', result.platformId?.toString() || '1');
    localStorage.setItem('userName', result.name || 'Unknown User');
    localStorage.setItem('userEmail', credentials.email);
    
    // Decode JWT to extract roleId which is not in the direct response
    const decodedToken = this.decodeJWT(this.token);
    const roleId = decodedToken?.roleId || result.userRole || 1;
    localStorage.setItem('roleId', roleId.toString());
    
    return { 
      token: this.token!, 
      userRole: result.userRole || 1, 
      user: result.name || 'Unknown User',
      userId: result.userId || 1,
      platformId: result.platformId || 1
    };
  }

  async register(userData: RegisterData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/create`, {
      method: 'POST',
      headers: this.getHeaders(false, true),
      body: JSON.stringify(userData),
    });

    return this.handleResponse(response);
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('platformId');
    localStorage.removeItem('roleId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
  }

  // Husky APIs
  async createHusky(huskyData: HuskyRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(huskyData),
    });

    return this.handleResponse(response);
  }

  async getAllHuskies(params: {
    search?: string;
    job_family?: string;
    created_by_user?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ data: any[]; total: number; page: number; pageSize: number }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/husky?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse<{ data: any[]; total: number; page: number; pageSize: number; message: string }>(response, false);
    return {
      data: result.data || [],
      total: result.total || 0,
      page: result.page || 1,
      pageSize: result.pageSize || 20
    };
  }

  async getHuskyById(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async updateHusky(id: number, huskyData: Partial<HuskyRequest>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(huskyData),
    });

    return this.handleResponse(response);
  }

  async deleteHusky(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/husky/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    await this.handleResponse(response);
  }

  async checkDuplicateHusky(huskyData: Partial<HuskyRequest>): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/husky/duplicate-check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(huskyData),
    });

    return this.handleResponse(response);
  }

  async getHuskiesByUser(userId: number, page = 1, pageSize = 10): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky/user/${userId}?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse<{ data: any[]; total: number; page: number; pageSize: number; message: string }>(response, false);
    return {
      data: result.data || [],
      total: result.total || 0,
      page: result.page || 1,
      pageSize: result.pageSize || 20
    };
  }

  // Approval APIs
  async createHuskyApproval(approvalData: HuskyApproval): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(approvalData),
    });

    return this.handleResponse(response);
  }

  async createBulkHuskyApprovals(approvalRequests: Array<{
    huskyId: number;
    approverId: number; 
    level: number;
  }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(approvalRequests),
    });

    return this.handleResponse(response);
  }

  async getAllHuskyApprovals(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getHuskyApprovalByHuskyId(huskyId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval/${huskyId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async updateHuskyApproval(id: number, approvalData: Partial<HuskyApproval>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(approvalData),
    });

    return this.handleResponse(response);
  }

  async getHuskyApprovalByUser(userId?: number): Promise<any[]> {
    const url = userId 
      ? `${API_BASE_URL}/api/husky-approval/user/${userId}`
      : `${API_BASE_URL}/api/husky-approval/user/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Approval workflow methods
  async approveHusky(huskyId: number, approvalData: { approver_id: number; comment: string; status: number }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        husky_id: huskyId,
        approver_id: approvalData.approver_id,
        comment: approvalData.comment,
        status: approvalData.status,
      }),
    });

    return this.handleResponse(response);
  }

  async rejectHusky(huskyId: number, approvalData: { approver_id: number; comment: string; status: number }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/husky-approval`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        husky_id: huskyId,
        approver_id: approvalData.approver_id,
        comment: approvalData.comment,
        status: approvalData.status,
      }),
    });

    return this.handleResponse(response);
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalHusky, pendingApproval, approved, rejected, requestsByDepartment, requestStatusCounts] = await Promise.all([
      this.getTotalHuskyCreated(),
      this.getPendingApprovalCount(),
      this.getApprovedCount(),
      this.getRejectedCount(),
      this.getRequestsCountByDepartment(),
      this.getRequestStatusCounts(),
    ]);

    return {
      totalHusky,
      pendingApproval,
      approved,
      rejected,
      requestsByDepartment,
      requestStatusCounts,
    };
  }

private async getTotalHuskyCreated(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/total-husky`, {
        method: 'GET',
        headers: this.getHeaders(),
    });
    const result = await this.handleResponse<{ data: number; message: string }>(response, false);
    return result.data;
}

private async getPendingApprovalCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/pending-approval`, {
        method: 'GET',
        headers: this.getHeaders(),
    });
    const result = await this.handleResponse<{ data: number; message: string }>(response, false);
    return result.data;
}

private async getApprovedCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/approved`, {
        method: 'GET',
        headers: this.getHeaders(),
    });
    const result = await this.handleResponse<{ data: number; message: string }>(response, false);
    return result.data;
}

private async getRejectedCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/rejected`, {
        method: 'GET',
        headers: this.getHeaders(),
    });
    const result = await this.handleResponse<{ data: number; message: string }>(response, false);
    return result.data;
}

  private async getRequestsCountByDepartment(): Promise<Array<{ department: string; count: number }>> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/requests-by-department`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  private async getRequestStatusCounts(): Promise<Array<{ status: string; count: number }>> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/request-status-counts`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Platform management
  setPlatform(platformName: string): void {
    this.platformName = platformName;
    localStorage.setItem('currentPlatform', platformName);
  }

  getPlatform(): string {
    return localStorage.getItem('currentPlatform') || this.platformName;
  }

  // User management
  async getAllUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getUserById(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Get all available platforms
  async getAllPlatforms(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/platform`, {
      method: 'GET',
      headers: this.getPlatformHeaders(),
    });

    const result = await this.handleResponse(response);
    return Array.isArray(result) ? result : (result as any)?.data || [];
  }

  // Get all job families
  async getJobFamilies(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/job-family`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse(response);
    return Array.isArray(result) ? result : (result as any)?.data || [];
  }

  // Get all labs
  async getLabs(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/lab`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse(response);
    return Array.isArray(result) ? result : (result as any)?.data || [];
  }

  // Get all feature teams
  async getFeatureTeams(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/feature-team`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse(response);
    return Array.isArray(result) ? result : (result as any)?.data || [];
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current user info from localStorage
  getCurrentUser(): { 
    id: number; 
    role: number; 
    roleId: number;
    platformId: number;
    name: string; 
    email?: string;
    token?: string;
  } | null {
    const id = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    const roleId = localStorage.getItem('roleId');
    const platformId = localStorage.getItem('platformId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('authToken');
    
    if (role && name) {
      return { 
        id: id ? parseInt(id) : 1, 
        role: parseInt(role), 
        roleId: roleId ? parseInt(roleId) : parseInt(role),
        platformId: platformId ? parseInt(platformId) : 1,
        name,
        email: email || undefined,
        token: token || undefined
      };
    }
    
    return null;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
