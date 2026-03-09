import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, X, Key, Layers, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index, update } from '@/routes/permissions';
import type { BreadcrumbItem, Permission } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Permissions',
        href: index().url
    },
    {
        title: 'Edit',
        href: '#'
    }
];

const availableActions = [
    { value: 'view', label: 'View' },
    { value: 'view any', label: 'View Any' },
    { value: 'create', label: 'Create' },
    { value: 'edit', label: 'Edit' },
    { value: 'delete', label: 'Delete' },
];

interface PermissionEditProps {
    permission: Permission;
}

export default function PermissionEdit({ permission }: PermissionEditProps) {
    // Extract module and action from existing permission name
    const getInitialModuleAndAction = () => {
        const parts = permission.name.split('.');
        if (parts.length >= 2) {
            return {
                module: permission.module, // Use the module field from database
                action: parts.slice(1).join('.') // Join the rest as action (handles "view any")
            };
        }
        return { module: permission.module, action: '' };
    };

    const initial = getInitialModuleAndAction();
    const [moduleName, setModuleName] = useState(initial.module);
    const [action, setAction] = useState(initial.action);

    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        module: permission.module,
        guard_name: permission.guard_name,
    });

    // Slugify module name: lowercase, replace spaces with dashes
    const slugifyModule = (module: string) => {
        return module
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/[^\w-]/g, ''); // Remove special chars except word chars and dashes
    };

    // Auto-generate permission name when module or action changes
    useEffect(() => {
        if (moduleName && action) {
            const slugifiedModule = slugifyModule(moduleName);
            setData('name', `${slugifiedModule}.${action}`);
            setData('module', slugifiedModule);
        } else {
            setData('name', '');
            setData('module', '');
        }
    }, [moduleName, action, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(update(permission.id).url);
    };

    const handleModuleChange = (value: string) => {
        setModuleName(value);
    };

    const handleActionChange = (value: string) => {
        setAction(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Permission" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-amber-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-amber-300'>
                            Edit Permission
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Ubah data permission: <span className="font-semibold text-blue-600 dark:text-blue-400">{permission.name}</span></p>
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
                    <div className='bg-gradient-to-r from-blue-500 to-amber-500 dark:from-blue-700 dark:to-amber-800 px-6 py-4'>
                        <h2 className='text-xl font-bold text-white'>Informasi Permission</h2>
                        <p className='text-blue-50 text-sm'>Perbarui data permission di bawah ini</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

                        {/* Nama Module - Custom Input */}
                        <div className="space-y-2">
                            <label htmlFor="moduleName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <Layers className="size-3.5" />
                                </div>
                                Nama Module
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="moduleName"
                                type="text"
                                value={moduleName}
                                onChange={(e) => handleModuleChange(e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                placeholder="Contoh: Pembelian, Pembelian Baju, Penjualan"
                            />
                            {errors.module && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.module}
                                </p>
                            )}
                        </div>

                        {/* Action - Dropdown Select */}
                        <div className="space-y-2">
                            <label htmlFor="action" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-amber-100 dark:bg-pink-900/30 text-amber-600 dark:text-amber-400">
                                    <Zap className="size-3.5" />
                                </div>
                                Action
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="action"
                                value={action}
                                onChange={(e) => handleActionChange(e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 bg-white dark:bg-gray-800 transition-colors"
                            >
                                <option value="">Pilih Action</option>
                                {availableActions.map((act) => (
                                    <option key={act.value} value={act.value}>
                                        {act.label}
                                    </option>
                                ))}
                            </select>
                            {errors.name && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Generated Permission Name - Readonly */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    <Key className="size-3.5" />
                                </div>
                                Nama Permission (Auto Generate)
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                readOnly
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono text-sm cursor-not-allowed"
                                placeholder="pembelian.viewAny"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {data.name && (
                                    <span className="flex items-center gap-1">
                                        <svg className="size-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Akan disimpan sebagai: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{data.name}</code>
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Guard Name */}
                        <div className="space-y-2">
                            <label htmlFor="guard_name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-center size-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                Guard Name
                            </label>
                            <input
                                id="guard_name"
                                type="text"
                                value={data.guard_name}
                                onChange={(e) => setData('guard_name', e.target.value)}
                                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 transition-colors"
                                placeholder="web"
                            />
                            {errors.guard_name && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.guard_name}
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
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Cara Pengisian</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        <strong>1.</strong> Tulis nama module (bebas, contoh: "Pembelian", "Pembelian Baju")<br />
                                        <strong>2.</strong> Pilih action dari dropdown (View, View Any, Create, Edit, Delete)<br />
                                        <strong>3.</strong> Nama permission akan otomatis dibuat. Contoh: "Pembelian Baju" + "View Any" = <code className="bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded">pembelian-baju.view any</code>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Warning Box */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-4 rounded-r-xl">
                            <div className="flex items-start gap-3">
                                <svg className="size-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Peringatan</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        Mengubah nama permission dapat mempengaruhi akses role yang sudah menggunakan permission ini. Pastikan Anda memahami dampak perubahan tersebut.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-800">
                            <button
                                type="submit"
                                disabled={processing || !data.name}
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 dark:from-blue-600 dark:to-amber-500 dark:hover:from-blue-700 dark:hover:to-amber-600 disabled:from-blue-300 disabled:to-amber-400 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                            >
                                <Save className="size-5" />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
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
