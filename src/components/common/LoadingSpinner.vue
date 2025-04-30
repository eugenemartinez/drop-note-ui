<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline';

withDefaults(defineProps<{
  sizeClass?: string;
  colorClass?: string;
}>(), {
  sizeClass: 'h-5 w-5', // Default size
  colorClass: 'text-gray-500' // Default color
});
</script>

<template>
  <ArrowPathIcon
    :class="['animate-spin', sizeClass, colorClass]"
    aria-hidden="true"
  />
</template>