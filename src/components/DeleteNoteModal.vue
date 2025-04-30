<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import BaseModal from './common/BaseModal.vue';
import BaseButton from './common/BaseButton.vue';
import BaseInput from './common/BaseInput.vue';
import AlertMessage from './common/AlertMessage.vue'; // <-- Import AlertMessage
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

// Define props
const props = defineProps<{
  show: boolean;
  noteId: string | null; // ID of the note to delete
  isDeleting: boolean; // Indicate if deletion is in progress
  deleteError: string | null; // Show deletion error
}>();

// Define emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirmDelete', payload: { id: string; modificationCode: string }): void;
}>();

// State for the modal
const modificationCode = ref('');
const modificationCodeError = ref<string | null>(null); // Error ref

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
  validateModificationCode();
});

// --- Handle Confirm Click ---
const handleConfirm = () => {
    if (!props.noteId) return;

    // Explicitly validate on confirm attempt
    validateModificationCode();

    // Check error state before emitting
    if (modificationCodeError.value) {
        return; // Stop if invalid
    }

    emit('confirmDelete', {
        id: props.noteId,
        modificationCode: modificationCode.value.trim()
    });
};

// --- Computed for Button Disabled State ---
const isConfirmDisabled = computed(() => {
    return props.isDeleting || !!modificationCodeError.value || !modificationCode.value.trim();
});

// Reset modification code and error when modal closes or noteId changes
watch(() => props.show, (newVal) => {
    if (!newVal) {
        modificationCode.value = '';
        modificationCodeError.value = null; // Clear error on close
    }
});
 watch(() => props.noteId, () => {
    modificationCode.value = '';
    modificationCodeError.value = null; // Clear error on note change
});

</script>

<template>
  <BaseModal :show="show" @close="$emit('close')">
    <template #header>
        <div class="flex items-center">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-600 mr-2" aria-hidden="true" />
            <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                Confirm Deletion
            </h3>
        </div>
    </template>
    <template #default>
      <p class="text-sm text-gray-700 mb-4">
        Are you sure you want to permanently delete this note? This action cannot be undone.
      </p>
      <p class="text-sm text-gray-700 mb-4">
        Please enter the modification code to confirm deletion.
      </p>

      <!-- Modification Code Input using BaseInput (Handles modificationCodeError internally) -->
      <BaseInput
        id="delete-modification-code"
        label="Modification Code"
        v-model="modificationCode"
        :required="true"
        placeholder="Enter the code received during creation"
        :disabled="isDeleting"
        :error="modificationCodeError"
        @blur="validateModificationCode"
        :inputClass="`font-mono ${isDeleting ? 'disabled:bg-gray-100' : ''}`"
        wrapperClass="mb-4"
      />

       <!-- Replace deleteError div with AlertMessage -->
       <AlertMessage
         type="error"
         title="Deletion Failed"
         :show="!!deleteError"
         class="mt-4"
       >
         {{ deleteError }}
       </AlertMessage>
    </template>
    <template #footer>
       <div class="flex justify-end space-x-3">
            <BaseButton
                @click="$emit('close')"
                :disabled="isDeleting"
                variant="secondary"
                type="button"
            >
                Cancel
            </BaseButton>
             <BaseButton
                @click="handleConfirm"
                :disabled="isConfirmDisabled"
                :loading="isDeleting"
                variant="danger"
                type="button"
            >
                {{ isDeleting ? 'Deleting...' : 'Delete Note' }}
            </BaseButton>
       </div>
    </template>
  </BaseModal>
</template>