<script setup lang="ts">
import { ref, watchEffect, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useSavedNotes } from '@/composables/useSavedNotes';
import { fetchNotesByIds } from '@/services/apiService';
import type { Note } from '@/types/note';
import NoteCard from '@/components/NoteCard.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import EmptyState from '@/components/common/EmptyState.vue'; // <-- Import EmptyState
import {
    TrashIcon,
    MagnifyingGlassIcon,
    BookmarkIcon, // Keep for EmptyState
    MagnifyingGlassMinusIcon, // Keep for EmptyState
    AdjustmentsHorizontalIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline';

const { savedIds, unsaveNote, clearAllSavedNotes } = useSavedNotes();
const router = useRouter();

const notes = ref<Note[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showClearConfirmModal = ref(false);

const loadSavedNotesDetails = async () => {
    const idsToFetch = Array.from(savedIds.value);
    if (idsToFetch.length === 0) {
        notes.value = [];
        isLoading.value = false;
        error.value = null;
        return;
    }
    isLoading.value = true;
    error.value = null;
    try {
        const fetchedNotes = await fetchNotesByIds(idsToFetch);
        const existingNotes = fetchedNotes.filter(note => savedIds.value.has(note.id));
        notes.value = existingNotes;
        if (existingNotes.length !== idsToFetch.length) {
            const foundIds = new Set(existingNotes.map(n => n.id));
            idsToFetch.forEach(id => {
                if (!foundIds.has(id)) {
                    console.warn(`Saved note ID ${id} not found, removing from saved list.`);
                    unsaveNote(id);
                }
            });
        }
    } catch (err: any) {
        console.error("Error loading saved notes details:", err);
        error.value = err.message || 'Failed to load saved notes.';
        notes.value = [];
    } finally {
        isLoading.value = false;
    }
};


watchEffect(() => {
    loadSavedNotesDetails();
});

const searchTerm = ref('');
const sortBy = ref('date_desc');
const showFilters = ref(false);

const filteredAndSortedNotes = computed(() => {
    let result = [...notes.value];
    if (searchTerm.value.trim()) {
        const lowerSearchTerm = searchTerm.value.toLowerCase().trim();
        result = result.filter(note =>
            note.title.toLowerCase().includes(lowerSearchTerm) ||
            note.content.toLowerCase().includes(lowerSearchTerm) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
        );
    }

    switch (sortBy.value) {
        case 'date_asc':
            result.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at).getTime() || 0;
                const dateB = new Date(b.updated_at || b.created_at).getTime() || 0;
                if (dateA !== dateB) {
                    return dateA - dateB; // Primary: date ASC
                }
                // Secondary (tie-breaker): title ASC
                return a.title.localeCompare(b.title);
            });
            break;
        case 'title_asc':
            result.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title_desc':
            result.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date_desc':
        default:
            result.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at).getTime() || 0;
                const dateB = new Date(b.updated_at || b.created_at).getTime() || 0;
                if (dateB !== dateA) {
                    return dateB - dateA; // Primary: date DESC
                }
                // Secondary (tie-breaker): title DESC <-- CHANGE THIS LINE
                return b.title.localeCompare(a.title);
            });
            break;
    }
    return result;
});
const noMatchesFound = computed(() => {
    return notes.value.length > 0 && filteredAndSortedNotes.value.length === 0 && searchTerm.value.trim() !== '';
});
const hasSavedNotes = computed(() => savedIds.value.size > 0);


const handleClearAllClick = () => {
    showClearConfirmModal.value = true;
};

const confirmClearAll = () => {
    clearAllSavedNotes();
    showClearConfirmModal.value = false;
};


const handleCardTagClick = (tag: string) => {
    router.push({ name: 'PublicNotes', query: { tag: tag } });
};

