<script setup lang="ts">
import { computed, type PropType } from 'vue';
import IconButton from './IconButton.vue'; // For optional close button
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'; // Using solid icons for prominence

type AlertType = 'success' | 'error' | 'warning' | 'info';

const props = defineProps({
  type: {
    type: String as PropType<AlertType>,
    required: true,
    validator: (value: string) => ['success', 'error', 'warning', 'info'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  show: { // Allows controlling visibility externally via v-if on the component
    type: Boolean,
    default: true,
  },
  closable: { // Adds a close button
    type: Boolean,
    default: false,
  },
  // Message content will primarily come from the default slot
});

// --- Computed classes based on type ---
const containerClasses = computed(() => {
  switch (props.type) {
    case 'success': return 'bg-green-50 border border-green-300 text-green-800';
    case 'error':   return 'bg-red-50 border border-red-300 text-red-800';
    case 'warning': return 'bg-yellow-50 border border-yellow-300 text-yellow-800';
    case 'info':
    default:        return 'bg-blue-50 border border-blue-300 text-blue-800';
  }
});

const iconClasses = computed(() => {
   switch (props.type) {
    case 'success': return 'text-green-500';
    case 'error':   return 'text-red-500';
    case 'warning': return 'text-yellow-500';
    case 'info':
    default:        return 'text-blue-500';
  }
});

const closeButtonClasses = computed(() => {
   switch (props.type) {
    case 'success': return 'text-green-700 hover:bg-green-100 focus:ring-green-400';
    case 'error':   return 'text-red-700 hover:bg-red-100 focus:ring-red-400';
    case 'warning': return 'text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-400';
    case 'info':
    default:        return 'text-blue-700 hover:bg-blue-100 focus:ring-blue-400';
  }
});

// --- Icon component based on type ---
const IconComponent = computed(() => {
  switch (props.type) {
    case 'success': return CheckCircleIcon;
    case 'error':   return XCircleIcon;
    case 'warning': return ExclamationTriangleIcon;
    case 'info':
    default:        return InformationCircleIcon;
  }
});

</script>

<template>
  <div
    v-if="show"
    :class="['p-3 rounded-md text-center', containerClasses]"
    role="alert"
  >
    <!-- Icon (Moved above, centered, larger) -->
    <div class="mb-2"> <!-- Added margin-bottom -->
      <slot name="icon">
        <component
          :is="IconComponent"
          :class="['h-8 w-8 mx-auto', iconClasses]"
          aria-hidden="true"
        />
      </slot>
    </div>

    <!-- Content (Removed flex-1, adjusted margins) -->
    <div class="text-sm">
      <p v-if="title" class="font-medium mb-1">{{ title }}</p>
      <!-- Removed prose classes for simpler centering -->
      <div>
        <slot></slot> <!-- Main message content goes here -->
      </div>
      <div v-if="$slots.actions" class="mt-3">
        <slot name="actions"></slot> <!-- Slot for action buttons -->
      </div>
    </div>

    <!-- Close Button (Positioning might need adjustment if used with stacked layout) -->
    <!-- For simplicity, let's assume closable isn't the primary use case for this stacked style for now -->
    <!-- If needed, we'd likely position it absolutely in a corner -->
     <div v-if="closable" class="absolute top-2 right-2"> <!-- Example: Absolute positioning -->
       <IconButton
          @click="$emit('close')"
          title="Dismiss alert"
          variant="ghost"
          size="sm"
          :class="['rounded-md', closeButtonClasses]"
        >
          <XMarkIcon class="h-5 w-5" />
        </IconButton>
    </div>
  </div>
</template>

<style scoped>
/* Removed prose styles as they might interfere with simple centering */
/* Add specific styles if needed */

/* Ensure the parent div is relative if using absolute positioning for close button */
/* This might need to be added where AlertMessage is used if closable=true */
/* .relative { position: relative; } */
</style>