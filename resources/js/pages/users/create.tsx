import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { MultiSelect } from 'primereact/multiselect';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index, store } from '@/routes/users';
import type { BreadcrumbItem, Role } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Users',
        href: index().url
    },
    {
        title: 'Create',
        href: '#'
    }
];


interface UserCreateProps {
    roles: Role[];
}

export default function UserCreate({ roles }: UserCreateProps) {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    // Transform roles ke format MultiSelect
    const roleOptions = roles.map((role: Role) => ({
        label: role.name,
        value: role.name,
    }));

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        roles: [] as string[],
        password: '',
        password_confirmation: '',
    });

    // Sync selectedRoles ke form data setiap kali berubah
    useEffect(() => {
        setData('roles', selectedRoles);
    }, [selectedRoles, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(store().url, {
            onSuccess: () => {
                reset();
                setSelectedRoles([]);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah User Baru" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300'>
                            Tambah User Baru
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Isi formulir di bawah untuk membuat user baru</p>
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
                        <h2 className='text-xl font-bold text-white'>Informasi User</h2>
                        <p className='text-blue-50 text-sm'>Lengkapi data user dengan benar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

                        {/* Nama */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                Nama Lengkap
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                placeholder="Masukkan nama lengkap user"
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

                        {/* Username */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                Username
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                <input
                                    id="username"
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                    placeholder="username"
                                />
                            </div>
                            {errors.username && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        {/* Roles - Multi Select */}
                        <div className="space-y-2">
                            <label htmlFor="roles" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                Roles
                                <span className="text-red-500">*</span>
                            </label>
                            <MultiSelect
                                id="roles"
                                value={selectedRoles}
                                onChange={(e) => setSelectedRoles(e.value)}
                                options={roleOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Pilih role untuk user ini"
                                display="chip"
                                className="w-full [&_.p-multiselect]:border-2 [&_.p-multiselect]:border-gray-200 [&_.p-multiselect]:dark:border-gray-700 [&_.p-multiselect]:rounded-xl [&_.p-multiselect]:focus:border-blue-500"
                            />
                            {errors.roles && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.roles}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">Pilih satu atau lebih role untuk user ini</p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                Password
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                placeholder="Masukkan password"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Konfirmasi Password */}
                        <div className="space-y-2">
                            <label htmlFor="password_confirmation" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Konfirmasi Password
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                placeholder="Ulangi password"
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-800">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-700 dark:hover:to-blue-600 disabled:from-blue-300 disabled:to-blue-400 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                            >
                                <Save className="size-5" />
                                {processing ? 'Menyimpan...' : 'Simpan User'}
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
