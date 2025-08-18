import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, Box, CardMedia } from "@mui/material";
import { Helmet } from "react-helmet-async";
import {
  getNews,
  listComments,
  createComment,
  deleteComment,
} from "../api/news";
import { buildNewsFileUrl } from "../config";
import { useAuth } from "../contexts/AuthContext";

const NewsView = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNews(id);
      setItem(data);
      const comms = await listComments(id);
      setComments(comms);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography>Завантаження...</Typography>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography>Новину не знайдено</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>{item.title} — Корпоративна Бібліотека</title>
        <meta name="description" content={item.excerpt || item.title} />
      </Helmet>
      <Typography variant="h4" gutterBottom>
        {item.title}
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
        {new Date(item.created_at).toLocaleString("uk-UA")} —{" "}
        {item.author_name || "—"}
      </Typography>
      {item.featured_image && (
        <CardMedia
          component="img"
          sx={{ width: "100%", maxHeight: 400, objectFit: "cover", mb: 2 }}
          image={buildNewsFileUrl(item.featured_image)}
          alt={item.title}
        />
      )}
      {(() => {
        // Вкладення
        let files = [];
        try {
          files = JSON.parse(item.attachments || "[]");
        } catch {}
        return files?.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Вкладення</Typography>
            <ul>
              {files.map((f, idx) => {
                const isObj = f && typeof f === "object";
                const fileName = isObj ? f.filename : f;
                const title = isObj
                  ? f.title || f.original_name || fileName
                  : f;
                return (
                  <li key={idx}>
                    <a
                      href={buildNewsFileUrl(fileName)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </Box>
        ) : null;
      })()}
      <Box sx={{ mt: 2 }}>
        {/* Спочатку короткий опис, далі повний контент */}
        {item.excerpt && (
          <Typography sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {item.excerpt}
          </Typography>
        )}
        {/* Контент безпечний на бекенді через sanitize-html */}
        <div dangerouslySetInnerHTML={{ __html: item.content }} />
      </Box>

      {/* Коментарі */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Коментарі ({comments.length})
        </Typography>
        {comments.map((c) => (
          <Box key={c.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              {c.author_name || "Користувач"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {new Date(c.created_at).toLocaleString("uk-UA")}
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{c.content}</Typography>
            {user?.role && ["admin", "editor"].includes(user.role) && (
              <button
                onClick={async () => {
                  await deleteComment(c.id);
                  setComments((prev) => prev.filter((x) => x.id !== c.id));
                }}
                style={{ marginTop: 4 }}
              >
                Видалити
              </button>
            )}
          </Box>
        ))}

        {user ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Додати коментар
            </Typography>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                try {
                  setSubmitting(true);
                  await createComment(id, commentText.trim());
                  setCommentText("");
                  const comms = await listComments(id);
                  setComments(comms);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                style={{ width: "100%" }}
                placeholder="Ваш коментар..."
              />
              <button
                type="submit"
                disabled={submitting}
                style={{ marginTop: 8 }}
              >
                {submitting ? "Надсилання..." : "Надіслати"}
              </button>
            </form>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Щоб залишити коментар, увійдіть у систему.
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default NewsView;
