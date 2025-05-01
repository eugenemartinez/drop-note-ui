<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import type { Note } from '@/types/note';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import BaseButton from '@/components/common/BaseButton.vue';
import IconButton from '@/components/common/IconButton.vue';
import BaseInput from '@/components/common/BaseInput.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon,
  MinusIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon
} from '@heroicons/vue/24/outline';
import { XMarkIcon } from '@heroicons/vue/20/solid';

// Define the structure of the data the form will emit
interface NoteFormData {
  title: string;
  content: string;
  username?: string | null; // Allow string, undefined, OR null
  tags: string[];
  visibility: 'public' | 'private';
}

// --- Props ---
const props = defineProps<{
  initialData?: Note | null;
  isEditing?: boolean;
  isSubmitting?: boolean; // <-- ADD THIS PROP
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: 'submitNote', formData: NoteFormData): void;
}>();

// --- Form Fields ---
const title = ref('');
const content = ref(''); // Content is updated via editor's onUpdate
const username = ref('');
const tagInputValue = ref('');
const tagList = ref<string[]>([]);
const visibility = ref<'public' | 'private'>('public');

// --- Form State & Validation Errors ---
const formError = ref<string | null>(null); // General error (e.g., API error)
const titleError = ref<string | null>(null); // Specific title error
const contentError = ref<string | null>(null); // Specific content error
const tagsError = ref<string | null>(null); // Specific tags error

// --- TipTap Editor Setup ---
const editor = useEditor({
  content: '',
  extensions: [ StarterKit ],
  onUpdate: ({ editor }) => {
    content.value = editor.getHTML();
    validateContent();
  },
  onBlur: () => {
    validateContent();
  },
  editorProps: {
      attributes: {
        // Removed border and rounded-md, kept padding, min-height, focus, prose
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-3 min-h-[150px]',
      },
    },
});

// --- Validation Functions ---
const validateTitle = () => {
  if (!title.value.trim()) {
    titleError.value = 'Title is required.';
  } else {
    titleError.value = null;
  }
};

const validateContent = () => {
  // Check if editor exists and its text content (excluding HTML) is empty
  if (!editor.value || editor.value.getText().trim() === '') {
    contentError.value = 'Content cannot be empty.';
  } else {
    contentError.value = null;
  }
};

const validateTags = () => {
  if (tagList.value.length > 10) {
    tagsError.value = 'Maximum of 10 tags allowed.';
  } else {
    tagsError.value = null;
  }
};

// --- Watchers for Real-time Validation ---
watch(title, () => {
  // Validate title as user types or clears it
  validateTitle();
});

watch(tagList, () => {
    // Validate tags when the list changes
    validateTags();
}, { deep: true }); // Use deep watch for array changes

// --- Watch for initialData ---
watch(() => props.initialData, (newData) => {
    if (newData) {
        title.value = newData.title || '';
        username.value = newData.username || '';
        // Update tagList instead of tagsInput
        tagList.value = [...(newData.tags || [])]; // Use spread to create a new array
        visibility.value = newData.visibility || 'public';
        formError.value = null;
        const newContent = newData.content || '';
        if (editor.value && editor.value.getHTML() !== newContent) {
            editor.value.commands.setContent(newContent, false);
            content.value = newContent;
        }
    } else {
        // Reset fields
        title.value = '';
        username.value = '';
        tagList.value = []; // Clear tag list
        tagInputValue.value = ''; // Clear tag input
        visibility.value = 'public';
        if (editor.value) {
            editor.value.commands.clearContent(false);
            content.value = '';
        }
    }

    // Reset errors when data changes or form resets
    formError.value = null;
    titleError.value = null;
    contentError.value = null; // Reset content error
    tagsError.value = null;

    // REMOVED: Immediate re-validation of content
    // nextTick(() => {
    //     validateContent();
    // });

}, { immediate: true });

// --- Cleanup editor ---
onBeforeUnmount(() => { if (editor.value) { editor.value.destroy(); } });

// --- Tag Handling Logic ---
const addTag = (value?: string) => {
  // Use the provided value or the current input value
  const tagToAddRaw = value ?? tagInputValue.value;
  const tagToAdd = tagToAddRaw.trim(); // Trim whitespace

  // Check if tag is non-empty, not already included, and under the limit
  if (tagToAdd && !tagList.value.includes(tagToAdd) && tagList.value.length < 10) {
    tagList.value.push(tagToAdd);
    validateTags(); // Re-validate tags after adding
  }
  // Always clear the input field after attempting to add (even if it failed)
  // This handles clearing after Enter press and after processing pasted tags
  tagInputValue.value = '';
};

const removeTag = (tagToRemove: string) => {
  tagList.value = tagList.value.filter(tag => tag !== tagToRemove);
  validateTags(); // Re-validate tags after removing
};

const handleBackspace = () => {
  if (!tagInputValue.value && tagList.value.length > 0) {
    const tagToRemove = tagList.value[tagList.value.length - 1];
    removeTag(tagToRemove);
  }
};

