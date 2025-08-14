import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import { Edit, Delete, Visibility, Download } from "@mui/icons-material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import axios from "axios";
import { API_BASE, buildFileUrl } from "../config";
import {
  listCategories,
  createCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
} from "../api/categories";
import {
  listDocuments,
  uploadDocument as apiUploadDocument,
  updateDocument as apiUpdateDocument,
  deleteDocument as apiDeleteDocument,
} from "../api/documents";
import {
  listUsers as apiListUsers,
  deleteUser as apiDeleteUser,
} from "../api/users";
import { getSettings as apiGetSettings } from "../api/settings";
import { formatFileSize } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";

const AdminPanel = () => {
  const [documents, setDocuments] = useState([]);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    category: "",
    category_id: "",
    tags: "",
    viewUntil: "",
    noTerm: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    category: "",
    category_id: "",
    tags: "",
    file: null,
    noTerm: true,
    viewUntil: "",
  });

  // noop
  const { user } = useAuth();
  const [tab, setTab] = useState(0); // 0 - документи, 1 - категорії, 2 - користувачі
  const [categoriesList, setCategoriesList] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [categoryEdit, setCategoryEdit] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    site_title: "",
    header_color: "#1976d2",
    header_text_color: "#ffffff",
    link_color: "#ffffff",
  });
  // const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const categories = categoriesList;

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listDocuments({ limit: 100 });
      setDocuments(data.documents);
    } catch (error) {
      console.error("Помилка завантаження документів:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Підвантажуємо категорії одразу, щоб були доступні в діалогах додавання/редагування
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await listCategories();
      setCategoriesList(cats || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const list = await apiListUsers();
      setUsers(list || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (tab === 1) fetchCategories();
    if (tab === 2) fetchUsers();
    if (tab === 3) fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchSettings = useCallback(async () => {
    try {
      const st = await apiGetSettings();
      setSettings({
        site_title: st?.site_title || "",
        header_color: st?.header_color || "#1976d2",
        header_text_color: st?.header_text_color || "#ffffff",
        link_color: st?.link_color || "#ffffff",
      });
    } catch (e) {
      console.error(e);
    } finally {
      // noop
    }
  }, []);

  const toDateInput = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      return String(value).slice(0, 10);
    } catch {
      return String(value).slice(0, 10);
    }
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setEditData({
      title: document.title,
      description: document.description || "",
      category: document.category || "",
      category_id: document.category_id || "",
      tags: document.tags || "",
      viewUntil: toDateInput(document.view_until),
      noTerm: !document.view_until,
    });
    setEditDialog(true);
    setError("");
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await apiUpdateDocument(selectedDocument.id, {
        title: editData.title,
        description: editData.description,
        category_id: editData.category_id || null,
        tags: editData.tags,
        view_until: editData.noTerm ? null : editData.viewUntil,
      });
      setEditDialog(false);
      fetchDocuments();
    } catch (error) {
      setError(error.response?.data?.message || "Помилка оновлення");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (document) => {
    setSelectedDocument(document);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await apiDeleteDocument(selectedDocument.id);
      setDeleteDialog(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      setError(error.response?.data?.message || "Помилка видалення");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const response = await axios.get(`${API_BASE}/documents/download/${id}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Помилка завантаження файлу:", error);
    }
  };

  const handleView = (document) => {
    const fileUrl = buildFileUrl(document.filename);
    window.open(fileUrl, "_blank");
  };

  // formatFileSize з utils
  const renderViewUntil = (viewUntil) => {
    if (!viewUntil) return null;
    const now = new Date();
    const due = new Date(viewUntil);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    let bg = "transparent";
    if (diffDays <= 1) bg = "#ffe5e5"; // light red
    else if (diffDays <= 7) bg = "#fff5cc"; // light yellow
    return (
      <Box
        sx={{
          mt: 0.5,
          display: "inline-block",
          px: 1,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: bg,
        }}
      >
        <Typography variant="caption">
          Термін: {due.toLocaleDateString("uk-UA")}
        </Typography>
      </Box>
    );
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title) {
      setError("Файл та назва обов'язкові");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);
    if (uploadData.category_id) {
      formData.append("category_id", String(uploadData.category_id));
    }
    formData.append("tags", uploadData.tags);
    if (!uploadData.noTerm && uploadData.viewUntil) {
      formData.append("view_until", uploadData.viewUntil);
    }
    try {
      await apiUploadDocument(formData);
      setUploadDialog(false);
      setUploadData({
        title: "",
        description: "",
        category: "",
        category_id: "",
        tags: "",
        file: null,
        noTerm: true,
        viewUntil: "",
      });
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Адміністративна панель
      </Typography>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Документи (${documents.length})`} />
        <Tab label="Категорії" />
        <Tab label="Користувачі" />
        <Tab label="Налаштування" />
      </Tabs>

      {user?.role && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          {tab === 0 && (
            <Button variant="contained" onClick={() => setUploadDialog(true)}>
              Завантажити документ
            </Button>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Назва</TableCell>
                <TableCell>Категорія</TableCell>
                <TableCell>Розмір</TableCell>
                <TableCell>Автор</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Термін</TableCell>
                <TableCell>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{doc.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.original_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(doc.category_name || doc.category) && (
                      <Chip
                        label={doc.category_name || doc.category}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>{doc.uploaded_by_name}</TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString("uk-UA")}
                  </TableCell>
                  <TableCell>{renderViewUntil(doc.view_until)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleView(doc)} size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDownload(doc.id, doc.original_name)}
                      size="small"
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEdit(doc)}
                      size="small"
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(doc)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Назва"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ name: e.target.value })}
            />
            <Button
              variant="contained"
              onClick={async () => {
                if (!newCategory.name.trim()) return;
                await createCategory({ name: newCategory.name.trim() });
                setNewCategory({ name: "" });
                fetchCategories();
              }}
            >
              Додати
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Назва</TableCell>

                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categoriesList.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() =>
                          setCategoryEdit({
                            open: true,
                            id: c.id,
                            name: c.name,
                          })
                        }
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setDeleteDialog({
                            type: "category",
                            id: c.id,
                            name: c.name,
                          })
                        }
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ім'я</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={u.role}
                        onChange={async (e) => {
                          const role = e.target.value;
                          await axios.put(`${API_BASE}/users/${u.id}/role`, {
                            role,
                          });
                          fetchUsers();
                        }}
                      >
                        <MenuItem value="user">Користувач</MenuItem>
                        <MenuItem value="editor">Редактор</MenuItem>
                        <MenuItem value="admin">Адмін</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        value={u.status}
                        onChange={async (e) => {
                          const status = e.target.value;
                          await axios.put(`${API_BASE}/users/${u.id}/status`, {
                            status,
                          });
                          fetchUsers();
                        }}
                      >
                        <MenuItem value="active">Активний</MenuItem>
                        <MenuItem value="pending">Очікує схвалення</MenuItem>
                        <MenuItem value="blocked">Заблокований</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setDeleteDialog({
                          type: "user",
                          id: u.id,
                          name: u.email,
                        })
                      }
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <Box
          component="form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSettingsSaving(true);
              await axios.put(`${API_BASE}/settings`, settings);
            } finally {
              setSettingsSaving(false);
            }
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Налаштування сайту
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Назва сайту"
                value={settings.site_title}
                onChange={(e) =>
                  setSettings({ ...settings, site_title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Колір шапки"
                type="color"
                value={settings.header_color}
                onChange={(e) =>
                  setSettings({ ...settings, header_color: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Колір тексту в шапці"
                type="color"
                value={settings.header_text_color}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    header_text_color: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Колір посилань у шапці"
                type="color"
                value={settings.link_color}
                onChange={(e) =>
                  setSettings({ ...settings, link_color: e.target.value })
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Button type="submit" variant="contained" disabled={settingsSaving}>
              {settingsSaving ? "Збереження..." : "Зберегти"}
            </Button>
            {!settingsSaving && (
              <Typography variant="body2" color="text.secondary">
                Налаштування застосовано, оновіть сторінку
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Діалог завантаження файлу */}
      <Dialog
        open={uploadDialog}
        onClose={() => setUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Завантажити документ</DialogTitle>
        <form onSubmit={handleUpload}>
          <DialogContent>
            <Button
              component="label"
              variant="outlined"
              sx={{ mt: 1, mb: 1 }}
              fullWidth
            >
              Вибрати файл
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUploadData((prev) => ({
                    ...prev,
                    file,
                    title:
                      prev.title ||
                      (file ? file.name.replace(/\.[^.]+$/, "") : ""),
                  }));
                }}
                accept=".pdf,.doc,.docx,.rtf,.odt,.txt,.md,.csv,.xls,.xlsx,.ods,.ppt,.pptx,.ppsx,.odp,.vsd,.vsdx,.vss,.vst,.jpg,.jpeg,.png,.gif,.svg,.mp3,.wav,.mp4,.avi,.mov,.zip,.7z,.rar,.json,.xml"
              />
            </Button>
            {uploadData.file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Вибрано: {uploadData.file.name}
              </Typography>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Назва документу"
              value={uploadData.title}
              onChange={(e) =>
                setUploadData({ ...uploadData, title: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Опис"
              value={uploadData.description}
              onChange={(e) => {
                const MAX = 2000;
                const next = (e.target.value || "").slice(0, MAX);
                setUploadData({ ...uploadData, description: next });
              }}
              margin="normal"
              multiline
              rows={3}
              helperText={`${
                2000 - (uploadData.description?.length || 0)
              } символів залишилось`}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Категорія</InputLabel>
              <Select
                value={uploadData.category_id || ""}
                onChange={(e) =>
                  setUploadData({ ...uploadData, category_id: e.target.value })
                }
                label="Категорія"
              >
                <MenuItem value="">Без категорії</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadData.noTerm}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        noTerm: e.target.checked,
                        viewUntil: e.target.checked ? "" : uploadData.viewUntil,
                      })
                    }
                  />
                }
                label="Без терміну"
              />
              <TextField
                type="date"
                label="Термін перегляду"
                InputLabelProps={{ shrink: true }}
                disabled={uploadData.noTerm}
                value={uploadData.viewUntil}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    viewUntil: e.target.value,
                    noTerm: !e.target.value,
                  })
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Теги (через кому)"
              value={uploadData.tags}
              onChange={(e) =>
                setUploadData({ ...uploadData, tags: e.target.value })
              }
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialog(false)}>Скасувати</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Завантаження..." : "Завантажити"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Діалог редагування категорії */}
      <Dialog
        open={categoryEdit.open}
        onClose={() => setCategoryEdit({ open: false, id: null, name: "" })}
      >
        <DialogTitle>Редагувати категорію</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            fullWidth
            label="Назва"
            value={categoryEdit.name}
            onChange={(e) =>
              setCategoryEdit((s) => ({ ...s, name: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCategoryEdit({ open: false, id: null, name: "" })}
          >
            Скасувати
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!categoryEdit.name.trim()) return;
              await apiUpdateCategory(categoryEdit.id, {
                name: categoryEdit.name.trim(),
              });
              setCategoryEdit({ open: false, id: null, name: "" });
              fetchCategories();
            }}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог редагування */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Редагувати документ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Назва"
            value={editData.title}
            onChange={(e) =>
              setEditData({ ...editData, title: e.target.value })
            }
            margin="normal"
          />

          <TextField
            fullWidth
            label="Опис"
            value={editData.description}
            onChange={(e) => {
              const MAX = 2000;
              const next = (e.target.value || "").slice(0, MAX);
              setEditData({ ...editData, description: next });
            }}
            margin="normal"
            multiline
            rows={3}
            helperText={`${
              2000 - (editData.description?.length || 0)
            } символів залишилось`}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Категорія</InputLabel>
            <Select
              value={editData.category_id || ""}
              onChange={(e) =>
                setEditData({ ...editData, category_id: e.target.value })
              }
            >
              <MenuItem value="">Без категорії</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Теги (через кому)"
            value={editData.tags}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
            margin="normal"
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editData.noTerm}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      noTerm: e.target.checked,
                      viewUntil: e.target.checked ? "" : editData.viewUntil,
                    })
                  }
                />
              }
              label="Без терміну"
            />
            <TextField
              type="date"
              label="Термін перегляду"
              InputLabelProps={{ shrink: true }}
              disabled={editData.noTerm}
              value={editData.viewUntil}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  viewUntil: e.target.value,
                  noTerm: !e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Скасувати</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Збереження..." : "Зберегти"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог видалення */}
      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteDialog?.type === "category" &&
              `Видалити категорію "${deleteDialog?.name}"?`}
            {deleteDialog?.type === "user" &&
              `Видалити користувача "${deleteDialog?.name}"?`}
            {deleteDialog?.type === undefined &&
              `Ви впевнені, що хочете видалити документ "${selectedDocument?.title}"?`}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Ця дія незворотна. Файл буде видалено назавжди.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Скасувати</Button>
          <Button
            onClick={async () => {
              if (deleteDialog?.type === "category") {
                await apiDeleteCategory(deleteDialog.id);
                setDeleteDialog(false);
                fetchCategories();
                return;
              }
              if (deleteDialog?.type === "user") {
                await apiDeleteUser(deleteDialog.id);
                setDeleteDialog(false);
                fetchUsers();
                return;
              }
              await confirmDelete();
            }}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? "Видалення..." : "Видалити"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
