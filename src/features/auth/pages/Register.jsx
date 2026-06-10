import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box, Card, CardContent, FormControl, InputLabel,
  Select, MenuItem, Checkbox, Button, Typography,
  Container, Alert, Grid, CircularProgress, InputAdornment, IconButton,
  TextField,
} from '@mui/material';
import {
  PersonAddOutlined as PersonAddIcon,
  VisibilityOutlined as VisibilityOutlinedIcon,
  VisibilityOffOutlined as VisibilityOffOutlinedIcon,
} from '@mui/icons-material';

import { TextFieldLetters, TextFieldNumbers, TextFieldAlphanumeric, TextFieldNoEmoji } from '@shared';
import { loginTheme } from '@theme';
import {
  authServices,
  validateRegisterForm,
  TIPOS_DOCUMENTO,
  getRegisterInitialData,
  buildRegisterPayload,
  PasswordStrength,
  VerificationCodeDialog,
} from '@auth';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(getRegisterInitialData());
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [debugCode, setDebugCode] = useState(null); // ← solo desarrollo

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDebugCode(null); // limpiar código anterior

    const formErrors = validateRegisterForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setError('Corrige los errores del formulario');
      return;
    }

    setLoading(true);
    try {
      const response = await authServices.sendRegisterCode(buildRegisterPayload(formData));
      // ========== BLOQUE DE DEPURACIÓN (SOLO DESARROLLO) ==========
      if (response.debug_code) {
        setDebugCode(response.debug_code);
      }
      // ========== FIN BLOQUE DEPURACIÓN ==========
      setShowVerificationDialog(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el código de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codigo) => {
    setLoading(true);
    try {
      await authServices.verifyRegisterCode(formData.correo, codigo);
      setSuccess(true);
      setShowVerificationDialog(false);
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
            email: formData.correo,
          },
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await authServices.sendRegisterCode(buildRegisterPayload(formData));
      // ========== BLOQUE DE DEPURACIÓN (SOLO DESARROLLO) ==========
      if (response.debug_code) {
        setDebugCode(response.debug_code);
      }
      // ========== FIN BLOQUE DEPURACIÓN ==========
    } catch {
      setError('Error al reenviar el código');
    }
  };

  // ============================================================
  // Campo "Número" dinámico según tipo de documento
  // ============================================================
  const renderDocumentoField = () => {
    const tipo = formData.tipoDocumento;
    const maxLengthMap = {
      CC: 10,
      CE: 12,
      PASAPORTE: 12,
      PEP: 15,
    };
    const maxLength = maxLengthMap[tipo] || 15;

    const commonProps = {
      fullWidth: true,
      size: 'small',
      name: 'numeroDocumento',
      label: 'Número',
      value: formData.numeroDocumento,
      onChange: handleChange,
      placeholder: 'Tu número de documento',
      required: true,
      disabled: success || loading,
      error: !!errors.numeroDocumento,
      helperText: errors.numeroDocumento,
      maxLength: maxLength,
    };

    if (tipo === 'CC' || tipo === 'CE') {
      return <TextFieldNumbers {...commonProps} />;
    }
    return <TextFieldAlphanumeric {...commonProps} />;
  };

  return (
    <ThemeProvider theme={loginTheme}>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        py: 1,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>

        <Box sx={{ textAlign: 'center', mb: 0.5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48,
              bgcolor: 'primary.main',
              borderRadius: '12px',
            }}>
              <PersonAddIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" color="primary" fontWeight="700"
              fontFamily="inherit" sx={{ letterSpacing: '-0.025em' }}>
              Visual Outlet
            </Typography>
          </Box>
        </Box>

        <Container component="main" maxWidth="md"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card elevation={2} sx={{ width: '100%', maxWidth: 520, p: 3.5 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" color="text.primary" fontWeight="600">
                  Crear una cuenta
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ¡Cuenta creada! Serás redirigido al inicio de sesión...
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextFieldLetters
                      fullWidth size="small"
                      name="nombre"
                      label="Nombres"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Tus nombres"
                      required
                      disabled={success || loading}
                      error={!!errors.nombre}
                      helperText={errors.nombre}
                      maxLength={50}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextFieldLetters
                      fullWidth size="small"
                      name="apellido"
                      label="Apellidos"
                      value={formData.apellido}
                      onChange={handleChange}
                      placeholder="Tus apellidos"
                      required
                      disabled={success || loading}
                      error={!!errors.apellido}
                      helperText={errors.apellido}
                      maxLength={50}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={!!errors.tipoDocumento}>
                      <InputLabel>Tipo de documento</InputLabel>
                      <Select
                        name="tipoDocumento"
                        value={formData.tipoDocumento}
                        onChange={handleChange}
                        label="Tipo de documento"
                        disabled={success || loading}
                      >
                        {Object.entries(TIPOS_DOCUMENTO).map(([key, value]) => (
                          <MenuItem key={key} value={key}>{value}</MenuItem>
                        ))}
                      </Select>
                      {errors.tipoDocumento && (
                        <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                          {errors.tipoDocumento}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {renderDocumentoField()}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextFieldNoEmoji
                      fullWidth size="small"
                      name="correo"
                      label="Correo electrónico"
                      type="email"
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      required
                      disabled={success || loading}
                      error={!!errors.correo}
                      helperText={errors.correo}
                      maxLength={100}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextFieldNumbers
                      fullWidth size="small"
                      name="telefono"
                      label="Teléfono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="+57 300 123 4567"
                      disabled={success || loading}
                      error={!!errors.telefono}
                      helperText={errors.telefono}
                      maxLength={15}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth size="small"
                      name="fechaNacimiento"
                      label="Fecha de nacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      disabled={success || loading}
                      error={!!errors.fechaNacimiento}
                      helperText={errors.fechaNacimiento}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth size="small"
                      name="contrasenia"
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.contrasenia}
                      onChange={handleChange}
                      placeholder="········"
                      required
                      disabled={success || loading}
                      error={!!errors.contrasenia}
                      helperText={errors.contrasenia}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword
                                ? <VisibilityOffOutlinedIcon fontSize="small" />
                                : <VisibilityOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <PasswordStrength 
                    password={formData.contrasenia}
                    nombre={formData.nombre}
                    apellido={formData.apellido}
                    email={formData.correo}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth size="small"
                      name="confirmContrasenia"
                      label="Confirmar contraseña"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmContrasenia}
                      onChange={handleChange}
                      placeholder="········"
                      required
                      disabled={success || loading}
                      error={!!errors.confirmContrasenia}
                      helperText={errors.confirmContrasenia}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                              {showConfirmPassword
                                ? <VisibilityOffOutlinedIcon fontSize="small" />
                                : <VisibilityOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2.5, mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                  <Checkbox
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    size="small"
                    disabled={success || loading}
                    sx={{ mt: -0.5 }}
                  />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: '500', lineHeight: 1.5 }}>
                    Acepto los{' '}
                    <Button
                      component={Link}
                      to="/terms"
                      variant="text"
                      size="small"
                      sx={{ fontSize: '0.85rem', p: 0, minWidth: 'auto', fontWeight: '600', textTransform: 'none', verticalAlign: 'baseline' }}
                    >
                      términos y condiciones
                    </Button>
                  </Typography>
                </Box>
                {errors.agreeTerms && (
                  <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                    {errors.agreeTerms}
                  </Typography>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={success || loading}
                  sx={{ mt: 2, mb: 2.5, py: 1.2, textTransform: 'none', fontSize: '0.95rem', fontWeight: '700' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', display: 'inline' }}>
                  ¿Ya tienes una cuenta?{' '}
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  variant="text"
                  size="small"
                  sx={{ textTransform: 'none', fontSize: '0.85rem', fontWeight: '700', p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                >
                  Inicia sesión aquí
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>

        <VerificationCodeDialog
          open={showVerificationDialog}
          email={formData.correo}
          onClose={() => setShowVerificationDialog(false)}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          loading={loading}
          debugCode={debugCode}
        />
      </Box>
    </ThemeProvider>
  );
}