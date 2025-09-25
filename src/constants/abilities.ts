export const abilityKeys = [
  'goalkeeper',
  'running',
  'passes',
  'defense',
  'power',
  'scorer',
  'positionalUnderstanding',
] as const
export type AbilityKey = typeof abilityKeys[number]

export const abilityLabels: Record<AbilityKey, string> = {
  goalkeeper: 'Arquero',
  running: 'Resistencia/Velocidad',
  passes: 'Pases',
  defense: 'Defensa',
  power: 'Potencia',
  scorer: 'Definición',
  positionalUnderstanding: 'Ubicación',
}
