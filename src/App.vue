<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue' // Import the layout
</script>

<template>
  <MainLayout>
    <!-- RouterView renders the matched component inside the layout's slot -->
    <router-view />
  </MainLayout>
</template>

<style scoped>
/* Keep this empty or add global layout styles if preferred over index.css */
</style>
