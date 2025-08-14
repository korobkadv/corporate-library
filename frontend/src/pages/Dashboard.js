import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search,
  Download,
  Visibility,
  PictureAsPdf,
  Image,
  AudioFile,
  VideoFile,
  Description,
} from "@mui/icons-material";
import { buildFileUrl } from "../config";
import { listCategories } from "../api/categories";
import { listDocuments, downloadDocument } from "../api/documents";
import { formatFileSize } from "../utils/format";

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);
  const [previewDoc, setPreviewDoc] = useState(null);
  // Завантаження документів перенесено в адмін-панель

  // noop

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryId) params.append("categoryId", String(categoryId));
      params.append("page", page);
      params.append("limit", String(limit));

      const data = await listDocuments(Object.fromEntries(params));
      setDocuments(data.documents);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Помилка завантаження документів:", error);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, page, limit]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await listCategories();
        if (cats) setCategories(cats);
      } catch {}
    };
    loadCategories();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategoryId(e.target.value);
    setPage(1);
  };

  const handleDownload = async (id, originalName) => {
    try {
      const blob = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
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

  const getFileIcon = (fileType) => {
    if (fileType.includes("pdf")) return <PictureAsPdf />;
    if (fileType.includes("image")) return <Image />;
    if (fileType.includes("audio")) return <AudioFile />;
    if (fileType.includes("video")) return <VideoFile />;
    return <Description />;
  };

  const isPreviewable = (fileType) => {
    return (
      fileType.includes("pdf") ||
      fileType.includes("image") ||
      fileType.includes("audio") ||
      fileType.includes("video") ||
      fileType.includes("text")
    );
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
          mt: 1,
          display: "inline-block",
          px: 1,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: bg,
        }}
      >
        <Typography variant="caption">
          Термін перегляду: {due.toLocaleDateString("uk-UA")}
        </Typography>
      </Box>
    );
  };

  const getSummary = (text) => {
    const MAX = 180;
    if (!text) return { short: "Без опису", isLong: false };
    const plain = String(text);
    if (plain.length <= MAX) return { short: plain, isLong: false };
    return { short: plain.slice(0, MAX).trim(), isLong: true };
  };

  // Немає завантаження на головній

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Пошук та фільтри */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Пошук документів"
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-label">Категорія</InputLabel>
              <Select
                labelId="category-label"
                label="Категорія"
                value={categoryId}
                onChange={handleCategoryChange}
              >
                <MenuItem value="">Всі категорії</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item
            xs={12}
            md={2}
            sx={{ display: "flex", alignItems: "stretch" }}
          >
            <Button
              fullWidth
              variant="outlined"
              sx={{ height: "56px" }}
              onClick={() => {
                setSearch("");
                setCategoryId("");
                setPage(1);
              }}
            >
              Очистити
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Список документів */}
      {loading ? (
        <Typography>Завантаження...</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      {getFileIcon(doc.file_type)}
                      <Typography variant="h6" sx={{ ml: 1 }} noWrap>
                        {doc.title}
                      </Typography>
                    </Box>

                    {(() => {
                      const { short, isLong } = getSummary(doc.description);
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {short}
                          {isLong && (
                            <Button
                              size="small"
                              component="span"
                              sx={{ px: 0, minWidth: 0 }}
                              onClick={() => setPreviewDoc(doc)}
                            >
                              {" ...>"}
                            </Button>
                          )}
                        </Typography>
                      );
                    })()}

                    <Box sx={{ mb: 2 }}>
                      {(doc.category_name || doc.category) && (
                        <Chip
                          label={doc.category_name || doc.category}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {doc.tags &&
                        doc.tags
                          .split(",")
                          .map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag.trim()}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                    </Box>

                    <Typography variant="caption" display="block">
                      Розмір: {formatFileSize(doc.file_size)}
                    </Typography>
                    {/* Термін перегляду */}
                    {renderViewUntil(doc.view_until)}
                    <Typography variant="caption" display="block">
                      Дата:{" "}
                      {new Date(doc.created_at).toLocaleDateString("uk-UA")}
                    </Typography>
                  </CardContent>

                  <CardActions>
                    {isPreviewable(doc.file_type) && (
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleView(doc)}
                      >
                        Переглянути
                      </Button>
                    )}
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownload(doc.id, doc.original_name)}
                    >
                      Скачати
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Пагінація */}
          {totalPages > page && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Button variant="outlined" onClick={() => setPage((p) => p + 1)}>
                Показати ще
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Завантаження документів доступне лише в адмін-панелі */}
      {/* Модалка з повною інформацією */}
      <Dialog
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{previewDoc?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {previewDoc?.description || "Без опису"}
          </Typography>
          <Box sx={{ mt: 2 }}>{renderViewUntil(previewDoc?.view_until)}</Box>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Категорія:{" "}
            {previewDoc?.category_name || previewDoc?.category || "—"}
          </Typography>
          <Typography variant="caption" display="block">
            Розмір: {previewDoc ? formatFileSize(previewDoc.file_size) : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDoc(null)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
