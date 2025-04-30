import { ref } from 'vue';

export function useClipboard() {
    const copied = ref(false);
    const error = ref<Error | null>(null);
    const timeoutId = ref<number | null>(null);

    const copy = async (text: string) => {
        copied.value = false;
        error.value = null;

        if (!navigator.clipboard) {
            error.value = new Error('Clipboard API not available.');
            console.error(error.value.message);
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            copied.value = true;

            // Reset copied status after a delay
            if (timeoutId.value) {
                clearTimeout(timeoutId.value);
            }
            timeoutId.value = window.setTimeout(() => {
                copied.value = false;
                timeoutId.value = null;
            }, 2000); // Reset after 2 seconds

        } catch (err) {
            error.value = err instanceof Error ? err : new Error('Failed to copy');
            console.error('Failed to copy text: ', err);
        }
    };

    return { copy, copied, error };
}