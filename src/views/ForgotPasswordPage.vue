<script setup lang="ts">
import { ref } from 'vue';
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
    // Autocompletar el input con el código en modo dev
    if (devCode.value) {
      code.value = devCode.value;
      // Opcional: auto-verificar tras pequeño delay (descomentar si querés)
      // setTimeout(() => { if(step.value===2) verify(); }, 300);
    }
  } catch(e:any){ error.value = e?.message || 'Error enviando código'; }
  finally { loading.value=false; }
}

async function verify(){
  if(!code.value) return; loading.value=true; error.value=null;
  try {
    const res = await verifyResetCode(email.value, code.value);
    resetSessionToken.value = res.resetSessionToken;
    step.value = 3;
  } catch(e:any){ error.value = e?.message || 'Código inválido'; }
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
  } catch(e:any){ error.value = e?.message || 'No se pudo resetear'; }
  finally { loading.value=false; }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm bg-white p-6 rounded-xl shadow border space-y-5">
      <h1 class="text-lg font-semibold">
        {{ step===1 ? 'Recuperar contraseña' : step===2 ? 'Ingresá el código' : 'Nueva contraseña' }}
      </h1>

      <div v-if="step===1" class="space-y-4">
        <input v-model="email" type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <button @click="sendCode" :disabled="!email || loading" class="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-50">{{ loading ? 'Enviando…' : 'Enviar código' }}</button>
        <p v-if="devCode" class="text-[11px] text-gray-500">Dev code: <span class="font-mono">{{ devCode }}</span></p>
      </div>

      <div v-else-if="step===2" class="space-y-4">
        <p class="text-xs text-gray-600">Ingresa el código para generar una nueva contraseña</p>
        <input v-model="code" maxlength="6" placeholder="Código" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest text-center" />
        <div class="flex gap-2">
          <button @click="verify" :disabled="code.length<4 || loading" class="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-50">{{ loading ? 'Verificando…' : 'Verificar' }}</button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <input v-model="newPassword" type="password" placeholder="Nueva contraseña" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <button @click="doReset" :disabled="newPassword.length<4 || loading" class="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-50">{{ loading ? 'Guardando…' : 'Guardar nueva contraseña' }}</button>
      </div>

      <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
      <router-link to="/login" class="text-xs underline text-gray-600">Volver al login</router-link>
    </div>
  </div>
</template>
