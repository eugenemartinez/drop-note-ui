<script setup lang="ts">
import { computed, useSlots, type PropType } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String as PropType<string | null>, // <-- Allow null
    default: null, // <-- Default to null instead of ''
  },
  inputClass: { // Allow passing specific classes to the input itself
    type: String,
    default: '',
  },
  wrapperClass: { // Allow passing classes to the div containing label/input/error
    type: String,
    default: '',
  },
  // Allow any other attributes like 'name', 'aria-describedby' etc. via $attrs
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input']);

const slots = useSlots();
const hasLeadingIcon = computed(() => !!slots.leadingIcon);
const hasTrailingIcon = computed(() => !!slots.trailingIcon);

// Base input classes
const baseInputClasses = 'block w-full border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-offset-0 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed';

// Dynamic classes based on props and slots
const dynamicInputClasses = computed(() => {
  const paddingClasses = [
    hasLeadingIcon.value ? 'pl-10' : 'px-3', // Left padding
    hasTrailingIcon.value ? 'pr-10' : 'px-3', // Right padding (overrides px-3 if needed)
    'py-2' // Vertical padding
  ].join(' ');

  const borderClasses = props.error // Check if error is truthy (not null or empty string)
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';

  return [
    baseInputClasses,
    paddingClasses,
    borderClasses,
    props.inputClass // Allow overriding/adding classes
  ].join(' ');
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
  emit('input', event); // Forward native input event
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event); // Forward native blur event
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event); // Forward native focus event
};

</script>

<template>
  <div :class="wrapperClass">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative rounded-md shadow-sm">
      <div v-if="hasLeadingIcon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <slot name="leadingIcon"></slot>
      </div>

      <input
        :type="type"
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :class="dynamicInputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? `${id}-error` : undefined"
        v-bind="$attrs"
      />

      <div v-if="hasTrailingIcon" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <slot name="trailingIcon"></slot>
      </div>
    </div>
    <p v-if="props.error" :id="`${id}-error`" class="mt-1 text-xs text-red-600">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>