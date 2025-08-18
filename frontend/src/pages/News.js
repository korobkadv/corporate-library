import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
} from "@mui/material";
import { listNews } from "../api/news";
import { buildNewsFileUrl } from "../config";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const News = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listNews({ page, limit: 10 });
      setItems(data.news || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>Новини — Корпоративна Бібліотека</title>
        <meta name="description" content="Стрічка новин компанії" />
      </Helmet>
      <Typography variant="h4" gutterBottom>
        Новини
      </Typography>

      {loading ? (
        <Typography>Завантаження...</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((n) => (
            <Card key={n.id} sx={{ display: "flex" }}>
              {n.featured_image && (
                <CardMedia
                  component="img"
                  sx={{ width: 200, objectFit: "cover" }}
                  image={buildNewsFileUrl(n.featured_image)}
                  alt={n.title}
                />
              )}
              <CardContent
                sx={{ flex: 1 }}
                onClick={() => navigate(`/news/${n.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Typography variant="h6">{n.title}</Typography>
                {n.excerpt && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {n.excerpt}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  {new Date(n.created_at).toLocaleString("uk-UA")} —{" "}
                  {n.author_name || "—"}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  Коментарів: {n.comments_count ?? 0}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/news/${n.id}`);
                    }}
                  >
                    Читати повністю
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {totalPages > page && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button variant="outlined" onClick={() => setPage((p) => p + 1)}>
                Показати ще
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default News;
