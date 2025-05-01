<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from '@vueuse/core';
import BaseModal from '@/components/common/BaseModal.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  show: boolean;
  noteUrl: string;
  noteTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { copy, copied, isSupported } = useClipboard({ source: props.noteUrl, copiedDuring: 1500 });

const modalTitle = computed(() => props.noteTitle ? `Share "${props.noteTitle}"` : 'Share this Note');

const handleCopy = () => {
  if (isSupported.value) {
    copy(props.noteUrl);
  } else {
    // Handle browsers that don't support clipboard API (rare)
    console.error('Clipboard API not supported.');
    // Optionally show an alert or different message
  }
};
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="modalTitle"
    @close="emit('close')"
    max-width-class="max-w-md"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600">
        Copy the link below to share this note:
      </p>

      <!-- Updated URL Display and Copy Button -->
      <button
        type="button"
        @click="handleCopy"
        class="relative w-full bg-gray-100 px-4 py-3 rounded-md border border-gray-200 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer text-left"
        :class="copied
            ? 'bg-green-100 ring-1 ring-inset ring-green-200 hover:bg-green-200'
            : 'hover:bg-gray-200'"
        :title="copied ? 'URL copied to clipboard!' : 'Click to copy URL'"
      >
        <!-- URL Text -->
        <span class="block font-mono text-sm text-indigo-800 select-all break-all pr-8"> <!-- Added pr-8 for icon spacing -->
          {{ props.noteUrl }}
        </span>

        <!-- Copy/Check Icon -->
        <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"> <!-- Added pointer-events-none -->
          <CheckIcon v-if="copied" class="h-5 w-5 text-green-600" aria-hidden="true" />
          <ClipboardDocumentIcon v-else class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </button>
      <!-- End Updated URL Display -->


      <p v-if="!isSupported" class="text-xs text-red-600 text-center">
        Clipboard API not supported in your browser. Please copy the URL manually.
      </p>
       <p v-else-if="copied" class="text-xs text-green-600 text-center">
        URL copied to clipboard!
      </p>

    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">
        Close
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
/* No specific styles needed now, handled by Tailwind */
</style>