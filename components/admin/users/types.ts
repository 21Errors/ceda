export interface AdminRoleOption {
  id: string;
  key: string;
  name: string;
}

export interface AdminUserTableRow {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAtIso: string;
  createdAtLabel: string;
  currentRoles: readonly AdminRoleOption[];
  availableRoles: readonly AdminRoleOption[];
}
