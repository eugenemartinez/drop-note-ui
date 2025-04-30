<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import IconButton from '@/components/common/IconButton.vue'; // <-- Import IconButton
// Separate value and type imports for focus-trap
import { createFocusTrap } from 'focus-trap';
import type { FocusTrap } from 'focus-trap'; // Use type-only import

const props = defineProps<{
  show: boolean;
  title?: string;
  maxWidthClass?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const modalRef = ref<HTMLDivElement | null>(null);
let trap: FocusTrap | null = null;

// Handle Escape key to close - Keep existing logic
watch(() => props.show, (newValue) => {
    if (newValue) {
        const listener = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                emit('close');
            }
        };
        document.addEventListener('keydown', listener);
        // Cleanup listener when modal closes
        watch(() => props.show, (isShowing) => {
            if (!isShowing) {
                document.removeEventListener('keydown', listener);
            }
        }, { immediate: true }); // Run immediately to remove if closed before Escape is pressed
    }
});


// --- Focus Trapping Logic ---
watch(() => props.show, async (newValue) => {
  if (newValue) {
    await nextTick();
    await nextTick();

    if (modalRef.value) {
      trap = createFocusTrap(modalRef.value, {
        initialFocus: false,
        fallbackFocus: modalRef.value,
        onActivate: () => {},
        onDeactivate: () => {},
        // Allow clicks outside the trap to proceed
        allowOutsideClick: true, // Add this option
        clickOutsideDeactivates: false, // Keep this false, we handle deactivation via @click.self
        escapeDeactivates: false
      });
      trap.activate(); // Re-enable activation
    }
  } else {
    if (trap) {
      trap.deactivate(); // Re-enable deactivation
      trap = null;
    }
  }
}, { immediate: true });

</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 bg-opacity-90"
        @click.self="emit('close')"
      >
        <div
          ref="modalRef"
          :class="[
            'bg-white rounded-lg shadow-xl w-full m-4 overflow-hidden',
            props.maxWidthClass || 'max-w-lg'
          ]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
          tabindex="-1"
        >

          <div v-if="title || $slots.header" class="flex justify-between items-center p-4 border-b border-gray-200">
            <slot name="header">
              <h2 v-if="title" id="modal-title" class="text-lg font-semibold text-gray-800">{{ title }}</h2>
            </slot>
            <!-- Replace button with IconButton -->
            <IconButton
              @click="emit('close')"
              title="Close modal"
              variant="ghost"
              size="sm"
              class="-mr-1"
            >
              <XMarkIcon class="h-6 w-6" /> <!-- Keep original icon size -->
            </IconButton>
          </div>

          <div class="p-5">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="px-4 py-3 bg-gray-50 border-t border-gray-200 text-right">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Optional: Add transition for the modal content itself */
.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
    transition: transform 0.3s ease;
}
.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
    transform: scale(0.95);
}
</style>