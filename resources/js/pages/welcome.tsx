import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Honda Cianjur - Payroll System" />
            <link rel="preconnect" href="https://fonts.bunny.net" />
            <link
                href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                rel="stylesheet"
            />
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-white to-sky-50 dark:from-gray-950 dark:via-gray-950 dark:to-red-950/20">
                {/* Header */}
                <header className="w-full px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/assets/images/logo_2.png" alt="Honda Cianjur" className="h-10" />
                        </div>
                        <nav className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        Masuk
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <main className="flex-1 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium mb-6">
                                <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
                                Sistem Payroll Honda Cianjur
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Kelola Gaji{' '}
                                <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                                    Karyawan
                                </span>{' '}
                                Lebih Mudah
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                                Sistem payroll terintegrasi untuk mengelola slip gaji, tunjangan, potongan, dan laporan dengan mudah dan akurat.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95"
                                    >
                                        Buka Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95"
                                        >
                                            Masuk Sekarang
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Visual */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-sky-500/10 rounded-3xl blur-3xl" />
                                <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-red-500/10 border border-gray-200 dark:border-gray-800 overflow-hidden">
                                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="size-3 rounded-full bg-white/30" />
                                                <div className="size-3 rounded-full bg-white/30" />
                                                <div className="size-3 rounded-full bg-white/30" />
                                            </div>
                                            <span className="text-white/60 text-xs">Honda Payroll</span>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
                                            <div className="size-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">12</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Karyawan Aktif</p>
                                                <p className="text-xs text-gray-500">2 Kantor Cabang</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
                                            <div className="size-10 rounded-lg bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">Rp</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Gaji April 2026</p>
                                                <p className="text-xs text-gray-500">Sudah Dibayar</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-sky-900/20 rounded-xl">
                                            <div className="size-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center">
                                                <span className="text-white font-bold text-xs">THR</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">THR 2026</p>
                                                <p className="text-xs text-gray-500">Tunjangan Hari Raya</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="w-full px-6 py-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img src="/assets/images/logo_2.png" alt="Honda Cianjur" className="h-6" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Honda Cianjur. All rights reserved.</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