// --- MODIFIED handleTagInput ---
const handleTagInput = (newValue: string) => {
    // Check if the new value contains a comma, indicating potential paste or multi-tag entry
    if (newValue.includes(',')) {
        const potentialTags = newValue.split(','); // Split the string by commas
        potentialTags.forEach(tagPart => {
            const trimmedTag = tagPart.trim(); // Trim whitespace from each part
            if (trimmedTag) { // Only process non-empty parts
                // Attempt to add the tag using the existing addTag logic
                // which handles uniqueness and the 10-tag limit.
                addTag(trimmedTag);
            }
        });
        // Ensure the input field is cleared after processing the parts
        // addTag already clears it, but this is a safeguard in case loop is empty
        tagInputValue.value = '';
    } else {
        // If no comma is present, just update the input value normally (for regular typing)
        tagInputValue.value = newValue;
    }
};
// --- END MODIFIED handleTagInput ---

// --- Computed Can Submit ---
const canSubmit = computed(() => {
  // Disable based on PROP and internal errors
  return !titleError.value && !contentError.value && !tagsError.value && !props.isSubmitting; // <-- Use props.isSubmitting
});

// --- Handle Form Submission ---
const handleSubmit = () => {
  // Reset general error
  formError.value = null;

  // Run all validations explicitly on submit attempt
  validateTitle();
  validateContent();
  validateTags();

  // Check if any validation errors exist
  if (titleError.value || contentError.value || tagsError.value) {
    // Optionally set a general message or just rely on individual field errors
    // formError.value = "Please fix the errors above.";
    return;
  }

  const formData: NoteFormData = {
    title: title.value.trim(),
    content: content.value,
    tags: tagList.value,
    visibility: visibility.value,
    // Initialize username as potentially undefined
    username: undefined
  };

  // Only add username if not editing AND it has a non-empty value
  const trimmedUsername = username.value.trim();
  if (!props.isEditing) {
      // Send null if empty, otherwise send the trimmed value
      formData.username = trimmedUsername === '' ? null : trimmedUsername;
  }
  // If editing, username is simply not included in the payload (or handled differently if needed)

  emit('submitNote', formData);
  // Parent component now controls the loading state via the isSubmitting prop
};

