<script setup lang="ts">
import type { FunctionalComponent, HTMLAttributes, VNodeProps } from 'vue';

defineProps<{
  icon?: FunctionalComponent<HTMLAttributes & VNodeProps>;
  title: string;
  // Message content will come from the default slot
}>();
</script>

<template>
  <div class="text-center py-10 px-4">
    <!-- Optional Icon -->
    <component
      v-if="icon"
      :is="icon"
      class="mx-auto h-12 w-12 text-gray-400 mb-3"
      aria-hidden="true"
    />

    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-700 mb-1">{{ title }}</h3>

    <!-- Message/Description (via default slot) -->
    <div class="text-sm text-gray-500">
      <slot></slot>
    </div>

    <!-- Actions (via actions slot) -->
    <div v-if="$slots.actions" class="mt-4">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped>
/* Add specific styles if needed */
</style>