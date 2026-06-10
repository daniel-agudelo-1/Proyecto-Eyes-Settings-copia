import { useMemo } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

// Lista de patrones débiles comunes
const WEAK_PATTERNS = [
  'password', 'contraseña', '123456', '12345678', '12345', '123456789',
  'qwerty', 'abc123', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'hello', 'football', 'baseball', 'shadow', 'sunshine'
];

// Detectar secuencias (abc, 123, qwert)
const hasSequence = (str, len = 3) => {
  const lower = str.toLowerCase();
  for (let i = 0; i <= lower.length - len; i++) {
    const sub = lower.slice(i, i + len);
    if (/^[0-9]{3}$/.test(sub) && parseInt(sub[2]) === parseInt(sub[1]) + 1 && parseInt(sub[1]) === parseInt(sub[0]) + 1) return true;
    if (/^[0-9]{3}$/.test(sub) && parseInt(sub[2]) === parseInt(sub[1]) - 1 && parseInt(sub[1]) === parseInt(sub[0]) - 1) return true;
    if (/^[a-z]{3}$/.test(sub) && sub.charCodeAt(2) === sub.charCodeAt(1) + 1 && sub.charCodeAt(1) === sub.charCodeAt(0) + 1) return true;
    if (/^[a-z]{3}$/.test(sub) && sub.charCodeAt(2) === sub.charCodeAt(1) - 1 && sub.charCodeAt(1) === sub.charCodeAt(0) - 1) return true;
    const qwertyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    for (const row of qwertyRows) {
      if (row.includes(sub)) return true;
    }
  }
  return false;
};

// Detectar repeticiones (aaaa, 1111)
const hasRepetition = (str, len = 3) => {
  const regex = new RegExp(`(.)\\1{${len - 1},}`);
  return regex.test(str);
};

// Detectar si contiene nombre, apellido o parte del correo
const containsPersonalInfo = (password, nombre = '', apellido = '', email = '') => {
  const lowerPass = password.toLowerCase();
  const personal = [nombre, apellido, email?.split('@')[0]].filter(Boolean).map(s => s.toLowerCase());
  for (const word of personal) {
    if (word && word.length >= 3 && lowerPass.includes(word)) return true;
  }
  return false;
};

export default function PasswordStrength({ password, nombre = '', apellido = '', email = '' }) {
  const strength = useMemo(() => {
    if (!password) return 0;

    let score = 0;
    const len = password.length;

    if (len >= 8) score += 20;
    else if (len >= 6) score += 10;

    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    let penalty = 0;
    if (WEAK_PATTERNS.some(p => password.toLowerCase().includes(p))) penalty += 40;
    if (hasSequence(password)) penalty += 30;
    if (hasRepetition(password)) penalty += 30;
    if (containsPersonalInfo(password, nombre, apellido, email)) penalty += 50;

    score = Math.max(0, Math.min(100, score - penalty));
    return score;
  }, [password, nombre, apellido, email]);

  const getColor = () => strength < 40 ? 'error' : strength < 70 ? 'warning' : 'success';
  const getLabel = () => strength < 40 ? 'Débil' : strength < 70 ? 'Media' : 'Fuerte';

  if (!password) return null;

  return (
    <Box sx={{ mt: 0.5, mb: 1 }}>
      <LinearProgress variant="determinate" value={strength} color={getColor()} sx={{ height: 4, borderRadius: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: '500' }}>
        Fortaleza: {getLabel()}
      </Typography>
    </Box>
  );
}