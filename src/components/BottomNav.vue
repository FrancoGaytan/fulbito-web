<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();

const tabs = [
  { to: '/', label: 'Matches', icon: 'matches', match: ['matches', 'match-detail', 'create-match'] },
  { to: '/players', label: 'Players', icon: 'players', match: ['players', 'player-detail'] },
  { to: '/groups', label: 'Grupos', icon: 'groups', match: ['groups'] },
];

function isActive(tab: any) {
  // route.name can be undefined — coerce to string for safe includes
  return tab.match.includes(String(route.name));
}
</script>

<template>
  <nav class="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-dark-800/95 backdrop-blur-lg border-t border-dark-500/40" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
    <div class="flex items-center justify-around h-16">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
        :class="isActive(tab) ? 'text-accent' : 'text-gray-500 hover:text-gray-300'"
      >
        <!-- Matches icon -->
        <svg v-if="tab.icon === 'matches'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <!-- Players icon -->
        <svg v-else-if="tab.icon === 'players'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <!-- Groups icon -->
        <svg v-else-if="tab.icon === 'groups'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span class="text-[10px] font-bold uppercase tracking-wider">{{ tab.label }}</span>
        <!-- Active indicator dot -->
        <div v-if="isActive(tab)" class="absolute -bottom-0 w-1 h-1 rounded-full bg-accent"></div>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
/* nothing needed — safe-area is inlined above */
</style>
