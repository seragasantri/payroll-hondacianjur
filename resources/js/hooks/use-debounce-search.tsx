import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface SearchParams {
    [key: string]: string;
}

export function useDebounceSearch(initialValues: SearchParams = {}, delay = 500) {
    const [searchValues, setSearchValues] = useState<SearchParams>(initialValues);
    const [isSearching, setIsSearching] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedSearch = (field: string, value: string, url: string) => {
        // Update state untuk field yang diubah saja
        setSearchValues(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear timeout sebelumnya
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set loading state
        setIsSearching(true);

        // Set timeout baru dengan semua search values
        timeoutRef.current = setTimeout(() => {
            const queryParams: SearchParams = {
                ...searchValues,
                [field]: value
            };

            router.get(url, queryParams, {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            });
        }, delay);
    };

    const getSearchValue = (field: string) => {
        return searchValues[field] || '';
    };

    const resetSearch = () => {
        setSearchValues({});
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsSearching(false);
    };

    return { debouncedSearch, getSearchValue, isSearching, resetSearch };
}
