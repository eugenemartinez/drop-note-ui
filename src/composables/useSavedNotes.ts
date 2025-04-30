import { ref, readonly, watch } from 'vue';
import { useNotifications } from './useNotifications'; // <-- Import notifications

const LOCAL_STORAGE_KEY = 'dropnote_saved_notes';

// Reactive set to hold the saved note IDs
const savedNoteIds = ref<Set<string>>(loadSavedNotes());

// --- Get notification function ---
const { addNotification } = useNotifications();
// --- End Get ---

// Function to load IDs from local storage
function loadSavedNotes(): Set<string> {
    try {
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedValue) {
            const parsedIds = JSON.parse(storedValue);
            if (Array.isArray(parsedIds)) {
                return new Set(parsedIds);
            }
        }
    } catch (error) {
        console.error("Error loading saved notes from local storage:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return new Set();
}

// Function to persist IDs to local storage
function persistSavedNotes() {
    try {
        const idsArray = Array.from(savedNoteIds.value);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(idsArray));
    } catch (error) {
        console.error("Error saving notes to local storage:", error);
    }
}

// Watch the reactive set and persist changes automatically
watch(savedNoteIds, persistSavedNotes, { deep: true });


// --- Public API of the composable ---
export function useSavedNotes() {

    // Check if a specific note ID is saved
    const isNoteSaved = (id: string): boolean => { return savedNoteIds.value.has(id); };

    // Add a note ID to the saved list
    const saveNote = (id: string) => {
        if (!savedNoteIds.value.has(id)) {
            savedNoteIds.value.add(id);
            addNotification('Note saved to My Notes.', 'success', 2000); // <-- Add notification
        }
    };

    // Remove a note ID from the saved list
    const unsaveNote = (id: string) => {
        if (savedNoteIds.value.has(id)) {
            savedNoteIds.value.delete(id);
            addNotification('Note removed from My Notes.', 'info', 2000); // <-- Add notification
        }
    };

    // Toggle save status for a note ID
    const toggleSaveNote = (id: string) => {
        if (isNoteSaved(id)) {
            unsaveNote(id);
        } else {
            saveNote(id);
        }
        // Notifications are handled within saveNote/unsaveNote now
    };

    // Clear all saved notes
    const clearAllSavedNotes = () => {
        if (savedNoteIds.value.size > 0) {
            const count = savedNoteIds.value.size; // Get count before clearing
            savedNoteIds.value.clear();
            addNotification(`${count} note${count > 1 ? 's' : ''} removed from My Notes.`, 'info', 2500); // <-- Add notification
        }
    };

    return {
        isNoteSaved,
        saveNote,
        unsaveNote,
        toggleSaveNote,
        clearAllSavedNotes,
        savedIds: readonly(savedNoteIds) // <-- Return readonly version for safety
    };
}