<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications';
import IconButton from '@/components/common/IconButton.vue'; // <-- Import IconButton
// --- Add Heroicons Imports ---
import { XMarkIcon } from '@heroicons/vue/24/outline'; // Or solid
// --- End Heroicons Imports ---

const { notifications, removeNotification } = useNotifications();

// Computed property to map notification types to CSS classes
const notificationClasses = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
        case 'success': return 'bg-green-100 border-green-400 text-green-700';
        case 'error': return 'bg-red-100 border-red-400 text-red-700';
        case 'warning': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
        case 'info':
        default: return 'bg-blue-100 border-blue-400 text-blue-700';
    }
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 space-y-3 w-full max-w-xs sm:max-w-sm">
    <transition-group name="list" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['border-l-4 p-4 rounded-md shadow-lg flex justify-between items-start', notificationClasses(notification.type)]"
        role="alert"
      >
        <p class="text-sm mr-2">{{ notification.message }}</p>
        <!-- Replace button with IconButton -->
        <IconButton
          @click="removeNotification(notification.id)"
          :title="`Close notification: ${notification.message}`"
          variant="ghost"
          size="sm"
          class="ml-auto -mx-1.5 -my-1.5 rounded-lg"
          :class="[
              notification.type === 'success' ? 'text-green-700 hover:bg-green-200 focus:ring-green-400' : '',
              notification.type === 'error' ? 'text-red-700 hover:bg-red-200 focus:ring-red-400' : '',
              notification.type === 'warning' ? 'text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-400' : '',
              notification.type === 'info' ? 'text-blue-700 hover:bg-blue-200 focus:ring-blue-400' : ''
          ]"
        >
          <XMarkIcon class="h-5 w-5" />
        </IconButton>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
/* Transition styles for list items */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>