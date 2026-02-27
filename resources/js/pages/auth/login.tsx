import { Form, Head } from '@inertiajs/react';
import { Lock, User } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status }: Props) {
    return (
        <AuthLayout
            title="Welcome Back"
            description="Sign in to your account to continue"
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-6 animate-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 duration-300 fade-in slide-in-from-top-2 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Username Input with Icon */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="username"
                                    className="text-sm font-medium"
                                >
                                    Username
                                </Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        type="text"
                                        name="username"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="username"
                                        placeholder="Masukan username anda..."
                                        className="h-11 pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <InputError message={errors.username} />
                            </div>

                            {/* Password Input with Icon */}
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-medium"
                                    >
                                        Password
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Masukan password..."
                                        className="h-11 pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="mr-2" />}
                                {processing ? 'Proses...' : 'Masuk'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