</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Use AlertMessage for the top-level form error -->
    <AlertMessage type="error" :show="!!formError">
      {{ formError }}
    </AlertMessage>

    <!-- Title Input (Uses BaseInput error handling - simple red text) -->
    <BaseInput
      id="note-title"
      label="Title"
      v-model="title"
      :required="true"
      placeholder="Enter note title"
      :error="titleError"
      @blur="validateTitle"
    />

    <!-- Content Editor -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">
        Content <span class="text-red-500">*</span>
      </label>
      <div v-if="editor" class="flex items-center flex-wrap gap-1 border border-gray-300 border-b-0 rounded-t-md p-2 bg-gray-100">
        <!-- Toolbar buttons -->
        <!-- Bold -->
         <IconButton
          :title="'Bold'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleBold().run()"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          :class="[
            'rounded', // Override rounded-full
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('bold') } // Active state
          ]"
        >
          <BoldIcon class="h-4 w-4" />
        </IconButton>
        <!-- Italic -->
        <IconButton
          :title="'Italic'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleItalic().run()"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          :class="[
            'rounded',
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('italic') }
          ]"
        >
          <ItalicIcon class="h-4 w-4" />
        </IconButton>
        <!-- Strikethrough -->
         <IconButton
          :title="'Strikethrough'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleStrike().run()"
          :disabled="!editor.can().chain().focus().toggleStrike().run()"
          :class="[
            'rounded',
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('strike') }
          ]"
        >
          <StrikethroughIcon class="h-4 w-4" />
        </IconButton>

        <!-- Code -->
        <IconButton
          :title="'Code Block'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :disabled="!editor.can().chain().focus().toggleCodeBlock().run()"
          :class="[
            'rounded',
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('codeBlock') }
          ]"
        >
          <CodeBracketIcon class="h-4 w-4" />
        </IconButton>

        <!-- Paragraph -->
        <IconButton
          :title="'Paragraph'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().setParagraph().run()"
          :class="[
            'rounded',
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('paragraph') }
          ]"
        >
          <Bars3BottomLeftIcon class="h-4 w-4" />
        </IconButton>
        <!-- Heading 2 -->
         <IconButton
          :title="'Heading 2'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="[
            'rounded font-bold text-xs', // Keep text styles
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('heading', { level: 2 }) }
          ]"
        >
          H2
        </IconButton>
        <!-- Heading 3 -->
         <IconButton
          :title="'Heading 3'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="[
            'rounded font-bold text-xs', // Keep text styles
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('heading', { level: 3 }) }
          ]"
        >
          H3
        </IconButton>
        <!-- Bullet List -->
        <IconButton
          :title="'Bullet List'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="[
            'rounded',
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('bulletList') }
          ]"
        >
          <ListBulletIcon class="h-4 w-4" />
        </IconButton>
        <!-- Ordered List -->
        <IconButton
          :title="'Ordered List'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="[
            'rounded text-xs font-mono', // Keep text styles
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('orderedList') }
          ]"
        >
          1.
        </IconButton>
        <!-- Blockquote -->
         <IconButton
          :title="'Blockquote'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="[
            'rounded',
            { 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200': editor.isActive('blockquote') }
          ]"
        >
          <ChatBubbleBottomCenterTextIcon class="h-4 w-4" />
        </IconButton>
        <!-- Horizontal Rule -->
         <IconButton
          :title="'Horizontal Rule'"
          variant="ghost"
          size="sm"
          @click="editor.chain().focus().setHorizontalRule().run()"
          class="rounded"
        >
          <MinusIcon class="h-4 w-4" />
        </IconButton>
      </div>
      <div
        :class="[
          'border rounded-b-md',
          contentError
            ? 'border-red-500' // Keep border for visual cue
            : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'
        ]"
      >
        <EditorContent
          :editor="editor"
          :aria-describedby="contentError ? 'content-error' : undefined"
        />
      </div>
      <!-- Revert contentError display to simple p tag for consistency -->
      <p v-if="contentError" id="content-error" class="mt-1 text-xs text-red-600">
        {{ contentError }}
      </p>
    </div>

    <!-- Username Input -->
     <BaseInput
       id="note-username"
       :label="`Username ${isEditing ? '(Cannot be changed)' : '(Optional)'}`"
       v-model="username"
       :readonly="isEditing"
       :disabled="isEditing"
       placeholder="anonymous"
       :inputClass="isEditing ? 'bg-gray-100 cursor-not-allowed' : ''" 
     />

    <!-- Tags Input (Uses BaseInput error handling - simple red text) -->
     <div>
      <label for="note-tags" class="block text-sm font-semibold text-gray-700 mb-1">
        Tags (Type a tag and press Enter or comma, max 10)
      </label>
      <!-- Display existing tags -->
       <div v-if="tagList.length > 0" class="mb-2 flex flex-wrap gap-1.5">
         <span
           v-for="tag in tagList" :key="tag"
           class="inline-flex items-center bg-indigo-100 text-indigo-700 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full"
         >
           {{ tag }}
           <button
             type="button"
             @click="removeTag(tag)"
             class="ml-1 flex-shrink-0 p-0.5 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-indigo-100 cursor-pointer"
             :aria-label="`Remove tag ${tag}`"
           >
             <XMarkIcon class="h-3 w-3" />
           </button>
         </span>
       </div>
       <!-- Tag Input Field using BaseInput -->
      <BaseInput
        id="note-tags"
        type="text"
        :modelValue="tagInputValue"
        @update:modelValue="handleTagInput"  
        @keydown.enter.prevent="addTag()"
        @keydown.backspace="handleBackspace"
        :disabled="tagList.length >= 10"
        :placeholder="tagList.length >= 10 ? 'Maximum tags reached' : 'Add a tag...'"
        :error="tagsError"
        :inputClass="tagList.length >= 10 ? 'disabled:bg-gray-100' : ''"
        wrapperClass="mt-0"
      />
    </div>

    <!-- Visibility and Submit Button Combined -->
    <div class="flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-end">
      <!-- Visibility Section -->
      <div class="md:mb-0"> <!-- Remove bottom margin on medium screens and up -->
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Visibility
        </label>
        <div class="flex items-center space-x-6">
          <label class="inline-flex items-center cursor-pointer">
            <input type="radio" name="visibility" value="public" v-model="visibility" class="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer">
            <span class="ml-2 text-sm text-gray-700">Public</span>
          </label>
          <label class="inline-flex items-center cursor-pointer">
            <input type="radio" name="visibility" value="private" v-model="visibility" class="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer">
            <span class="ml-2 text-sm text-gray-700">Private</span>
          </label>
        </div>
        <p class="text-xs text-gray-500 mt-2">Public notes are visible to everyone. Private notes require the link to view.</p>
      </div>

      <!-- Submit Button Section -->
      <div>
        <BaseButton
          type="submit"
          :disabled="!canSubmit"
          :loading="props.isSubmitting"
          variant="primary"
          size="lg"
          class="w-full md:w-auto"
        >
          {{ isEditing ? (props.isSubmitting ? 'Saving...' : 'Save Changes') : (props.isSubmitting ? 'Creating...' : 'Create Note') }}
        </BaseButton>
      </div>
    </div>
  </form>
</template>

<style>
/* Basic TipTap ProseMirror styling */
.ProseMirror { min-height: 150px; }
.ProseMirror:focus { outline: none; }
/* You might need to scope or adjust these if they conflict */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

/* Add styles for error states if needed, e.g., red border */
.border-red-500 { border-color: #ef4444; }
.focus\:ring-red-500:focus { --tw-ring-color: #ef4444; }
.focus\:border-red-500:focus { border-color: #ef4444; }
.text-red-600 { color: #dc2626; }
</style>