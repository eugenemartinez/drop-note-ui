<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import NoteForm from '@/components/NoteForm.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import AlertMessage from '@/components/common/AlertMessage.vue'; // <-- Import AlertMessage
import { createNote, fetchRandomNoteId } from '@/services/apiService';
import type { Note } from '@/types/note';
import { useClipboard } from '@/composables/useClipboard';
import { useNotifications } from '@/composables/useNotifications';
// --- Add Heroicons Imports ---
import {
    ListBulletIcon,
    QuestionMarkCircleIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'; // Or solid
// --- End Heroicons Imports ---

const router = useRouter();
const { copy, copied: codeCopied } = useClipboard();
const { addNotification } = useNotifications(); // Get the add function

// State for handling submission result
const submissionStatus = ref<'idle' | 'submitting' | 'success' | 'error'>('idle');
const submissionError = ref<string | null>(null);
const createdNote = ref<Note & { modification_code: string } | null>(null);
const showSuccessModal = ref(false); // Control modal visibility
const isFetchingRandom = ref(false); // Add loading state for random button

// Updated function for random note navigation
// Note: This button and logic are now in MainLayout.vue, so this function in HomeView is likely redundant
// If you still have a random button specifically on HomeView, keep this, otherwise it can be removed.
// For now, I'll update it assuming it might still be used here.
const goToRandomNote = async () => {
  if (isFetchingRandom.value) return;

  isFetchingRandom.value = true;
  try {
    const randomId = await fetchRandomNoteId();
    router.push({ name: 'NoteDetail', params: { id: randomId } });
  } catch (error: any) {
    console.error("Error navigating to random note:", error);
    // --- Replace alert with notification ---
    // alert(`Could not fetch a random note: ${error.message}`);
    addNotification(`Could not fetch a random note: ${error.message || 'Unknown error'}`, 'error');
    // --- End Replace ---
  } finally {
    isFetchingRandom.value = false;
  }
};

// Handle the 'submitNote' event emitted by NoteForm
const handleNoteSubmit = async (formData: any) => {
  submissionStatus.value = 'submitting';
  submissionError.value = null;
  createdNote.value = null;
  showSuccessModal.value = false; // Ensure modal is closed initially

  try {
    const result = await createNote(formData);
    createdNote.value = result;
    submissionStatus.value = 'success';
    showSuccessModal.value = true; // Show the modal on success
    // --- Add success notification (optional, complements the modal) ---
    addNotification('Note created! Save your modification code.', 'success', 5000); // Longer duration
    // --- End Add ---

  } catch (err: any) {
    submissionError.value = err.message || 'An unknown error occurred while creating the note.';
    submissionStatus.value = 'error';
    // --- Add error notification ---
    addNotification(`Error creating note: ${submissionError.value}`, 'error');
    // --- End Add ---
  } finally {
      // Ensure submitting state is turned off even if modal logic runs
      if (submissionStatus.value === 'submitting') {
          submissionStatus.value = 'idle'; // Reset if still submitting (e.g., error occurred before success)
      }
  }
};

// Function called when user acknowledges the modal
const acknowledgeCreation = () => {
  showSuccessModal.value = false; // Close the modal
  if (createdNote.value) {
    // Redirect to the new note's detail page
    router.push({ name: 'NoteDetail', params: { id: createdNote.value.id } });
    // Reset state for potential next creation after navigation
    submissionStatus.value = 'idle';
    createdNote.value = null;
  } else {
      // Fallback: just reset the form state if redirection isn't possible
      resetFormState();
  }
};

// Function to reset the form state without redirecting
const resetFormState = () => {
    submissionStatus.value = 'idle';
    createdNote.value = null;
    submissionError.value = null;
    showSuccessModal.value = false;
    // Consider adding a way to reset NoteForm fields if needed
}

// Function to copy modification code
const copyCode = () => {
    if (createdNote.value?.modification_code) {
        copy(createdNote.value.modification_code);
    }
}

</script>

<template>
  <div class="max-w-5xl mx-auto p-4">
    <div class="text-center mb-8">
      <h1
        class="text-3xl font-bold text-indigo-700 mb-2"
        v-motion
        :initial="{ opacity: 0, y: -20 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 100 } }"
      >
        Welcome to DropNote
      </h1>
      <p
        class="text-lg text-gray-600"
        v-motion
        :initial="{ opacity: 0, y: -20 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: 200 } }"
      >
        Quickly jot down and share notes. Create a public or private note below.
      </p>
    </div>

    <div
      class="bg-white p-6 rounded-lg shadow-md mb-8"
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 300 } }"
    >
      <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Create a New Note</h2>

       <!-- AlertMessage for errors - Use shorthand -->
       <AlertMessage
          type="error"
          title="Failed to create note:"
          :show="submissionStatus === 'error'"
          class="mb-4 text-center"
          v-motion-fade
       >
          <p>{{ submissionError }}</p>
          <template #actions>
             <BaseButton
                @click="resetFormState"
                variant="danger"
                size="sm"
             >
                Try Again
             </BaseButton>
          </template>
       </AlertMessage>

      <!-- NoteForm - Use shorthand -->
      <NoteForm
        v-if="submissionStatus === 'idle' || submissionStatus === 'submitting'"
        @submit-note="handleNoteSubmit"
        :is-submitting="submissionStatus === 'submitting'"
        :class="{ 'opacity-50 pointer-events-none': submissionStatus === 'submitting' }"
        v-motion-fade
      />

    </div>

    <!-- Action Buttons Container -->
    <div
      class="mt-8 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:justify-center"
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 400 } }"
    >
      <RouterLink
        to="/notes"
        class="w-full md:w-auto inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
      >
        <ListBulletIcon class="h-5 w-5 mr-2" />
        View Public Notes
      </RouterLink>
      <BaseButton
        @click="goToRandomNote"
        :disabled="isFetchingRandom"
        :loading="isFetchingRandom"
        variant="warning"
        size="lg"
        class="w-full md:w-auto"
      >
         <QuestionMarkCircleIcon v-if="!isFetchingRandom" class="h-5 w-5 mr-2" />
         {{ isFetchingRandom ? 'Finding...' : 'View a Random Note' }}
      </BaseButton>
    </div>

    <!-- Success Modal - Remove v-motion-fade -->
    <BaseModal
      :show="showSuccessModal"
      title="Note Created Successfully!"
      @close="acknowledgeCreation"
    >
        <template #default>
             <p class="text-sm text-gray-600 mb-3">
                Your note has been created. Please save the following modification code.
                You will need it to edit or delete your note later.
            </p>

            <p class="flex items-center text-sm font-semibold text-red-600 mb-4">
                <ExclamationTriangleIcon class="h-5 w-5 mr-1.5 flex-shrink-0" />
                This code will not be shown again. Keep it safe!
            </p>

            <button
                type="button"
                @click="copyCode"
                class="relative w-full bg-gray-100 py-6 rounded-md border border-gray-200 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                :class="codeCopied
                    ? 'bg-green-100 ring-1 ring-inset ring-green-200 hover:bg-green-200'
                    : 'hover:bg-gray-200'"
                :title="codeCopied ? 'Code copied to clipboard!' : 'Click to copy modification code'"
            >

                <span class="absolute inset-0 flex items-center justify-center px-10">

                    <span class="font-mono text-xl text-indigo-800 select-all break-all text-center">
                        {{ createdNote?.modification_code }}
                    </span>
                </span>


                <CheckIcon v-if="codeCopied" class="absolute h-6 w-6 text-green-600 top-1/2 right-3 transform -translate-y-1/2" />
                <ClipboardDocumentIcon v-else class="absolute h-6 w-6 text-gray-400 top-1/2 right-3 transform -translate-y-1/2" />
            </button>
        </template>
         <template #footer>
            <div class="text-center">
                <BaseButton
                    @click="acknowledgeCreation"
                    variant="primary"
                    size="lg"
                >
                    Got it! (View Note)
                </BaseButton>
            </div>
        </template>
    </BaseModal>

  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>