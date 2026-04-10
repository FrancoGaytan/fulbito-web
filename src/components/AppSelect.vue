<script setup lang="ts" generic="T extends string | number">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: T | ''
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Seleccioná una opción',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: T | ''): void
  (e: 'change'): void
}>()

const open = ref(false)
const container = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  if (props.modelValue === '' || props.modelValue === undefined) return null
  return props.options.find(o => o.value === props.modelValue)?.label ?? null
})

function select(opt: SelectOption) {
  if (opt.disabled) return
  emit('update:modelValue', opt.value as T)
  open.value = false
  emit('change')
}

function toggle() {
  if (!props.disabled) open.value = !open.value
}

function onOutsideClick(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutsideClick))
</script>

<template>
  <div ref="container" class="relative w-full">
    <!-- Trigger -->
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      :class="[
        'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm transition-all',
        'bg-dark-700 border text-left',
        open ? 'border-accent ring-1 ring-accent/30 text-white' : 'border-dark-500/60 text-gray-300 hover:border-dark-400',
        disabled && 'opacity-50 cursor-not-allowed'
      ]"
    >
      <span :class="selectedLabel ? 'text-white' : 'text-gray-500'">
        {{ selectedLabel ?? placeholder }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="open"
        class="absolute z-50 mt-1 w-full rounded-xl overflow-hidden border border-dark-500/60 bg-dark-700 shadow-xl shadow-black/40"
      >
        <ul class="py-1 max-h-60 overflow-auto">
          <li
            v-for="opt in options"
            :key="opt.value"
            @mousedown.prevent="select(opt)"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors select-none',
              opt.value === modelValue
                ? 'bg-accent/15 text-accent font-semibold'
                : opt.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-dark-600 hover:text-white'
            ]"
          >
            <svg v-if="opt.value === modelValue"
              xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-accent shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else class="w-3.5 h-3.5 shrink-0" />
            {{ opt.label }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
