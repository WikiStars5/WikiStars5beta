export interface GenderOption {
  value: string; // e.g., 'male', 'female', 'other', 'prefer_not_to_say'
  label: string; // e.g., 'Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'
  emoji?: string; // e.g., '♂️', '♀️'
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male', label: 'Masculino', emoji: '♂️' },
  { value: 'female', label: 'Femenino', emoji: '♀️' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' },
];