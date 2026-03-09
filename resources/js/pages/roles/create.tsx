import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index, store } from '@/routes/roles';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Roles',
        href: index().url
    },
    {
        title: 'Create',
        href: '#'
    }
];

// Module permissions configuration
const modulePermissions = {
    users: ['view', 'view any', 'create', 'edit', 'delete'],
    roles: ['view', 'view any', 'create', 'edit', 'delete'],
    permissions: ['view', 'view any', 'create', 'edit', 'delete'],
    settings: ['view', 'edit'],
};

const moduleLabels: Record<string, string> = {
    users: 'Users',
    roles: 'Roles',
    permissions: 'Permissions',
    settings: 'Settings',
};

const permissionLabels: Record<string, string> = {
    'view': 'View',
    'view any': 'View Any',
    'create': 'Create',
    'edit': 'Edit',
    'delete': 'Delete',
};

export default function RoleCreate() {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        permissions: [] as string[],
    });

    // Sync selectedPermissions ke form data
    useEffect(() => {
        setData('permissions', selectedPermissions);
    }, [selectedPermissions, setData]);

    const handlePermissionToggle = (permission: string) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permission)) {
                return prev.filter(p => p !== permission);
            } else {
                return [...prev, permission];
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(store().url, {
            onSuccess: () => {
                reset();
                setSelectedPermissions([]);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Role Baru" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                            Tambah Role Baru
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Isi formulir di bawah untuk membuat role baru</p>
                    </div>
                    <Link
                        href={index().url}
                        className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Kembali</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="border-2 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl shadow-blue-100/50 dark:shadow-none max-w-4xl mx-auto">
                    {/* Form Header */}
                    <div className='bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 px-6 py-4'>
                        <h2 className='text-xl font-bold text-white'>Informasi Role</h2>
                        <p className='text-blue-50 text-sm'>Lengkapi data role dengan benar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

                        {/* Nama Role */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <Shield className="size-3.5" />
                                </div>
                                Nama Role
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                placeholder="Contoh: Admin, Manager, Staff"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Permissions Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                Permissions
                            </div>

                            {/* Modules Grid - 4 modules per row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {Object.entries(modulePermissions).map(([module, perms]) => (
                                    <div key={module} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                        {/* Module Header */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                                                {moduleLabels[module] || module}
                                            </h3>
                                        </div>

                                        {/* Permissions List */}
                                        <div className="p-4 space-y-2">
                                            {perms.map((perm) => {
                                                const fullPermission = `${module}.${perm}`;
                                                const isSelected = selectedPermissions.includes(fullPermission);

                                                return (
                                                    <label
                                                        key={fullPermission}
                                                        className={`
                                                            flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                                                            transition-all duration-200 border-2
                                                            ${isSelected
                                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400'
                                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                                            }
                                                        `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handlePermissionToggle(fullPermission)}
                                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {permissionLabels[perm] || perm}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {errors.permissions && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.permissions}
                                </p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded-r-xl">
                            <div className="flex items-start gap-3">
                                <svg className="size-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Informasi Permissions</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        <strong>View:</strong> Lihat data milik sendiri | <strong>View Any:</strong> Lihat semua data | <strong>Create:</strong> Buat data baru | <strong>Edit:</strong> Edit data | <strong>Delete:</strong> Hapus data
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-800">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600 disabled:from-blue-300 disabled:to-blue-400 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                            >
                                <Save className="size-5" />
                                {processing ? 'Menyimpan...' : 'Simpan Role'}
                            </button>
                            <Link
                                href={index().url}
                                className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <X className="size-5" />
                                Batal
                            </Link>
                        </div>

                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
