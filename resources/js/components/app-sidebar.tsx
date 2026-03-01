import { Link, usePage } from '@inertiajs/react';
import { KeyRound, KeyRoundIcon, LayoutGrid, ShieldCheckIcon, Users } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCan } from '@/hooks/useCan';
import { dashboard } from '@/routes';
import permissions from '@/routes/permissions';
import roles from '@/routes/roles';
import users from '@/routes/users';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { NavManajemenUsers } from './nav-manajemen-users';

export function AppSidebar() {
    const can = useCan();
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
            show: true
        },
        {
            title: 'Karyawan',
            href: '#',
            icon: Users,
            show: false
        },
    ];

    const settingNavItems: NavItem[] = [
        {
            title: 'Users',
            href: users.index().url,
            icon: Users,
            show: isSuperAdmin || can('users.view any') || can('users.view')
        },
        {
            title: 'Roles',
            href: roles.index().url,
            icon: ShieldCheckIcon,
            show: isSuperAdmin || can('roles.view any') || can('roles.view')
        },
        {
            title: 'Permissions',
            href: permissions.index().url,
            icon: KeyRoundIcon,
            show: isSuperAdmin || can('permissions.view any') || can('permissions.view')
        },

    ]
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                <NavManajemenUsers items={settingNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
