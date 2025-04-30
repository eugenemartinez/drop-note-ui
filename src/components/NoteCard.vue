<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router'; // Import useRouter
import type { Note } from '@/types/note';
import { useSavedNotes } from '@/composables/useSavedNotes';
import IconButton from '@/components/common/IconButton.vue'; // <-- Import IconButton
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  note: Note;
  activeFilterTag: string | null;
}>();

const emit = defineEmits<{
  (e: 'tag-clicked', tag: string): void
}>();

const router = useRouter(); // Get router instance

const { isNoteSaved, toggleSaveNote } = useSavedNotes();
const isCurrentNoteSaved = computed(() => isNoteSaved(props.note.id));

const truncatedContent = computed(() => {
  const maxLength = 150;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = props.note.content;
  const plainText = tempDiv.textContent || tempDiv.innerText || "";
  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength) + '...';
  }
  return plainText;
});

const formattedDate = computed(() => {
  const dateToShow = (props.note.updated_at && props.note.updated_at !== props.note.created_at)
    ? props.note.updated_at
    : props.note.created_at;
  return new Date(dateToShow).toLocaleDateString();
});

const handleSaveToggle = () => {
    toggleSaveNote(props.note.id);
};

const handleTagClick = (tag: string) => {
    emit('tag-clicked', tag);
};

// --- Navigation Handler ---
const navigateToNote = () => {
    router.push({ name: 'NoteDetail', params: { id: props.note.id } });
};
// --- End Navigation Handler ---

</script>

<template>
  <div
    @click="navigateToNote"
    class="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 ease-in-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-px"
  >
    <div class="p-4 border-b border-gray-100 flex justify-between items-start">
        <h3 class="text-lg font-semibold text-indigo-700 mr-2 hover:underline">
            {{ note.title }}
        </h3>
        <!-- Replace Save button with IconButton -->
        <IconButton
            @click.stop="handleSaveToggle"
            :title="isCurrentNoteSaved ? 'Remove from My Notes' : 'Save to My Notes'"
            variant="primary"
            size="sm"
            class="flex-shrink-0"
            :class="isCurrentNoteSaved
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' /* Active state override */
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100' /* Inactive state override (optional, variant handles hover) */
            "
        >
            <BookmarkSolidIcon v-if="isCurrentNoteSaved" class="h-5 w-5" />
            <BookmarkOutlineIcon v-else class="h-5 w-5" />
        </IconButton>
    </div>

    <div class="p-4 flex-grow">
      <p class="text-sm text-gray-600 mb-3 line-clamp-3">
        {{ truncatedContent }}
      </p>
    </div>

    <div class="px-4 pb-2 text-xs text-gray-400 flex justify-end items-center space-x-2">
       <span class="truncate" :title="note.username">@{{ note.username }}</span>
       <span>&bull;</span>
       <span>{{ formattedDate }}</span>
    </div>

    <div class="p-4 bg-gray-50 border-t border-gray-100">
       <div class="flex flex-wrap gap-1">
         <!-- Keep tag buttons as standard <button> -->
         <button
           v-if="note.tags && note.tags.length > 0"
           v-for="tag in note.tags.slice(0, 3)"
           :key="tag"
           @click.stop="handleTagClick(tag)"
           :title="`Filter by tag: ${tag}`"
           class="px-2 py-0.5 rounded-full text-[10px] transition-all duration-150 ease-in-out cursor-pointer hover:scale-105"
           :class="props.activeFilterTag === tag
             ? 'bg-indigo-100 text-indigo-700 font-semibold' /* Active state - no hover change needed here */
             : 'bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700' /* Inactive state - hover colors already defined */
           "
         >
           #{{ tag }}
         </button>
         <span v-if="note.tags && note.tags.length > 3" class="text-gray-400 text-[10px] self-center">
            +{{ note.tags.length - 3 }} more
         </span>
       </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles for NoteCard */
</style>