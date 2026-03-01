import { ShareData } from '@/types';
import { usePage } from '@inertiajs/react';

export function useCan() {
    const { auth } = usePage<ShareData>().props;
    console.log(auth.user?.can);

    return (permission: string): boolean => {
        return auth.user?.can?.[permission] ?? false;
    };
}
