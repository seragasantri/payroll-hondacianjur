import { Link, usePage } from '@inertiajs/react';
import { Briefcase, HeartPulse, KeyRoundIcon, LayoutGrid, ShieldCheckIcon, Users, Folder, UserCog, Wallet } from 'lucide-react';
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
import employees from '@/routes/employees';
import permissions from '@/routes/permissions';
import roles from '@/routes/roles';
import tunjangan from '@/routes/tunjangan';
import users from '@/routes/users';
import divisi from '@/routes/divisi';
import jabatan from '@/routes/jabatan';
import payroll from '@/routes/payroll';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { NavManajemenUsers } from './nav-manajemen-users';
import { NavMasterData } from './nav-master-data';

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
        }
    ];
    const masterDataNavItems: NavItem[] = [
        {
            title: 'Karyawan',
            href: employees.index().url,
            icon: Briefcase,
            show: isSuperAdmin || can('employees.view any') || can('employees.view')
        },
        {
            title: 'Divisi',
            href: divisi.index().url,
            icon: Folder,
            show: isSuperAdmin || can('divisi.view any') || can('divisi.view')
        },
        {
            title: 'Jabatan',
            href: jabatan.index().url,
            icon: UserCog,
            show: isSuperAdmin || can('jabatan.view any') || can('jabatan.view')
        },
        {
            title: 'Tunjangan',
            href: tunjangan.index().url,
            icon: HeartPulse,
            show: isSuperAdmin || can('tunjangan.view any') || can('tunjangan.view')
        },
        {
            title: 'Payroll',
            href: payroll.index().url,
            icon: Wallet,
            show: isSuperAdmin || can('payroll.view any') || can('payroll.view')
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

                <NavMasterData items={masterDataNavItems} />
                <NavManajemenUsers items={settingNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
