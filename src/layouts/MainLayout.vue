<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { fetchRandomNoteId } from '@/services/apiService';
import { useNotifications } from '@/composables/useNotifications';
import NotificationArea from '@/components/NotificationArea.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import IconButton from '@/components/common/IconButton.vue'; // <-- Import IconButton
import {
    ListBulletIcon,
    BookmarkIcon,
    QuestionMarkCircleIcon,
    DocumentTextIcon,
    Bars3Icon, // Hamburger icon
    XMarkIcon // Close icon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const { addNotification } = useNotifications();
const isFetchingRandom = ref(false);
const isMobileMenuOpen = ref(false); // State for mobile menu

const goToRandomNote = async () => {
  if (isFetchingRandom.value) return;
  isFetchingRandom.value = true;
  try {
    const randomId = await fetchRandomNoteId();
    router.push({ name: 'NoteDetail', params: { id: randomId } });
    isMobileMenuOpen.value = false; // Close menu on navigation
  } catch (error: any) {
    console.error("Error navigating to random note:", error);
    addNotification(`Could not fetch a random note: ${error.message || 'Unknown error'}`, 'error');
  } finally {
    isFetchingRandom.value = false;
  }
};

// Close menu when navigating via RouterLink
const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <!-- Logo/Brand -->
        <RouterLink to="/" class="text-xl font-bold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors duration-150 ease-in-out" @click="closeMobileMenu">
          <DocumentTextIcon class="h-6 w-6 mr-1.5" />
          DropNote
        </RouterLink>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center space-x-4">
          <RouterLink
            to="/notes"
            class="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors duration-150 ease-in-out"
            active-class="text-indigo-700 bg-indigo-50"
          >
            <ListBulletIcon class="h-4 w-4 mr-1" /> Public Notes
          </RouterLink>
          <RouterLink
            to="/my-notes"
            class="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors duration-150 ease-in-out"
            active-class="text-indigo-700 bg-indigo-50"
          >
            <BookmarkIcon class="h-4 w-4 mr-1" /> My Notes
          </RouterLink>
          <!-- BaseButton already has transitions -->
          <BaseButton
            @click="goToRandomNote"
            :disabled="isFetchingRandom"
            :loading="isFetchingRandom"
            variant="warning"
            size="sm"
          >
            <QuestionMarkCircleIcon v-if="!isFetchingRandom" class="h-4 w-4 mr-1" />
            {{ isFetchingRandom ? 'Finding...' : 'Random Note' }}
          </BaseButton>
        </div>

        <!-- Mobile Menu Button (IconButton already has transitions) -->
        <div class="md:hidden">
          <IconButton
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            :title="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
            variant="ghost"
            size="md"
            class="rounded-md"
          >
            <Bars3Icon v-if="!isMobileMenuOpen" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </IconButton>
        </div>
      </nav>

      <!-- Mobile Menu Panel -->
      <div v-if="isMobileMenuOpen" class="md:hidden bg-white border-t border-gray-100">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <RouterLink
            to="/notes"
            @click="closeMobileMenu"
            class="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out"
            active-class="text-indigo-700 bg-indigo-100"
          >
            <ListBulletIcon class="h-5 w-5 mr-2 inline-block" /> Public Notes
          </RouterLink>
          <RouterLink
            to="/my-notes"
            @click="closeMobileMenu"
            class="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out"
            active-class="text-indigo-700 bg-indigo-100"
          >
            <BookmarkIcon class="h-5 w-5 mr-2 inline-block" /> My Notes
          </RouterLink>
          <!-- BaseButton already has transitions -->
          <BaseButton
            @click="goToRandomNote"
            :disabled="isFetchingRandom"
            :loading="isFetchingRandom"
            variant="warning"
            size="md"
            block
            class="text-left justify-start bg-yellow-100 hover:bg-yellow-200"
          >
             <QuestionMarkCircleIcon v-if="!isFetchingRandom" class="h-5 w-5 mr-2" />
             {{ isFetchingRandom ? 'Finding...' : 'Random Note' }}
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow container mx-auto px-4 py-6">
      <slot></slot>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-100 text-center py-4 text-sm text-gray-500">
      &copy; {{ new Date().getFullYear() }} DropNote. All rights reserved.
    </footer>

    <NotificationArea />
  </div>
</template>

<style scoped>

.sticky {
    position: sticky;
    top: 0;
}
</style>