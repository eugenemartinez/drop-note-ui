export interface Note {
  id: string;
  title: string;
  content: string;
  username: string;
  tags: string[];
  visibility: 'public' | 'private';
  created_at: string; // ISO string format
  updated_at: string; // ISO string format
  modification_code?: string; // Only present on creation/update response
}

// --- NEW: Interface for Pagination Details ---
export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_notes: number;
  total_pages: number;
  filter_tag?: string | null;
  search_term?: string | null;
  sort?: string;
}

// --- UPDATED: Interface for the API response ---
export interface NotesApiResponse {
  notes: Note[];
  pagination: PaginationInfo; // Use the nested structure
}