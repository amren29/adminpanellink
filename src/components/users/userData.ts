export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff' | 'viewer';
    department?: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
    lastLogin?: string; // ISO date
    createdAt: string; // ISO date
}

export const roleLabels: Record<User['role'], string> = {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff',
    viewer: 'Viewer',
};

export const roleColors: Record<User['role'], 'primary' | 'success' | 'warning' | 'info'> = {
    admin: 'primary',
    manager: 'success',
    staff: 'warning',
    viewer: 'info',
};

export const sampleUsers: User[] = [];

export const departments = [
    "Management",
    "Sales",
    "Production",
    "Design",
    "Finance",
    "IT",
];

export const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};
