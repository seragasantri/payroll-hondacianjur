export type User = {
    id: number;
    name: string;
    username: string;
    email?: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
    roles?: string[]; // Array of role names from backend
    can: Record<string, boolean>;
    is_super_admin?: boolean; // Whether user has Super Admin role
};

export type UserList = {
    data: User[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
};

export type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions?: Array<{
        id: number;
        name: string;
        module: string;
    }>;
};

export type RoleList = {
    data: Role[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
};

export type Permission = {
    id: number;
    name: string;
    guard_name: string;
    module: string;
    roles?: Array<{
        id: number;
        name: string;
    }>;
};

export type PermissionList = {
    data: Permission[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};

export interface ShareData {
    nama: string;
    quote: [message: string, author: string];
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}
