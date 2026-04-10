<script setup lang="ts">
import { ref } from 'vue';
import { t } from '@/localizations';
import { requestResetCode, verifyResetCode, resetPassword } from '../lib/auth.service';
import { useAuth } from '../stores/auth';
import { useRouter } from 'vue-router';
import { localStorageKeys } from '../utils/localStorageKeys';

const step = ref<1|2|3>(1);
const email = ref('');
const code = ref('');
const newPassword = ref('');
const loading = ref(false);
const error = ref<string|null>(null);
const devCode = ref<string|undefined>();
const resetSessionToken = ref('');
const auth = useAuth();
const router = useRouter();

async function sendCode(){
  if(!email.value) return; loading.value=true; error.value=null;
  try {
    const res = await requestResetCode(email.value);
    devCode.value = res.devCode;
    step.value = 2;
    if (devCode.value) {
      code.value = devCode.value;
      // Opcional: auto-verificar tras pequeño delay (descomentar si querés)
      // setTimeout(() => { if(step.value===2) verify(); }, 300);
    }
  } catch(e:any){ error.value = e?.message || t('forgot.errorSend'); }
  finally { loading.value=false; }
}

async function verify(){
  if(!code.value) return; loading.value=true; error.value=null;
  try {
    const res = await verifyResetCode(email.value, code.value);
    resetSessionToken.value = res.resetSessionToken;
    step.value = 3;
  } catch(e:any){ error.value = e?.message || t('forgot.errorCode'); }
  finally { loading.value=false; }
}

async function doReset(){
  if(!newPassword.value) return; loading.value=true; error.value=null;
  try {
    const res = await resetPassword(email.value, resetSessionToken.value, newPassword.value);
    if(res.token){
      localStorage.setItem(localStorageKeys.token, res.token);
      auth.token = res.token;
      router.replace('/');
    } else {
      router.replace('/login');
    }
  } catch(e:any){ error.value = e?.message || t('forgot.errorReset'); }
  finally { loading.value=false; }
}
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="text-center">
        <div class="text-2xl font-extrabold text-accent tracking-tight select-none mb-6">⚽ FulbITo</div>
        <h1 class="text-2xl font-bold text-white">
          {{ step===1 ? t('forgot.step1') : step===2 ? t('forgot.step2') : t('forgot.step3') }}
        </h1>
      </div>

      <div class="card p-6 space-y-5">
        <div v-if="step===1" class="space-y-4">
          <input v-model="email" type="email" :placeholder="t('forgot.email')" class="input-dark" />
          <button @click="sendCode" :disabled="!email || loading" class="btn-accent">{{ loading ? t('forgot.sending') : t('forgot.sendCode') }}</button>
          <p v-if="devCode" class="text-[11px] text-gray-500">{{ t('forgot.devCode') }} <span class="font-mono text-accent">{{ devCode }}</span></p>
        </div>

        <div v-else-if="step===2" class="space-y-4">
          <p class="text-xs text-gray-400">{{ t('forgot.instruction') }}</p>
          <input v-model="code" maxlength="6" :placeholder="t('forgot.code')" class="input-dark tracking-widest text-center" />
          <button @click="verify" :disabled="code.length<4 || loading" class="btn-accent">{{ loading ? t('forgot.verifying') : t('forgot.verify') }}</button>
        </div>

        <div v-else class="space-y-4">
          <input v-model="newPassword" type="password" :placeholder="t('forgot.newPassword')" class="input-dark" />
          <button @click="doReset" :disabled="newPassword.length<4 || loading" class="btn-accent">{{ loading ? t('forgot.saving') : t('forgot.saveNew') }}</button>
        </div>

        <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
        <router-link to="/login" class="text-xs text-gray-500 hover:text-accent transition block">{{ t('forgot.backLogin') }}</router-link>
      </div>
    </div>
  </div>
</template>
