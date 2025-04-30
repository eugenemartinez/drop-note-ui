<script setup lang="ts">
// --- IMPORTS ---
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { fetchPublicNotes } from '@/services/apiService';
import type { Note, NotesApiResponse } from '@/types/note';
import NoteCard from '@/components/NoteCard.vue';
import TagsFilter from '@/components/TagsFilter.vue';
import { RouterLink } from 'vue-router';
import { debounce } from 'lodash';
import { Menu, MenuButton, MenuItems } from '@headlessui/vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import EmptyState from '@/components/common/EmptyState.vue'; // <-- Import EmptyState
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    AdjustmentsHorizontalIcon,
    DocumentMagnifyingGlassIcon, // <-- Import icon for empty state
    TagIcon // <-- Import icon for tag empty state
} from '@heroicons/vue/24/outline';

// --- STATE ---
const route = useRoute();
const notes = ref<Note[]>([]);
const isLoading = ref<boolean>(true);
const isLoadingMore = ref<boolean>(false);
const error = ref<string | null>(null);
const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const limit = ref<number>(10);
const searchTerm = ref('');
const sortBy = ref('date_desc');
const selectedTagFilter = ref<string | null>(route.query.tag as string || null);
const showFilters = ref(false); // Add this state variable
const observer = ref<IntersectionObserver | null>(null);
const sentinel = ref<Element | null>(null);
const rootMarginValue = 1000;

// --- METHODS ---

// Modify loadNotes to accept the selected tag
const loadNotes = async (page = 1, append = false) => {
  if (append) {
    if (isLoadingMore.value) {
        return;
    }
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
    observer.value?.disconnect();
  }
  error.value = null;
  try {
    const response: NotesApiResponse = await fetchPublicNotes(
        page,
        limit.value,
        sortBy.value,
        selectedTagFilter.value,
        searchTerm.value || null
    );
    notes.value = append ? [...notes.value, ...response.notes] : response.notes;
    currentPage.value = response.pagination.current_page;
    totalPages.value = response.pagination.total_pages;
  } catch (err: any) {
    error.value = err.message || 'Failed to load notes.';
    console.error("[loadNotes] Error loading notes:", err);
    if (!append) {
        notes.value = [];
    }
  } finally {
    if (append) {
        isLoadingMore.value = false;
    } else {
        isLoading.value = false;
    }
  }
};

const debouncedLoadNotes = debounce(() => {
    currentPage.value = 1;
    loadNotes(1, false);
}, 400);

// Handler for tag selection event from TagsFilter component
const handleTagSelected = (tag: string | null) => {
  // Update URL query parameter when filter changes (optional but good practice)
  // router.push({ query: tag ? { tag } : {} }); // Consider adding this if you want URL to always reflect filter
  selectedTagFilter.value = tag;
  currentPage.value = 1; // Reset page when filter changes
  loadNotes(1, false); // Reload notes with the new filter
};

// --- WATCHERS ---
watch(searchTerm, () => { debouncedLoadNotes(); });
watch(sortBy, () => { currentPage.value = 1; loadNotes(1, false); });

// Intersection Observer Callback
const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    if (entry.isIntersecting && !isLoadingMore.value && currentPage.value < totalPages.value) {
        loadNotes(currentPage.value + 1, true);
    }
};

// Observer Management
const manageObserver = async () => {
    await nextTick();
    const sentinelEl = sentinel.value;
    if (!sentinelEl) {
        observer.value?.disconnect();
        return;
    }
    if (currentPage.value < totalPages.value && notes.value.length > 0) {
        observer.value?.observe(sentinelEl);
    } else {
        observer.value?.disconnect();
    }
};

// Visibility Check
const checkAndLoadIfVisible = () => {
    if (sentinel.value && !isLoading.value && !isLoadingMore.value && currentPage.value < totalPages.value) {
        const sentinelRect = sentinel.value.getBoundingClientRect();
        const isVisible = sentinelRect.top <= (window.innerHeight + rootMarginValue);
        if (isVisible) {
            loadNotes(currentPage.value + 1, true);
        }
    } else {
    }
};

