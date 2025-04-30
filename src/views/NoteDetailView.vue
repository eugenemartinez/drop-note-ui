<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { fetchNoteById, updateNote, deleteNote as apiDeleteNote } from '@/services/apiService';
import type { Note } from '@/types/note';
import { useSavedNotes } from '@/composables/useSavedNotes';
import { useNotifications } from '@/composables/useNotifications';
import EditNoteModal from '@/components/EditNoteModal.vue';
import DeleteNoteModal from '@/components/DeleteNoteModal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconButton from '@/components/common/IconButton.vue';
import BaseButton from '@/components/common/BaseButton.vue'; // <-- Import BaseButton
import AlertMessage from '@/components/common/AlertMessage.vue'; // <-- Import AlertMessage
// --- Add Headless UI Imports ---
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import {
    BookmarkIcon as BookmarkOutlineIcon,
    PencilIcon,
    TrashIcon,
    EllipsisHorizontalCircleIcon // Or your preferred ellipsis icon
} from '@heroicons/vue/24/outline';
import {
    BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/vue/24/solid';

const props = defineProps<{ id: string; }>();
const router = useRouter(); // Router instance
const note = ref<Note | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const { isNoteSaved, toggleSaveNote, unsaveNote } = useSavedNotes();
const isCurrentNoteSaved = computed(() => isNoteSaved(props.id));
const showEditModal = ref(false);
const isUpdating = ref(false);
const updateError = ref<string | null>(null);
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);
const { addNotification } = useNotifications();

const handleSaveToggle = () => {
    toggleSaveNote(props.id);
};
const openEditModal = () => {
    updateError.value = null;
    showEditModal.value = true;
};
const closeEditModal = () => {
    showEditModal.value = false;
};
const handleNoteUpdate = async (payload: { id: string; modificationCode: string; formData: any }) => {
    isUpdating.value = true;
    updateError.value = null;
    try {
        const updatedNoteData = await updateNote(payload.id, {
            ...payload.formData,
            modification_code: payload.modificationCode
        });
        note.value = updatedNoteData;
        showEditModal.value = false;
        addNotification('Note updated successfully!', 'success');
    } catch (err: any) {
        console.error("Error updating note:", err);
        updateError.value = err.message || 'Failed to update note.';
    } finally {
        isUpdating.value = false;
    }
};
const openDeleteModal = () => {
    deleteError.value = null;
    showDeleteModal.value = true;
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
};
const handleNoteDelete = async (payload: { id: string; modificationCode: string }) => {
    isDeleting.value = true;
    deleteError.value = null;
    try {
        await apiDeleteNote(payload.id, payload.modificationCode);
        showDeleteModal.value = false;
        if (isNoteSaved(payload.id)) {
            unsaveNote(payload.id);
        }
        addNotification("Note deleted successfully!", 'success');
        router.push({ name: 'PublicNotes' });
    } catch (err: any) {
        console.error("Error deleting note:", err);
        deleteError.value = err.message || 'Failed to delete note.';
    } finally {
        isDeleting.value = false;
    }
};
const loadNote = async (noteId: string) => {
  isLoading.value = true;
  error.value = null;
  note.value = null;
  try {
    const fetchedNote = await fetchNoteById(noteId);
    note.value = fetchedNote;
  } catch (err: any) {
    console.error("Error in loadNote:", err);
    error.value = err.message || 'Failed to load note details.';
    note.value = null;
  } finally {
    isLoading.value = false;
  }
};
const formattedCreatedAt = computed(() => {
    return note.value?.created_at ? new Date(note.value.created_at).toLocaleString() : 'N/A';
});
const formattedUpdatedAt = computed(() => {
    return note.value?.updated_at ? new Date(note.value.updated_at).toLocaleString() : 'N/A';
});
onMounted(() => { loadNote(props.id); });
watch(() => props.id, (newId) => { loadNote(newId); });

// --- Add this handler function ---
const handleTagClick = (tag: string) => {
    router.push({ name: 'PublicNotes', query: { tag: tag } });
};
// --- End handler function ---

</script>

