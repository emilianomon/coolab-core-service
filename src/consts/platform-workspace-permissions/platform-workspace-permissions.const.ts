type Role = 'admin' | 'member' | 'owner';
type Feature = 'workspaceManagement';

export const platformWorkspacePermissions: Record<Role, Record<Feature, boolean>> = {
  admin: {
    workspaceManagement: true,
  },
  member: {
    workspaceManagement: false,
  },
  owner: {
    workspaceManagement: true,
  },
};
