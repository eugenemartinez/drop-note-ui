import type { Note, NotesApiResponse } from '@/types/note'; // Ensure Note is imported

// Get the API base URL from environment variables
// Fallback for local development if the variable isn't set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5333/api';

/**
 * Fetches a list of public notes from the API.
 * Supports pagination, sorting, filtering, and searching.
 */
export async function fetchPublicNotes(
    page: number = 1,
    limit: number = 10,
    sort: string = 'updated_at_desc',
    tag?: string | null,
    search?: string | null
): Promise<NotesApiResponse> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: sort,
    });

    if (tag) {
        params.append('tag', tag);
    }
    if (search) {
        params.append('search', search);
    }

    const url = `${API_BASE_URL}/notes?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // Attempt to read error details from the response body
            let errorBody = null;
            try {
                errorBody = await response.json();
            } catch (e) {
                // Ignore if response body is not JSON or empty
            }
            const errorMessage = errorBody?.error || `HTTP error! status: ${response.status}`;
            console.error("API Error Response:", errorBody);
            throw new Error(errorMessage);
        }

        const data: NotesApiResponse = await response.json();
        return data;

    } catch (error) {
        console.error("Failed to fetch public notes:", error);
        // Re-throw the error so the component can handle it
        throw error;
    }
}

// Define the input data structure for creating a note
interface CreateNotePayload {
  title: string;
  content: string;
  username: string;
  tags: string[];
  visibility: 'public' | 'private';
}

// Define the expected response structure after creating a note
interface CreateNoteResponse extends Note {
    modification_code: string; // Expect modification code on creation
}

/**
 * Creates a new note via the API.
 */
export async function createNote(payload: CreateNotePayload): Promise<CreateNoteResponse> {
    const url = `${API_BASE_URL}/notes`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json(); // Try to parse JSON regardless of status

        if (!response.ok) {
            const errorMessage = responseData?.error || `HTTP error! status: ${response.status}`;
            console.error("API Error Response (Create Note):", responseData);
            throw new Error(errorMessage);
        }


        // --- UPDATED CHECK ---
        // Check for properties directly on responseData
        if (!responseData || !responseData.id || !responseData.modification_code) {
             console.error("Validation failed: Response missing id or modification_code", responseData);
             throw new Error("Invalid response structure received from server after creating note.");
        }
        // --- UPDATED RETURN ---
        // Return responseData directly, cast to the expected type
        return responseData as CreateNoteResponse;

    } catch (error) {
        console.error("Failed to create note:", error);
        throw error; // Re-throw for the component to handle
    }
}

/**
 * Fetches a single note by its ID from the API.
 */
export async function fetchNoteById(id: string): Promise<Note> {
    const url = `${API_BASE_URL}/notes/${id}`;

    try {
        const response = await fetch(url);

        // Handle non-JSON 404 specifically
        if (response.status === 404) {
            console.error(`API Error: Note with ID ${id} not found.`);
            throw new Error(`Note not found.`); // Specific error for component
        }

        const responseData = await response.json(); // Try to parse JSON

        if (!response.ok) {
            const errorMessage = responseData?.error || `HTTP error! status: ${response.status}`;
            console.error(`API Error Response (Fetch Note ${id}):`, responseData);
            throw new Error(errorMessage);
        }

        // Assuming the backend returns the note object directly at the root
        if (!responseData || !responseData.id) {
             console.error("Validation failed: Response missing id", responseData);
             throw new Error("Invalid response structure received from server for note details.");
        }
        return responseData as Note;

    } catch (error) {
        // Don't log the specific "Note not found" error again if it was thrown above
        if (!(error instanceof Error && error.message === 'Note not found.')) {
            console.error(`Failed to fetch note ${id}:`, error);
        }
        throw error; // Re-throw for the component to handle
    }
}

/**
 * Fetches the ID of a random public note from the API.
 * (Updated to handle the endpoint returning the full note object)
 */
export async function fetchRandomNoteId(): Promise<string> {
    const url = `${API_BASE_URL}/notes/random`;

    try {
        const response = await fetch(url);
        const responseData = await response.json(); // Try to parse JSON

        if (!response.ok) {
            const errorMessage = responseData?.error || `HTTP error! status: ${response.status}`;
            console.error("API Error Response (Fetch Random Note):", responseData);
            // Handle case where no public notes exist
            if (response.status === 404) {
                throw new Error("No public notes available to choose from.");
            }
            throw new Error(errorMessage);
        }

        // --- UPDATED CHECK ---
        // Expect the full note object and extract the ID
        if (!responseData || !responseData.id) {
            console.error("Validation failed: Response missing id", responseData);
            throw new Error("Invalid response structure received for random note.");
        }
        // --- RETURN ONLY THE ID ---
        return responseData.id as string;

    } catch (error) {
        console.error("Failed to fetch random note data:", error);
        throw error; // Re-throw for the component to handle
    }
}

/**
 * Fetches details for multiple notes based on a list of IDs.
 */
export async function fetchNotesByIds(ids: string[]): Promise<Note[]> {
    if (!ids || ids.length === 0) {
        return []; // No need to call API if no IDs are provided
    }

    const url = `${API_BASE_URL}/notes/batch`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: ids }), // Send IDs in the expected format
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.error || `HTTP error! status: ${response.status}`;
            console.error("API Error Response (Fetch Batch Notes):", responseData);
            throw new Error(errorMessage);
        }

        // Expect the response to be { "notes": [...] }
        if (!responseData || !Array.isArray(responseData.notes)) {
             console.error("Validation failed: Response missing 'notes' array", responseData);
             throw new Error("Invalid response structure received for batch notes.");
        }
        return responseData.notes as Note[];

    } catch (error) {
        console.error("Failed to fetch batch notes:", error);
        throw error; // Re-throw for the component to handle
    }
}

// Define the payload structure for updating a note
interface UpdateNotePayload {
  title: string;
  content: string;
  tags: string[];
  visibility: 'public' | 'private';
  modification_code: string; // Modification code is required for update
}

/**
 * Updates an existing note via the API.
 */
export async function updateNote(id: string, payload: UpdateNotePayload): Promise<Note> {
    const url = `${API_BASE_URL}/notes/${id}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.error || `HTTP error! status: ${response.status}`;
            console.error(`API Error Response (Update Note ${id}):`, responseData);
            // Provide more specific frontend errors based on status
            if (response.status === 403) {
                 throw new Error("Invalid modification code provided.");
            }
            if (response.status === 404) {
                 throw new Error("Note not found. It might have been deleted.");
            }
            throw new Error(errorMessage);
        }

        // Expect the updated note object directly
        if (!responseData || !responseData.id) {
             console.error("Validation failed: Response missing id", responseData);
             throw new Error("Invalid response structure received after updating note.");
        }
        return responseData as Note;

    } catch (error) {
        console.error(`Failed to update note ${id}:`, error);
        throw error; // Re-throw for the component to handle
    }
}

