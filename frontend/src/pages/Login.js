import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const Login = () => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [verify, setVerify] = useState({ email: "", code: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successRegistered, setSuccessRegistered] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let result;
    if (tab === 0) {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(
        formData.username,
        formData.email,
        formData.password
      );
    }

    if (!result.success) {
      setError(result.message);
    } else {
      if (tab === 1) {
        // після реєстрації показуємо інфо та ховаємо форму
        setSuccessRegistered(true);
        setError(result.message || "Обліковий запис створено.");
      } else {
        const redirectTo = location.state?.from || "/dashboard";
        navigate(redirectTo, { replace: true });
      }
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Корпоративна Бібліотека
        </Typography>

        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
          <Tab label="Вхід" />
          <Tab label="Реєстрація" />
        </Tabs>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {error && (
            <Alert
              severity={successRegistered ? "success" : "error"}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {tab === 1 && !successRegistered && (
            <TextField
              fullWidth
              label="Ім'я користувача"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
            />
          )}

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            disabled={tab === 1 && successRegistered}
          />

          <TextField
            fullWidth
            label="Пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            helperText={
              tab === 1
                ? "Мін. 7 символів, щонайменше одна цифра і одна велика літера"
                : undefined
            }
            disabled={tab === 1 && successRegistered}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || (tab === 1 && successRegistered)}
          >
            {loading
              ? "Завантаження..."
              : tab === 0
              ? "Увійти"
              : "Зареєструватись"}
          </Button>
        </Box>

        {/* Прибрано підказку з логіном/паролем адміністратора */}

        {tab === 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Підтвердження email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Введіть ваш email та код з листа, щоб підтвердити адресу.
            </Typography>
            <TextField
              fullWidth
              label="Email"
              type="email"
              sx={{ mt: 1 }}
              value={verify.email}
              onChange={(e) => setVerify({ ...verify, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Код"
              sx={{ mt: 1 }}
              value={verify.code}
              onChange={(e) => setVerify({ ...verify, code: e.target.value })}
            />
            <Button
              sx={{ mt: 1 }}
              variant="outlined"
              onClick={async () => {
                try {
                  setLoading(true);
                  const res = await (
                    await import("../api/auth")
                  ).verifyEmailRequest(verify.email, verify.code);
                  setError("");
                  alert(res.message || "Email підтверджено");
                } catch (e) {
                  setError(
                    e.response?.data?.message || "Помилка підтвердження"
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Підтвердити email
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Login;
