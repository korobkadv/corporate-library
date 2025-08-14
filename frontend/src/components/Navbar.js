import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import { LibraryBooks, AdminPanelSettings, Logout } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/dashboard");
  };

  const [settings, setSettings] = useState({
    site_title: "Корпоративна Бібліотека",
  });

  useEffect(() => {
    fetch(
      (process.env.REACT_APP_API_URL || "http://localhost:5000/api") +
        "/settings"
    )
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: settings.header_color || undefined }}
    >
      <Toolbar>
        <LibraryBooks sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, color: settings.header_text_color || undefined }}
        >
          {settings.site_title || "Корпоративна Бібліотека"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            color="inherit"
            onClick={() => navigate("/dashboard")}
            variant={location.pathname === "/dashboard" ? "outlined" : "text"}
            sx={{ color: settings.link_color || undefined }}
          >
            Бібліотека
          </Button>

          {user?.role === "admin" && (
            <Button
              color="inherit"
              onClick={() => navigate("/admin")}
              variant={location.pathname === "/admin" ? "outlined" : "text"}
              startIcon={<AdminPanelSettings />}
              sx={{ color: settings.link_color || undefined }}
            >
              Адмінка
            </Button>
          )}

          {user ? (
            <>
              <Typography
                variant="body2"
                sx={{ mx: 2, color: settings.header_text_color || undefined }}
              >
                {user.username}
              </Typography>
              <IconButton color="inherit" onClick={handleLogout}>
                <Logout />
              </IconButton>
            </>
          ) : (
            <Button
              color="inherit"
              sx={{ color: settings.link_color || undefined }}
              onClick={() => navigate("/login")}
            >
              Вхід
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
