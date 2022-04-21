import {TFunction} from "react-i18next";

export function handleError(e: unknown, setError: (error: string) => void, t: TFunction) {
    console.error(e);
    if (typeof e === 'string') {
        setError(e);
    } else if (e instanceof Error) {
        console.log(e);
        // @ts-ignore
        const message = e.response?.data?.error || e.message;
        setError(t(`serverErrors.${message}`, message));
    } else {
        setError(t('serverErrors.unexpected'));
    }
}