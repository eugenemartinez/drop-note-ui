<script setup lang="ts">
import { computed, type PropType } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

// Define allowed variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon'; // <-- Added 'xs' and 'icon'

const props = defineProps({
  variant: {
    type: String as PropType<ButtonVariant>,
    default: 'primary',
  },
  size: {
    type: String as PropType<ButtonSize>,
    default: 'md',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: 'button',
  },
  // Allow any other attributes like 'title', 'aria-label', etc.
  // We don't need to explicitly define them if we use $attrs
});

const emit = defineEmits(['click']);

// --- Updated baseClasses ---
const baseClasses = 'inline-flex items-center justify-center border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out cursor-pointer'; // Added transition-all (covers colors, shadow, transform), ease-in-out

const variantClasses = computed(() => {
  // Common hover effect for solid buttons
  const solidHover = 'hover:shadow-lg hover:-translate-y-px'; // Lift and shadow effect

  switch (props.variant) {
    case 'secondary':
      // Slightly darker background and border on hover
      return `bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 focus:ring-indigo-500 ${solidHover}`;
    case 'danger':
      // Darker red on hover
      return `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 ${solidHover}`;
    case 'warning':
       // Darker yellow on hover
      return `bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 ${solidHover}`;
    case 'ghost':
      // Slightly darker background, no shadow/lift for ghost
      return 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-indigo-500 shadow-none';
    case 'primary':
    default:
      // Darker indigo on hover
      return `bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 ${solidHover}`;
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': // <-- Added 'xs' size
      return 'px-2.5 py-1 text-xs';
    case 'sm':
      return 'px-3 py-2 text-sm leading-4';
    case 'lg':
      return 'px-4 py-2 text-base';
    case 'icon': // <-- Added 'icon' size
      return 'p-2'; // Simple padding for icon buttons
    case 'md':
    default:
      return 'px-4 py-2 text-sm';
  }
});

const stateClasses = computed(() => {
  if (props.disabled || props.loading) {
    return 'opacity-60 cursor-not-allowed';
  }
  return '';
});

const blockClasses = computed(() => {
  return props.block ? 'w-full' : '';
});

const combinedClasses = computed(() => {
  return [
    baseClasses,
    variantClasses.value,
    sizeClasses.value,
    stateClasses.value,
    blockClasses.value,
  ].join(' ');
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :type="props.type"
    :class="combinedClasses"
    :disabled="props.disabled || props.loading"
    @click="handleClick"
    v-bind="$attrs"
  >
    <LoadingSpinner v-if="loading" sizeClass="h-4 w-4" :colorClass="variant === 'primary' || variant === 'danger' || variant === 'warning' ? 'text-white' : 'text-gray-500'" class="mr-2" />
    <slot></slot>
  </button>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>