// Utility functions for accessing stored user data

export const getStoredUserId = (): number => {
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId) : 1;
};

export const getStoredUserRole = (): number => {
  const userRole = localStorage.getItem('userRole');
  return userRole ? parseInt(userRole) : 1;
};

export const getStoredRoleId = (): number => {
  const roleId = localStorage.getItem('roleId');
  return roleId ? parseInt(roleId) : getStoredUserRole();
};

export const getStoredPlatformId = (): number => {
  const platformId = localStorage.getItem('platformId');
  return platformId ? parseInt(platformId) : 1;
};

export const getStoredUserName = (): string => {
  return localStorage.getItem('userName') || 'Unknown User';
};

export const getStoredUserEmail = (): string => {
  return localStorage.getItem('userEmail') || '';
};

export const getStoredAuthToken = (): string => {
  return localStorage.getItem('authToken') || '';
};

export const getAllStoredUserData = () => {
  return {
    userId: getStoredUserId(),
    userRole: getStoredUserRole(),
    roleId: getStoredRoleId(),
    platformId: getStoredPlatformId(),
    userName: getStoredUserName(),
    userEmail: getStoredUserEmail(),
    authToken: getStoredAuthToken()
  };
};

export const clearAllStoredUserData = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('platformId');
  localStorage.removeItem('roleId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
};
