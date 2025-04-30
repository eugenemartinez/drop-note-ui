<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from './common/BaseModal.vue';
import NoteForm from './NoteForm.vue';
import BaseInput from './common/BaseInput.vue';
import AlertMessage from './common/AlertMessage.vue'; // <-- Import AlertMessage
import type { Note } from '@/types/note';

// Define props
const props = defineProps<{
  show: boolean;
  note: Note | null; // Pass the current note data to pre-fill the form
  isUpdating: boolean; // Indicate if update is in progress
  updateError: string | null; // Show update error
}>();

// Define emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submitUpdate', payload: { id: string; modificationCode: string; formData: any }): void;
}>();

// State for the modal
const modificationCode = ref('');
const modificationCodeError = ref<string | null>(null); // Error ref for modification code

// --- Validation Function ---
const validateModificationCode = () => {
  if (!modificationCode.value.trim()) {
    modificationCodeError.value = 'Modification code is required.';
  } else {
    modificationCodeError.value = null;
  }
};

// --- Watch for real-time validation ---
watch(modificationCode, () => {
  // Validate as user types or clears the field
  validateModificationCode();
});

// --- Handle Form Submission ---
const handleInternalFormSubmit = (formData: any) => {
    if (!props.note) return;

    // Explicitly validate modification code on submit attempt
    validateModificationCode();

    // Check if modification code is valid before proceeding
    if (modificationCodeError.value) {
        return; // Stop if there's an error
    }

    emit('submitUpdate', {
        id: props.note.id,
        modificationCode: modificationCode.value.trim(),
        formData: formData
    });
};

// Reset modification code and error when modal closes or note changes
watch(() => props.show, (newVal) => {
    if (!newVal) {
        modificationCode.value = '';
        modificationCodeError.value = null; // Clear error on close
    }
});
watch(() => props.note, () => {
    // Also clear when the note prop changes (e.g., opening modal for a different note)
    modificationCode.value = '';
    modificationCodeError.value = null;
});

</script>

<template>
  <BaseModal
    :show="show"
    title="Edit Note"
    @close="$emit('close')"
    maxWidthClass="max-w-4xl"
  >
    <template #default>
      <div class="max-h-[75vh] overflow-y-auto p-1 pr-2">
        <div v-if="note">
          <!-- Replace updateError div with AlertMessage -->
          <AlertMessage
            type="error"
            title="Update Failed"
            :show="!!updateError"
            class="mb-4"
          >
            {{ updateError }}
          </AlertMessage>

          <!-- Modification Code Input using BaseInput (Handles modificationCodeError internally) -->
          <BaseInput
            id="edit-modification-code"
            label="Modification Code"
            v-model="modificationCode"
            :required="true"
            placeholder="Enter the code received during creation"
            :disabled="isUpdating"
            :error="modificationCodeError"
            @blur="validateModificationCode"
            :inputClass="`font-mono ${isUpdating ? 'disabled:bg-gray-100' : ''}`"
            wrapperClass="mb-4"
          >
            <template #default>
                <p v-if="!modificationCodeError" class="text-xs text-gray-500 mt-1">Required to save changes.</p>
            </template>
          </BaseInput>

          <hr class="my-4 border-gray-200">

          <NoteForm
            v-if="show"
            :initial-data="note"
            :is-editing="true"
            :is-submitting="isUpdating"
            @submit-note="handleInternalFormSubmit"
            :class="{ 'opacity-50 pointer-events-none': isUpdating }"
          />
        </div>
        <div v-else class="text-center text-gray-500 py-5">
          Loading note data...
        </div>
      </div>
    </template>
    <!-- No footer needed as NoteForm has its own submit -->
  </BaseModal>
</template>