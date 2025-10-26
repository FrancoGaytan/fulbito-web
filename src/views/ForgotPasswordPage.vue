<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/localizations";
import {
  requestResetCode,
  verifyResetCode,
  resetPassword,
} from "../lib/auth.service";
import { useAuth } from "../stores/auth";
import { useRouter } from "vue-router";
import { localStorageKeys } from "../utils/localStorageKeys";

const step = ref<1 | 2 | 3>(1);
const email = ref("");
const code = ref("");
const newPassword = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const devCode = ref<string | undefined>();
const resetSessionToken = ref("");
const auth = useAuth();
const router = useRouter();

/**
 * Paso 1: Solicita al backend el envío de un código de reseteo para el email indicado.
 * Si el backend devuelve un devCode (modo desarrollo) lo autocompleta y avanza al paso 2.
 */
async function sendCode() {
  if (!email.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await requestResetCode(email.value);
    devCode.value = res.devCode;
    step.value = 2;
    if (devCode.value) {
      code.value = devCode.value;
      // Opcional: auto-verificar tras pequeño delay (descomentar si querés)
      // setTimeout(() => { if(step.value===2) verify(); }, 300);
    }
  } catch (e: any) {
    error.value = e?.message || t("forgot.errorSend");
  } finally {
    loading.value = false;
  }
}

/**
 * Paso 2: Verifica el código ingresado contra el backend y obtiene un resetSessionToken
 * necesario para posteriormente definir la nueva contraseña (paso 3).
 */
async function verify() {
  if (!code.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await verifyResetCode(email.value, code.value);
    resetSessionToken.value = res.resetSessionToken;
    step.value = 3;
  } catch (e: any) {
    error.value = e?.message || t("forgot.errorCode");
  } finally {
    loading.value = false;
  }
}

/**
 * Paso 3: Envía nueva contraseña usando el token de sesión de reseteo. Si el backend
 * devuelve un token de autenticación, se loguea automáticamente al usuario; de lo contrario
 * redirige al login.
 */
async function doReset() {
  if (!newPassword.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await resetPassword(
      email.value,
      resetSessionToken.value,
      newPassword.value
    );
    if (res.token) {
      localStorage.setItem(localStorageKeys.token, res.token);
      auth.token = res.token;
      router.replace("/");
    } else {
      router.replace("/login");
    }
  } catch (e: any) {
    error.value = e?.message || t("forgot.errorReset");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div
      class="w-full max-w-sm bg-white p-6 rounded-xl shadow border space-y-5"
    >
      <h1 class="text-lg font-semibold">
        {{
          step === 1
            ? t("forgot.step1")
            : step === 2
            ? t("forgot.step2")
            : t("forgot.step3")
        }}
      </h1>

      <div v-if="step === 1" class="space-y-4">
        <input
          v-model="email"
          type="email"
          :placeholder="t('forgot.email')"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          @click="sendCode"
          :disabled="!email || loading"
          class="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-50"
        >
          {{ loading ? t("forgot.sending") : t("forgot.sendCode") }}
        </button>
        <p v-if="devCode" class="text-[11px] text-gray-500">
          {{ t("forgot.devCode") }} <span class="font-mono">{{ devCode }}</span>
        </p>
      </div>

      <div v-else-if="step === 2" class="space-y-4">
        <p class="text-xs text-gray-600">{{ t("forgot.instruction") }}</p>
        <input
          v-model="code"
          maxlength="6"
          :placeholder="t('forgot.code')"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest text-center"
        />
        <div class="flex gap-2">
          <button
            @click="verify"
            :disabled="code.length < 4 || loading"
            class="flex-1 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-50"
          >
            {{ loading ? t("forgot.verifying") : t("forgot.verify") }}
          </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <input
          v-model="newPassword"
          type="password"
          :placeholder="t('forgot.newPassword')"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          @click="doReset"
          :disabled="newPassword.length < 4 || loading"
          class="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2 disabled:opacity-50"
        >
          {{ loading ? t("forgot.saving") : t("forgot.saveNew") }}
        </button>
      </div>

      <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
      <router-link to="/login" class="text-xs underline text-gray-600">{{
        t("forgot.backLogin")
      }}</router-link>
    </div>
  </div>
</template>
