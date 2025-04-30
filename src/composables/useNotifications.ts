import { ref, readonly } from 'vue';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number; // Optional duration in ms, defaults to 3000
}

// Reactive list of notifications
const notifications = ref<Notification[]>([]);

let notificationIdCounter = 0;

// Function to add a notification
const addNotification = (
    message: string,
    type: Notification['type'] = 'info',
    duration: number = 3000
) => {
    const id = notificationIdCounter++;
    const newNotification: Notification = { id, message, type, duration };
    notifications.value.push(newNotification);

    // Automatically remove the notification after its duration
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(id);
        }, duration);
    }
};

// Function to remove a notification by ID
const removeNotification = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id);
};

// --- Public API of the composable ---
export function useNotifications() {
    return {
        notifications: readonly(notifications), // Provide read-only access to the list
        addNotification,
        removeNotification
    };
}