</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex justify-between items-center mb-6 gap-4">
        <h1
          class="text-2xl font-bold text-gray-800"
          v-motion
          :initial="{ opacity: 0, x: -20 }"
          :enter="{ opacity: 1, x: 0, transition: { delay: 100 } }"
        >
          My Saved Notes
        </h1>
        <div
          class="flex items-center gap-2"
          v-motion
          :initial="{ opacity: 0, x: 20 }"
          :enter="{ opacity: 1, x: 0, transition: { delay: 150 } }"
        >
            <!-- Filter/Sort Toggle Button -->
            <BaseButton
                @click="showFilters = !showFilters"
                title="Toggle search and sort options"
                variant="secondary"
                size="sm"
                class="bg-gray-100 hover:bg-gray-200"
            >
                <AdjustmentsHorizontalIcon class="h-4 w-4 sm:mr-1" />
                <span class="hidden sm:inline">Filter/Sort</span>
            </BaseButton>
            <!-- Clear All Button -->
            <BaseButton
                v-if="hasSavedNotes"
                @click="handleClearAllClick"
                title="Remove all notes from this list"
                variant="danger"
                size="sm"
                class="bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
            >
                <TrashIcon class="h-4 w-4 sm:mr-1" />
                <span class="hidden sm:inline">Clear All</span>
            </BaseButton>
        </div>
    </div>

    <!-- Filter/Search/Sort Section - Fade in/out -->
    <div
      v-if="showFilters"
      class="mb-6 p-4 bg-gray-100 rounded-md flex flex-col sm:flex-row gap-4 items-center"
      v-motion-fade
    >
        <!-- Search Input -->
        <BaseInput
          id="my-notes-search"
          type="search"
          v-model="searchTerm"
          placeholder="Search title, content, tags..."
          wrapperClass="flex-grow w-full sm:w-auto"
          inputClass="text-sm"
        >
          <template #leadingIcon>
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </template>
        </BaseInput>

         <!-- Sort Select -->
         <select v-model="sortBy" class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm cursor-pointer">
             <option value="date_desc">Sort by Date (Newest)</option>
             <option value="date_asc">Sort by Date (Oldest)</option>
             <option value="title_asc">Sort by Title (A-Z)</option>
             <option value="title_desc">Sort by Title (Z-A)</option>
         </select>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center text-gray-500 py-10">
      <LoadingSpinner sizeClass="h-10 w-10" colorClass="text-gray-400" class="mx-auto" />
      <p class="mt-2">Loading saved notes...</p>
    </div>

    <!-- Error Alert - Fade in -->
    <AlertMessage
      v-else-if="error"
      type="error"
      title="Error Loading Notes"
      :show="!!error"
      class="text-center"
      v-motion-fade
    >
      <p>{{ error }}</p>
      <template #actions>
        <BaseButton
          @click="loadSavedNotesDetails"
          variant="danger"
          size="sm"
        >
          Retry
        </BaseButton>
      </template>
    </AlertMessage>

    <!-- No Saved Notes State - Fade in -->
    <EmptyState
      v-else-if="!hasSavedNotes && !isLoading"
      :icon="BookmarkIcon"
      title="No Saved Notes"
      v-motion-fade
    >
      <p>You haven't saved any notes yet.</p>
      <p class="mt-1">Browse <RouterLink
          to="/notes"
          class="text-indigo-600 hover:underline transition-colors duration-150 ease-in-out"
        >public notes</RouterLink> to find some to save.</p>
    </EmptyState>

    <!-- No Search Matches State - Fade in -->
    <EmptyState
      v-else-if="noMatchesFound"
      :icon="MagnifyingGlassMinusIcon"
      title="No Matches Found"
      v-motion-fade
    >
       <p>No saved notes match your search term "{{ searchTerm }}".</p>
       <template #actions>
         <BaseButton
            @click="searchTerm = ''"
            variant="ghost"
            size="sm"
            class="text-indigo-600 hover:underline"
         >
           Clear search
         </BaseButton>
       </template>
    </EmptyState>

    <!-- Notes Grid - Staggered fade/slide -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <NoteCard
        v-for="(note, index) in filteredAndSortedNotes"
        :key="note.id"
        :note="note"
        :active-filter-tag="null"
        @tag-clicked="handleCardTagClick"
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 100 + index * 50 } }"
      />
    </div>

    <!-- Clear All Modal - No external motion -->
    <BaseModal :show="showClearConfirmModal" @close="showClearConfirmModal = false">
        <template #header>
            <div class="flex items-center">
                <ExclamationTriangleIcon class="h-5 w-5 text-red-600 mr-2" aria-hidden="true" />
                <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                    Confirm Clear All
                </h3>
            </div>
        </template>
        <template #default>
            <div class="mt-2">
                <p class="text-sm text-gray-700">
                    Are you sure you want to remove <strong>all</strong> saved notes from your list?
                </p>
                <p class="mt-1 text-sm text-gray-500">
                    This action cannot be undone.
                </p>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end space-x-3">
                <BaseButton
                    @click="showClearConfirmModal = false"
                    variant="secondary"
                    type="button"
                >
                    Cancel
                </BaseButton>
                <BaseButton
                    @click="confirmClearAll"
                    variant="danger"
                    type="button"
                >
                    Confirm Clear All
                </BaseButton>
            </div>
        </template>
    </BaseModal>

  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>