/**
 * Deletes an existing note via the API.
 * Requires the modification code.
 */
export async function deleteNote(id: string, modificationCode: string): Promise<void> {
    const url = `${API_BASE_URL}/notes/${id}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send modification code in the body as expected by the backend
            body: JSON.stringify({ modification_code: modificationCode }),
        });

        // Check for non-successful status codes (including 204 No Content which is success)
        if (!response.ok) {
             let responseData = null;
             try {
                 // Try to parse error json, but might fail for 404 etc.
                 responseData = await response.json();
             } catch (e) { /* Ignore parsing error */ }

            const errorMessage = responseData?.error || `HTTP error! status: ${response.status}`;
            console.error(`API Error Response (Delete Note ${id}):`, responseData || response.statusText);

            if (response.status === 403) {
                 throw new Error("Invalid modification code provided.");
            }
            if (response.status === 404) {
                 throw new Error("Note not found. It might have already been deleted.");
            }
            throw new Error(errorMessage);
        }

        // Handle successful deletion (200 OK or 204 No Content)
        // No data expected in the response body for successful deletion
        return; // Return void

    } catch (error) {
        console.error(`Failed to delete note ${id}:`, error);
        throw error; // Re-throw for the component to handle
    }
}

/**
 * Fetches a list of unique public tags from the API.
 */
export async function fetchPublicTags(): Promise<string[]> {
    const url = `${API_BASE_URL}/tags`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // Attempt to read error details from the response body
            let errorBody = null;
            try {
                errorBody = await response.json();
            } catch (e) {
                // Ignore if response body is not JSON or empty
            }
            const errorMessage = errorBody?.error || `HTTP error! status: ${response.status}`;
            console.error("API Error Response (Fetch Tags):", errorBody);
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Validate the response structure
        if (!data || !Array.isArray(data.tags)) {
            console.error("Validation failed: Response missing 'tags' array", data);
            throw new Error("Invalid response structure received for tags.");
        }

        // Return the array of tags
        return data.tags as string[];

    } catch (error) {
        console.error("Failed to fetch public tags:", error);
        // Re-throw the error so the component can handle it
        throw error;
    }
}

// Add other API functions here later (deleteNote, etc.)