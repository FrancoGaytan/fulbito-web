<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

// ─── internal state ───────────────────────────────────────────────────────────
const parsed = computed(() => {
  if (!props.modelValue) return null
  const d = new Date(props.modelValue)
  return isNaN(d.getTime()) ? null : d
})

function toLocalStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const open = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth()) // 0-based
const selHour = ref(parsed.value?.getHours() ?? new Date().getHours())
const selMin = ref(parsed.value?.getMinutes() ?? 0)
const selDate = ref<Date | null>(parsed.value)

const container = ref<HTMLElement | null>(null)

// ─── calendar helpers ─────────────────────────────────────────────────────────
const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const calendarDays = computed<{ date: Date; cur: boolean }[]>(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  // Monday-based: getDay() 0=Sun→6, 1=Mon→0 ...
  const startDow = (first.getDay() + 6) % 7
  const cells: { date: Date; cur: boolean }[] = []
  for (let i = 0; i < startDow; i++) {
    const d = new Date(viewYear.value, viewMonth.value, 1 - (startDow - i))
    cells.push({ date: d, cur: false })
  }
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear.value, viewMonth.value, d), cur: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), cur: false })
  }
  return cells
})

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d: Date) { return isSameDay(d, new Date()) }

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function pickDay(d: Date) {
  selDate.value = d
  commit()
}

function setHour(h: number) { selHour.value = ((h % 24) + 24) % 24; commit() }
function setMin(m: number) { selMin.value = ((m % 60) + 60) % 60; commit() }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function updateHourInput(value: string) {
  if (value === '') return
  const nextHour = Number.parseInt(value, 10)
  if (Number.isNaN(nextHour)) return
  selHour.value = clamp(nextHour, 0, 23)
  commit()
}

function updateMinInput(value: string) {
  if (value === '') return
  const nextMin = Number.parseInt(value, 10)
  if (Number.isNaN(nextMin)) return
  selMin.value = clamp(nextMin, 0, 59)
  commit()
}

function commit() {
  if (!selDate.value) return
  const d = new Date(selDate.value)
  d.setHours(selHour.value, selMin.value, 0, 0)
  emit('update:modelValue', toLocalStr(d))
}

const displayValue = computed(() => {
  if (!selDate.value) return ''
  const d = selDate.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${pad(selHour.value)}:${pad(selMin.value)}`
})

// ─── outside click ─────────────────────────────────────────────────────────────
function onOutside(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
  <div ref="container" class="relative w-full">
    <!-- Trigger -->
    <button
      type="button"
      @click="open = !open"
      :class="[
        'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm transition-all',
        'bg-dark-700 border text-left',
        open ? 'border-accent ring-1 ring-accent/30' : 'border-dark-500/60 hover:border-dark-400'
      ]"
    >
      <span :class="displayValue ? 'text-white' : 'text-gray-500'">
        {{ displayValue || 'Seleccioná fecha y hora' }}
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>

    <!-- Popover -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div v-if="open"
        class="absolute z-50 mt-1 left-0 rounded-xl border border-dark-500/60 bg-dark-700 shadow-xl shadow-black/40 p-3 flex gap-3"
        style="min-width:280px"
      >
        <!-- Calendar side -->
        <div class="flex-1">
          <!-- Month nav -->
          <div class="flex items-center justify-between mb-2">
            <button type="button" @click="prevMonth"
              class="p-1 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-xs font-semibold text-white select-none">{{ MONTHS[viewMonth] }} {{ viewYear }}</span>
            <button type="button" @click="nextMonth"
              class="p-1 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-1">
            <div v-for="d in DAYS" :key="d" class="text-center text-[10px] text-gray-500 font-semibold py-0.5">{{ d }}</div>
          </div>

          <!-- Day cells -->
          <div class="grid grid-cols-7 gap-y-0.5">
            <button
              v-for="cell in calendarDays"
              :key="cell.date.toISOString()"
              type="button"
              @click="pickDay(cell.date)"
              :class="[
                'aspect-square flex items-center justify-center text-xs rounded-lg transition-colors select-none',
                !cell.cur && 'text-gray-700',
                cell.cur && !isToday(cell.date) && !(selDate && isSameDay(cell.date, selDate)) && 'text-gray-300 hover:bg-dark-600',
                isToday(cell.date) && !(selDate && isSameDay(cell.date, selDate)) && 'text-accent font-bold',
                selDate && isSameDay(cell.date, selDate) && 'bg-accent text-dark-900 font-bold',
              ]"
            >
              {{ cell.date.getDate() }}
            </button>
          </div>
        </div>

        <!-- Time side: hour + minute pickers -->
        <div class="flex gap-1 pt-1">
          <!-- Hours -->
          <div class="flex flex-col items-center gap-0.5">
            <button type="button" @click="setHour(selHour - 1)"
              class="p-1 rounded hover:bg-dark-600 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <input
              :value="String(selHour).padStart(2, '0')"
              type="number"
              min="0"
              max="23"
              step="1"
              inputmode="numeric"
              class="w-12 h-8 bg-dark-600 rounded-lg text-center text-sm font-bold text-white tabular-nums outline-none border border-transparent focus:border-accent [appearance:textfield]"
              @input="updateHourInput(($event.target as HTMLInputElement).value)"
            />
            <button type="button" @click="setHour(selHour + 1)"
              class="p-1 rounded hover:bg-dark-600 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div class="flex items-center text-gray-500 font-bold text-sm pt-0.5">:</div>
          <!-- Minutes -->
          <div class="flex flex-col items-center gap-0.5">
            <button type="button" @click="setMin(selMin - 1)"
              class="p-1 rounded hover:bg-dark-600 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <input
              :value="String(selMin).padStart(2, '0')"
              type="number"
              min="0"
              max="59"
              step="1"
              inputmode="numeric"
              class="w-12 h-8 bg-dark-600 rounded-lg text-center text-sm font-bold text-white tabular-nums outline-none border border-transparent focus:border-accent [appearance:textfield]"
              @input="updateMinInput(($event.target as HTMLInputElement).value)"
            />
            <button type="button" @click="setMin(selMin + 1)"
              class="p-1 rounded hover:bg-dark-600 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
