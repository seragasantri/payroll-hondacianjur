import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-linear-to-br from-background via-background to-muted/20 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/3 rounded-full blur-3xl" />
            </div>

            {/* Main content */}
            <div className="flex flex-1 items-center justify-center p-6 md:p-10 relative z-10">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-8">
                        {/* Logo and Header */}
                        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-4 group"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
                                    <AppLogoIcon className="size-8 fill-current text-white" />
                                </div>
                            </Link>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    {title}
                                </h1>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 p-8">
                                {children}
                            </div>
                        </div>

                        {/* Footer info */}
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <p className="text-xs text-muted-foreground">
                                Secure login powered by enterprise-grade encryption
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
