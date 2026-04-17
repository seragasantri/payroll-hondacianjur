import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { index } from '@/routes/jabatan';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Jabatan',
        href: index().url
    },
    {
        title: 'Tambah Jabatan',
        href: '#'
    }
];

export default function JabatanCreate() {
    const { data, setData, errors, post, processing } = useForm<{
        name: string;
    }>({
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/jabatan');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Jabatan" />

            <div className="max-w-2xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={index().url}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Kembali</span>
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-400 dark:to-red-300">
                        Tambah Jabatan Baru
                    </h1>
                    <p className="text-muted-foreground mt-2">Isi form di bawah untuk menambahkan data jabatan</p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Nama Jabatan */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nama Jabatan <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-400 transition-colors"
                                placeholder="Contoh: Manager, Supervisor, Staff"
                            />
                            {errors.name && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <svg className="size-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-sky-800 dark:text-sky-300">
                                    <p className="font-medium mb-1">Informasi:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Nama jabatan harus unik</li>
                                        <li>• Gunakan nama yang mudah dipahami</li>
                                        <li>• Contoh: Manager, Supervisor, Staff, Operator</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <Link
                                href={index().url}
                                className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-500 dark:hover:from-red-700 dark:hover:to-red-600 text-white font-medium shadow-lg shadow-red-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Simpan Jabatan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
