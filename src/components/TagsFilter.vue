<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchPublicTags } from '@/services/apiService';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import EmptyState from '@/components/common/EmptyState.vue'; // <-- Import EmptyState
import { TagIcon } from '@heroicons/vue/24/outline'; // <-- Import TagIcon

// --- Props ---
const props = defineProps<{
  currentFilterTag: string | null // Prop to receive the active filter from parent
}>();
// --- End Props ---

// State
const availableTags = ref<string[]>([]);
const isLoadingTags = ref<boolean>(true);
const tagsError = ref<string | null>(null);

// Emits
const emit = defineEmits<{
  (e: 'tag-selected', tag: string | null): void
}>();

// Methods
const selectTag = (tag: string | null) => {
  emit('tag-selected', tag);
};

const loadTags = async () => {
  isLoadingTags.value = true;
  tagsError.value = null;
  try {
    const tags = await fetchPublicTags();
    availableTags.value = tags;
  } catch (err: any) {
    console.error("[TagsFilter] Error loading tags:", err);
    tagsError.value = err.message || 'Failed to load tags.';
    availableTags.value = []; // Clear tags on error
  } finally {
    isLoadingTags.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadTags();
});
</script>

<template>
  <div class="p-4 bg-gray-50 rounded-md border border-gray-200">
    <h3 class="text-lg font-semibold mb-4 text-gray-700">Filter by Tag</h3>

    <!-- Loading State -->
    <div v-if="isLoadingTags" class="text-center text-gray-500 py-3">
      <LoadingSpinner sizeClass="h-5 w-5" colorClass="text-gray-400" class="mx-auto" />
      <p class="text-sm mt-1">Loading tags...</p>
    </div>

    <!-- Error State -->
    <AlertMessage
      v-else-if="tagsError"
      type="error"
      title="Error Loading Tags"  
      :show="!!tagsError"
      class="text-sm text-center" 
    >
      <p>{{ tagsError }}</p>
      <template #actions>
        <BaseButton
          @click="loadTags"
          variant="danger" 
          size="sm"      
        >
          Retry
        </BaseButton>
      </template>
    </AlertMessage>

    <!-- Tags List or Empty State -->
    <div v-else>
      <!-- Show list only if tags exist -->
      <ul v-if="availableTags.length > 0" class="space-y-2">
        <li>
          <button @click="selectTag(null)" :class="[
              'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer hover:translate-x-1', // <-- Updated classes
              props.currentFilterTag === null
                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            ]">
            All Notes
          </button>
        </li>
        <li v-for="tag in availableTags" :key="tag">
          <button @click="selectTag(tag)" :class="[
              'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer hover:translate-x-1', // <-- Updated classes
              props.currentFilterTag === tag
                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            ]">
            #{{ tag }}
          </button>
        </li>
      </ul>
      <!-- Use EmptyState when no tags are available -->
      <EmptyState
        v-else
        :icon="TagIcon"
        title="No Tags Found"
        class="py-3 text-sm"
      >
        <p>There are currently no tags on public notes.</p>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
/* Add specific styles if needed */
</style>