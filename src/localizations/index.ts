export type Locale = 'es';

interface Dictionary {
  [key: string]: string | Dictionary;
}

const es: Dictionary = {
  app: { name: 'FulbITo' },
  common: {
    loading: 'Cargando…',
    create: 'Crear',
    close: 'Cerrar',
    delete: 'Eliminar',
    add: 'Agregar',
    save: 'Guardar',
    search: 'Buscar',
  },
  login: {
    heroTitle: 'Código, deploy y gol.',
    heroCopy: 'Organizá partidos con tu equipo de IT, calificá el desempeño y seguí la evolución de cada jugador.',
    title: 'Ingresar',
    subtitle: 'Entrá para gestionar tus partidos y jugadores.',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Contraseña',
    forgot: '¿Olvidaste tu contraseña?',
    action: 'Entrar',
    actionLoading: 'Ingresando…',
    noAccount: '¿No tenés cuenta?',
    registerCta: 'Registrate'
  },
  register: {
    heroTitle: 'Sumate al equipo.',
    heroCopy: 'Creá tu cuenta, reclamá tu jugador y empezá a sumar minutos y rating en cada partido.',
    title: 'Crear cuenta',
    subtitle: 'Configura tu acceso para participar de los partidos.',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Contraseña',
    autoRedirect: 'Redirigir automáticamente',
    action: 'Registrarme',
    actionLoading: 'Creando…',
    haveAccount: '¿Ya tenés cuenta?',
    loginCta: 'Ingresá',
    duplicateEmail: 'Ya existe un usuario registrado con ese email',
    missingToken: 'Registro sin token en la respuesta',
    error: 'Error de registro'
  },
  groups: {
    loading: 'Cargando grupos…',
    createTitle: 'Crear grupo',
    namePlaceholder: 'Nombre del grupo',
    descPlaceholder: 'Descripción (opcional)',
    creating: 'Creando…',
    create: 'Crear grupo',
    owner: 'Owner',
    member: 'Miembro',
    playersSuffix: 'jugadores',
    addPlayers: 'Agregar jugadores',
    addPlayersTitle: 'Solo el owner puede agregar jugadores',
    delete: 'Eliminar',
    deleteTitle: 'Eliminar grupo',
    searchPlayer: 'Buscar jugador…',
    selectAll: 'Seleccionar todo',
    addCount: 'Agregar',
    close: 'Cerrar',
    deleteError: 'No se pudo eliminar el grupo'
  }
};

let current: Locale = 'es';
const dictionaries: Record<Locale, Dictionary> = { es };

function resolve(path: string, dict: Dictionary): string {
  const parts = path.split('.');
  let node: any = dict;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p]; else return path; // fallback to key
  }
  return typeof node === 'string' ? node : path;
}

export function t(key: string): string { return resolve(key, dictionaries[current]); }
export function setLocale(loc: Locale) { if (loc in dictionaries) current = loc; }
