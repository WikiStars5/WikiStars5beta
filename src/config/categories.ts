import type { CategoryOption } from '@/lib/types';

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'actor_actriz', label: 'Actor/Actriz' },
  { value: 'activista_social', label: 'Activista Social' },
  { value: 'artista_plastico', label: 'Artista Plástico' },
  { value: 'cantante', label: 'Cantante' },
  { value: 'chef', label: 'Chef' },
  { value: 'cientifico', label: 'Científico' },
  { value: 'deportista', label: 'Deportista' },
  { value: 'disenador', label: 'Diseñador' },
  { value: 'empresario', label: 'Empresario' },
  { value: 'escritor', label: 'Escritor' },
  { value: 'explorador', label: 'Explorador' },
  { value: 'figura_religiosa', label: 'Figura Religiosa' },
  { value: 'filosofo', label: 'Filósofo' },
  { value: 'inventor', label: 'Inventor' },
  { value: 'militar', label: 'Militar' },
  { value: 'monarca', label: 'Royalty/Monarca' },
  { value: 'musico', label: 'Músico' },
  { value: 'periodista', label: 'Periodista' },
  { value: 'politico', label: 'Político' },
  { value: 'otro', label: 'Otro' },
].sort((a, b) => a.label.localeCompare(b.label));
