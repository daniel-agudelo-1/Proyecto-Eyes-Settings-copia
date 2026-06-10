import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, IconButton, CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function VerificationCodeDialog({ open, email, onClose, onVerify, onResend, loading, debugCode }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer para reenvío
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Resetear estado al abrir el diálogo
  useEffect(() => {
    if (open) {
      setResendTimer(30);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
    }
  }, [open]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const verificationCode = code.join('');
    if (verificationCode.length === 6) onVerify(verificationCode);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    setCode(['', '', '', '', '', '']);
    onResend();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 2, mx: 2 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontSize="1.1rem">Verifica tu correo</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Hemos enviado un código de 6 dígitos a:
        </Typography>
        <Typography variant="body1" fontWeight="600" paragraph>{email}</Typography>

        {/* ========== BLOQUE DE DEPURACIÓN (SOLO DESARROLLO) ========== */}
        {/* Muestra el código directamente en el panel cuando está en modo TEST_EVENTS. */}
        {/* ELIMINAR ESTAS LÍNEAS EN PRODUCCIÓN (o cuando RESEND_MODE=REAL) */}
        {debugCode && (
          <Typography
            variant="caption"
            display="block"
            align="center"
            sx={{ color: 'gray', fontSize: '0.75rem', mb: 2, fontFamily: 'monospace' }}
          >
            [Solo pruebas] Código: {debugCode}
          </Typography>
        )}
        {/* ========== FIN BLOQUE DEPURACIÓN ========== */}

        <Box display="flex" justifyContent="center" gap={{ xs: 0.5, sm: 1 }} mb={3}>
          {code.map((digit, index) => (
            <TextField
              key={index}
              inputRef={(el) => (inputRefs.current[index] = el)}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputProps={{ maxLength: 1, style: { textAlign: 'center' } }}
              sx={{ width: { xs: 40, sm: 45 }, '& .MuiInputBase-input': { textAlign: 'center' } }}
            />
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" align="center">
          ¿No recibiste el código?{' '}
          {canResend ? (
            <Button variant="text" size="small" onClick={handleResend}
              sx={{ textTransform: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
              Reenviar código
            </Button>
          ) : (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Reenviar en {formatTime(resendTimer)}
            </Typography>
          )}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" size="small" disabled={loading}>Volver</Button>
        <Button onClick={handleVerify} variant="contained" size="small"
          disabled={code.join('').length !== 6 || loading} sx={{ minWidth: 100 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Verificar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}