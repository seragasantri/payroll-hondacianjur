import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col overflow-hidden bg-linear-to-br from-background via-background to-muted/20">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-1 items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-8">
                        {/* Logo and Header */}
                        <div className="flex animate-in flex-col items-center gap-4 text-center duration-500 fade-in slide-in-from-bottom-4 ">
                            <Link
                                href={home()}
                                className="group flex flex-col items-center gap-4"
                            >
                                <div className="flex h-16 items-center justify-center rounded-2xl ">
                                    <img
                                        src="/assets/images/logo_1.png"
                                        className='w-50 mb-10'
                                        alt="Logo Login"
                                    />
                                </div>
                            </Link>
                        </div>

                        {/* Form Card */}
                        <div className="animate-in delay-100 duration-500 fade-in slide-in-from-bottom-4">
                            <div className="rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl shadow-black/5 backdrop-blur-sm">
                                {children}
                            </div>
                        </div>

                        {/* Footer info */}
                        <div className="animate-in text-center delay-200 duration-500 fade-in slide-in-from-bottom-4">
                            <p className="text-xs text-muted-foreground">
                                Secure login powered by enterprise-grade
                                encryption
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
