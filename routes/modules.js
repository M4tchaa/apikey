const express = require("express");
const pool = require("../db");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const { body, validationResult } = require("express-validator");

// GET /modules - Public: Get all modules
router.get("/", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [modules] = await connection.execute("SELECT * FROM modules ORDER BY created_at DESC");
    connection.release();
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data modul" });
  }
});

// GET /modules/:id - Public: Get one module by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT * FROM modules WHERE id_modules = ?", [id]);
    connection.release();

    if (rows.length === 0) return res.status(404).json({ message: "Modul tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data modul" });
  }
});

// POST /modules - SuperAdmin: Create new module
router.post(
  "/",
  [
    authenticate,
    isSuperAdmin,
    body("title").notEmpty().withMessage("Judul wajib diisi"),
    body("file_url").notEmpty().withMessage("URL file wajib diisi"),
    body("video_url").notEmpty().withMessage("URL video wajib diisi")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, file_url, video_url } = req.body;

    try {
      const connection = await pool.getConnection();
      await connection.execute(
        `INSERT INTO modules (title, description, file_url, video_url) VALUES (?, ?, ?, ?)`,
        [title, description || null, file_url, video_url]
      );
      connection.release();
      res.status(201).json({ message: "Modul berhasil ditambahkan" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal menambahkan modul" });
    }
  }
);

// PUT /modules/:id - SuperAdmin: Update a module
router.put(
  "/:id",
  [
    authenticate,
    isSuperAdmin,
    body("title").notEmpty().withMessage("Judul wajib diisi"),
    body("file_url").notEmpty().withMessage("URL file wajib diisi"),
    body("video_url").notEmpty().withMessage("URL video wajib diisi")
  ],
  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, file_url, video_url } = req.body;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(
        `UPDATE modules SET title = ?, description = ?, file_url = ?, video_url = ? WHERE id_modules = ?`,
        [title, description || null, file_url, video_url, id]
      );
      connection.release();

      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Modul tidak ditemukan" });

      res.json({ message: "Modul berhasil diperbarui" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal memperbarui modul" });
    }
  }
);

// DELETE /modules/:id - SuperAdmin: Delete a module
router.delete("/:id", [authenticate, isSuperAdmin], async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute("DELETE FROM modules WHERE id_modules = ?", [id]);
    connection.release();

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Modul tidak ditemukan" });

    res.json({ message: "Modul berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus modul" });
  }
});

module.exports = router;