<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto">
    <!-- Back Link - Animate -->
    <RouterLink
      to="/notes"
      class="text-indigo-600 hover:underline mb-4 inline-block text-sm transition-colors duration-150 ease-in-out"
      v-motion
      :initial="{ opacity: 0, x: -10 }"
      :enter="{ opacity: 1, x: 0, transition: { delay: 100 } }"
    >
      &larr; Back to Public Notes
    </RouterLink>

    <!-- Loading State - Simple fade -->
    <div
      v-if="isLoading"
      class="text-center py-12"
      v-motion-fade
    >
      <LoadingSpinner sizeClass="h-8 w-8" colorClass="text-indigo-600" class="mx-auto" />
      <p class="mt-2 text-sm text-gray-500">Loading note...</p>
    </div>

    <!-- Error State - Simple fade -->
    <AlertMessage
      v-else-if="error"
      type="error"
      title="Error Loading Note"
      :show="!!error"
      class="text-center"
      v-motion-fade
    >
      <p>{{ error }}</p>
      <template #actions>
        <BaseButton
          @click="loadNote(id)"
          variant="danger"
          size="sm"
        >
          Retry
        </BaseButton>
      </template>
    </AlertMessage>

    <!-- Content State - Animate the container -->
    <div
      v-else-if="note"
      class="bg-white p-4 sm:p-6 rounded-lg shadow-md"
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 150 } }"
    >
      <!-- Header: Title and Actions - Animate children with slight delay -->
      <div class="flex justify-between items-start mb-4 border-b border-gray-200 pb-4 gap-3">
        <h1
          class="text-2xl sm:text-3xl font-bold text-gray-800 break-words mr-4"
          v-motion
          :initial="{ opacity: 0, x: -10 }"
          :enter="{ opacity: 1, x: 0, transition: { delay: 200 } }"
        >
            {{ note.title }}
        </h1>

        <!-- Responsive Actions Container - Animate -->
        <div
          class="relative z-10 flex-shrink-0"
          v-motion
          :initial="{ opacity: 0, x: 10 }"
          :enter="{ opacity: 1, x: 0, transition: { delay: 250 } }"
        >
          <!-- Ellipsis Menu (< lg screens) -->
          <div class="lg:hidden">
            <Menu as="div" class="relative inline-block text-left">
              <div>
                <MenuButton class="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors duration-150">
                  <span class="sr-only">Open options</span>
                  <EllipsisHorizontalCircleIcon class="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
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
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <button @click="handleSaveToggle" :class="[ active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'group flex w-full items-center px-4 py-2 text-sm']">
                        <BookmarkSolidIcon v-if="isCurrentNoteSaved" class="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                        <BookmarkOutlineIcon v-else class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                        {{ isCurrentNoteSaved ? 'Unsave Note' : 'Save to My Notes' }}
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button @click="openEditModal" :class="[ active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'group flex w-full items-center px-4 py-2 text-sm']">
                        <PencilIcon class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                        Edit
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button @click="openDeleteModal" :class="[ active ? 'bg-red-100 text-red-900' : 'text-red-700', 'group flex w-full items-center px-4 py-2 text-sm']">
                        <TrashIcon class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" aria-hidden="true" />
                        Delete
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>

          <!-- Individual Buttons (>= lg screens) -->
          <div class="hidden lg:flex lg:space-x-2">
            <!-- Save Button -->
            <IconButton
              @click="handleSaveToggle"
              :title="isCurrentNoteSaved ? 'Remove from My Notes' : 'Save to My Notes'"
              variant="primary"
              size="md"
              :class="isCurrentNoteSaved ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : ''"
            >
              <BookmarkSolidIcon v-if="isCurrentNoteSaved" class="h-6 w-6" aria-hidden="true" />
              <BookmarkOutlineIcon v-else class="h-6 w-6" aria-hidden="true" />
            </IconButton>
            <!-- Edit Button -->
            <IconButton
              @click="openEditModal"
              title="Edit Note"
              variant="warning"
              size="md"
            >
              <PencilIcon class="h-6 w-6" aria-hidden="true" />
            </IconButton>
            <!-- Delete Button -->
            <IconButton
              @click="openDeleteModal"
              title="Delete Note"
              variant="danger"
              size="md"
            >
              <TrashIcon class="h-6 w-6" aria-hidden="true" />
            </IconButton>
          </div>

        </div>
        <!-- End Responsive Actions Container -->

      </div>

      <!-- Meta Info - Animate -->
      <div
        class="text-sm text-gray-500 mb-4 flex flex-col space-y-1 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2 sm:space-y-0 lg:flex lg:flex-row lg:space-x-6 lg:gap-0 lg:space-y-0"
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 300 } }"
      >
        <span>By: <strong class="text-gray-700">{{ note.username }}</strong></span>
        <span>Visibility: <strong class="text-gray-700 capitalize">{{ note.visibility }}</strong></span>
        <span>Created: <strong class="text-gray-700">{{ formattedCreatedAt }}</strong></span>
        <span>Updated: <strong class="text-gray-700">{{ formattedUpdatedAt }}</strong></span>
      </div>

      <!-- Tags - Animate -->
      <div
        v-if="note.tags && note.tags.length > 0"
        class="mb-6 flex flex-wrap gap-2 items-center"
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 350 } }"
      >
        <span class="text-sm text-gray-500 mr-1">Tags:</span>
        <button
          v-for="tag in note.tags"
          :key="tag"
          @click="handleTagClick(tag)"
          :title="`Filter by tag: ${tag}`"
          class="bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-150 ease-in-out hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer hover:scale-105"
        >
          #{{ tag }}
        </button>
      </div>

      <!-- Content - Animate -->
      <div
        v-html="note.content"
        class="prose max-w-none mt-4 text-gray-800"
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 400 } }"
      ></div>

    </div>

    <!-- Edit Note Modal - No external motion -->
    <EditNoteModal
        :show="showEditModal"
        :note="note"
        :is-updating="isUpdating"
        :update-error="updateError"
        @close="closeEditModal"
        @submit-update="handleNoteUpdate"
    >
    </EditNoteModal>

    <!-- Delete Note Modal - No external motion -->
    <DeleteNoteModal
        :show="showDeleteModal"
        :note-id="note?.id ?? null"
        :is-deleting="isDeleting"
        :delete-error="deleteError"
        @close="closeDeleteModal"
        @confirm-delete="handleNoteDelete"
    />

  </div>
</template>

<style scoped>
/* ... styles ... */
</style>