// Watcher for state changes
watch([notes, isLoading, isLoadingMore, currentPage, totalPages], async () => {
    if (!isLoading.value && !isLoadingMore.value) {
         await manageObserver();
         checkAndLoadIfVisible();
    } else {
    }
}, { deep: true, flush: 'post' });

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  // Check for tag in query param *before* initial load
  const tagFromQuery = route.query.tag as string | null;
  if (tagFromQuery && selectedTagFilter.value !== tagFromQuery) {
      selectedTagFilter.value = tagFromQuery;
  }

  observer.value = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${rootMarginValue}px`,
      threshold: 0
  });
  // Load notes using the potentially updated selectedTagFilter
  await loadNotes(currentPage.value);
});

onUnmounted(() => {
  if (observer.value) {
      observer.value.disconnect();
  }
});
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header with Title and Toggle Button -->
    <div class="flex justify-between items-center mb-6 gap-4">
      <h1
        class="text-2xl font-bold text-gray-800"
        v-motion
        :initial="{ opacity: 0, x: -20 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 100 } }"
      >
        Public Notes
      </h1>
      <BaseButton
          @click="showFilters = !showFilters"
          title="Toggle search, sort, and filter options"
          variant="secondary"
          size="sm"
          class="bg-gray-100 hover:bg-gray-200 flex-shrink-0 lg:hidden"
          v-motion
          :initial="{ opacity: 0, x: 20 }"
          :enter="{ opacity: 1, x: 0, transition: { delay: 150 } }"
      >
          <AdjustmentsHorizontalIcon class="h-4 w-4 sm:mr-1" />
          <span class="hidden sm:inline">Filter/Sort</span>
      </BaseButton>
    </div>

    <!-- Collapsible Filter/Search/Sort Section (Mobile/Tablet) -->
    <div
      v-if="showFilters"
      class="mb-6 p-4 bg-gray-100 rounded-md flex flex-col sm:flex-row gap-4 items-center lg:hidden"
      v-motion-fade
    >
      <!-- Search Input (Mobile) -->
      <BaseInput
        id="mobile-search"
        type="search"
        v-model="searchTerm"
        placeholder="Search title or content..."
        wrapperClass="flex-grow w-full sm:w-auto"
        inputClass="text-sm"
      >
        <template #leadingIcon>
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
        </template>
      </BaseInput>

      <!-- Sort Select (Mobile) -->
      <select v-model="sortBy" class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm">
        <option value="date_desc">Sort by Date (Newest)</option>
        <option value="date_asc">Sort by Date (Oldest)</option>
        <option value="title_asc">Sort by Title (A-Z)</option>
        <option value="title_desc">Sort by Title (Z-A)</option>
      </select>

      <!-- Tag Filter Dropdown (Mobile) -->
      <div class="w-full sm:w-auto">
        <Menu as="div" class="relative inline-block text-left w-full">
          <div>
            <MenuButton class="inline-flex w-full justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
              <span>{{ selectedTagFilter ? `Filter: #${selectedTagFilter}` : 'Filter by Tag' }}</span>
              <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            </MenuButton>
          </div>
          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <MenuItems class="absolute left-0 z-10 mt-2 w-full origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
              <div class="p-1">
                <TagsFilter
                  @tag-selected="handleTagSelected"
                  :current-filter-tag="selectedTagFilter"
                />
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>

    </div>


    <!-- Main Layout -->
    <div class="flex flex-col lg:flex-row gap-6">

      <!-- Sidebar - Animate -->
      <aside
        class="w-full lg:w-64 xl:w-72 flex-shrink-0 hidden lg:block"
        v-motion
        :initial="{ opacity: 0, x: -20 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 200 } }"
      >
        <TagsFilter
          @tag-selected="handleTagSelected"
          :current-filter-tag="selectedTagFilter"
        />
      </aside>

      <!-- Main Content Area -->
      <main class="flex-grow min-w-0">

        <!-- Search and Sort Controls (Desktop) - Animate -->
        <div
          class="mb-6 p-4 bg-gray-100 rounded-md items-center gap-4 hidden lg:flex"
          v-motion
          :initial="{ opacity: 0, y: -10 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 250 } }"
        >
          <!-- Search Input (Desktop) -->
          <BaseInput
            id="desktop-search"
            type="search"
            v-model="searchTerm"
            placeholder="Search title or content..."
            wrapperClass="flex-grow"
            inputClass="text-sm"
          >
            <template #leadingIcon>
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </template>
          </BaseInput>

          <!-- Sort Select (Desktop) -->
          <select v-model="sortBy" class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex-shrink-0 text-sm cursor-pointer">
            <option value="date_desc">Sort by Date (Newest)</option>
            <option value="date_asc">Sort by Date (Oldest)</option>
            <option value="title_asc">Sort by Title (A-Z)</option>
            <option value="title_desc">Sort by Title (Z-A)</option>
          </select>
        </div>

        <!-- Loading/Error/Content States -->
        <!-- Initial Loading - Animate -->
        <div
          v-if="isLoading"
          class="text-center py-12"
          v-motion-fade
        >
          <LoadingSpinner sizeClass="h-10 w-10" colorClass="text-indigo-600" class="mx-auto" />
          <p class="mt-2 text-sm text-gray-500">Loading notes...</p>
        </div>
        <!-- Error - Animate -->
        <AlertMessage
          v-else-if="error && !isLoadingMore"
          type="error"
          title="Error Loading Notes"
          :show="!!error && !isLoadingMore"
          class="text-center"
          v-motion-fade
        >
          <p>{{ error }}</p> <!-- Message in default slot -->
          <template #actions> <!-- Button in actions slot -->
            <BaseButton
              @click="loadNotes(1)"
              variant="danger"
              size="sm"
            >
              Retry
            </BaseButton>
          </template>
        </AlertMessage>

        <!-- Content -->
        <div v-else>
          <!-- Notes Grid - Staggered Animation -->
          <div v-if="notes.length > 0">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              <NoteCard
                v-for="(note, index) in notes"
                :key="note.id"
                :note="note"
                @tag-clicked="handleTagSelected"
                :active-filter-tag="selectedTagFilter"
                v-motion
                :initial="{ opacity: 0, y: 20 }"
                :enter="{ opacity: 1, y: 0, transition: { delay: 100 + index * 50 } }"
              />
            </div>
            <!-- Sentinel & Loading More -->
            <div v-if="currentPage < totalPages" ref="sentinel" class="h-10 flex justify-center items-center mt-6">
              <div v-if="isLoadingMore" class="text-center text-gray-500 py-4">
                 <LoadingSpinner sizeClass="h-6 w-6" colorClass="text-indigo-600" class="mx-auto" />
                <p class="text-sm mt-1">Loading more...</p>
              </div>
            </div>
            <div v-else-if="!isLoading" class="text-center text-gray-400 text-sm py-4 mt-6">
              End of notes.
            </div>
          </div>

          <!-- No Notes Found / No Matches - Animate -->
          <EmptyState
            v-else
            :icon="searchTerm ? MagnifyingGlassIcon : (selectedTagFilter ? TagIcon : DocumentMagnifyingGlassIcon)"
            :title="
              searchTerm ? 'No Matches Found' :
              selectedTagFilter ? 'No Notes Found for Tag' :
              'No Public Notes Yet'
            "
            v-motion-fade
          >
            <!-- Default slot for message -->
            <p v-if="searchTerm">No public notes match your search term "{{ searchTerm }}".</p>
            <p v-else-if="selectedTagFilter">No public notes found with the tag "#{{ selectedTagFilter }}".</p>
            <p v-else>Be the first to create one!</p>

            <!-- Actions slot -->
            <template #actions>
              <RouterLink
                v-if="!searchTerm && !selectedTagFilter"
                to="/"
                class="text-indigo-600 hover:underline text-sm transition-colors duration-150 ease-in-out"
              >
                Create a Note
              </RouterLink>
              <BaseButton
                v-if="searchTerm"
                @click="searchTerm = ''"
                variant="ghost"
                size="sm"
                class="text-indigo-600 hover:underline"
              >
                Clear search
              </BaseButton>
               <BaseButton
                  v-if="selectedTagFilter && !searchTerm"
                  @click="handleTagSelected(null)"
                  variant="ghost"
                  size="sm"
                  class="text-indigo-600 hover:underline"
               >
                   Clear tag filter
               </BaseButton>
            </template>
          </EmptyState>
        </div>
      </main>

    </div>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>