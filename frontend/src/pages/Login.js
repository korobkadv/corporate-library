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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      const redirectTo =
        location.state?.from === "/admin" ? "/admin" : "/admin";
      navigate(redirectTo, { replace: true });
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
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tab === 1 && (
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
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading
              ? "Завантаження..."
              : tab === 0
              ? "Увійти"
              : "Зареєструватись"}
          </Button>
        </Box>

        {tab === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Адмін:</strong> admin@company.com / admin123
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Login;
