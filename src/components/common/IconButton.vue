<script setup lang="ts">
import { computed, type PropType } from 'vue';

// Define allowed variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg'; // Controls padding

const props = defineProps({
  variant: {
    type: String as PropType<ButtonVariant>,
    default: 'ghost',
  },
  size: {
    type: String as PropType<ButtonSize>,
    default: 'md',
  },
  title: { // For accessibility
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: 'button',
  },
  // Allow any other attributes like 'aria-label' etc. via $attrs
});

const emit = defineEmits(['click']);

// Base classes for all icon buttons
const baseClasses = 'inline-flex items-center justify-center rounded-full transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-110'; // Changed transition-colors to transition-all, added ease-in-out, added hover:scale-110

// Size classes based on padding
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'p-1.5'; // Smaller padding, e.g., notification close
    case 'lg': return 'p-2.5'; // Larger padding if needed
    case 'md':
    default: return 'p-2'; // Default padding, e.g., detail view actions
  }
});

// Variant classes - Define base text color and hover/focus states
const variantClasses = computed(() => {
  // Base text colors (icon color)
  let baseTextColor = 'text-gray-500'; // Default for ghost/secondary
  if (props.variant === 'primary') baseTextColor = 'text-indigo-600';
  else if (props.variant === 'danger') baseTextColor = 'text-red-600';
  else if (props.variant === 'warning') baseTextColor = 'text-yellow-600';

  // Hover background and text colors + Focus ring color
  switch (props.variant) {
    case 'primary':
      return `${baseTextColor} hover:bg-indigo-100 hover:text-indigo-700 focus:ring-indigo-500`;
    case 'secondary':
      return `${baseTextColor} hover:bg-gray-100 hover:text-gray-700 focus:ring-gray-500`;
    case 'danger':
      return `${baseTextColor} hover:bg-red-100 hover:text-red-700 focus:ring-red-500`;
    case 'warning':
      return `${baseTextColor} hover:bg-yellow-100 hover:text-yellow-700 focus:ring-yellow-500`;
    case 'ghost':
    default:
      return `${baseTextColor} hover:bg-gray-100 hover:text-gray-700 focus:ring-indigo-500`; // Default focus to indigo
  }
});

// Combine all classes
const combinedClasses = computed(() => {
  return [
    baseClasses,
    sizeClasses.value,
    variantClasses.value,
  ].join(' ');
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :type="props.type"
    :class="combinedClasses"
    :disabled="props.disabled"
    :title="props.title"
    :aria-label="props.title"
    @click="handleClick"
    v-bind="$attrs"
  >
    <slot></slot> <!-- Icon goes here -->
  </button>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>