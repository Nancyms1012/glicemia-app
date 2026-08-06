export const MOMENTOS = [
  { value: 'ayuno', label: 'En ayunas' },
  { value: 'pre-desayuno', label: 'Antes del desayuno' },
  { value: 'post-desayuno', label: 'Después del desayuno' },
  { value: 'pre-almuerzo', label: 'Antes del almuerzo' },
  { value: 'post-almuerzo', label: 'Después del almuerzo' },
  { value: 'pre-cena', label: 'Antes de la cena' },
  { value: 'post-cena', label: 'Después de la cena' },
  { value: 'madrugada', label: 'Madrugada' },
  { value: 'otro', label: 'Otro momento' },
];

export const INSULINAS = [
  { value: 'lispro', label: 'Lispro (rápida)', tipo: 'rápida' },
  { value: 'lantus', label: 'Lantus (lenta)', tipo: 'lenta' },
  { value: 'ambas', label: 'Ambas (Lispro + Lantus)', tipo: 'ambas' },
  { value: 'ninguna', label: 'No se aplicó insulina', tipo: 'ninguna' },
];

export const RANGOS = {
  bajo: { min: 0, max: 69, color: '#ef4444', label: 'Hipoglicemia' },
  normal: { min: 70, max: 180, color: '#10b981', label: 'En rango' },
  alto: { min: 181, max: 999, color: '#f59e0b', label: 'Hiperglicemia' },
};

export const getColorPorValor = (valor) => {
  const v = Number(valor);
  if (v < 70) return '#ef4444';
  if (v <= 180) return '#10b981';
  return '#f59e0b';
};

export const getEtiquetaPorValor = (valor) => {
  const v = Number(valor);
  if (v < 70) return 'Hipoglicemia';
  if (v <= 180) return 'En rango';
  return 'Hiperglicemia';
};
