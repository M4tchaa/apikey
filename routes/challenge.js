const express = require("express");
const pool = require("../db");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// ✅ Middleware Auth
const authenticate = require("../middleware/authenticate");
const isAdmin = require("../middleware/isAdmin"); // cek role dari token

// ========================== PESERTA ========================== //

// GET /challenge/me
router.get("/me", authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM amazing_challenge WHERE id_participant = ? ORDER BY day",
      [userId]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

// POST /challenge
router.post(
  "/",
  authenticate,
  [
    body("day").notEmpty(),
    body("description").optional(),
    body("level").optional().isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { day, level, description } = req.body;
    const userId = req.user.id;

    try {
      const connection = await pool.getConnection();

      // Cek apakah sudah mengisi hari yang sama
      const [existing] = await connection.execute(
        "SELECT * FROM amazing_challenge WHERE id_participant = ? AND day = ?",
        [userId, day]
      );

      if (existing.length > 0) {
        await connection.execute(
          "UPDATE amazing_challenge SET description = ?, completed = ?, level = ? WHERE id_participant = ? AND day = ?",
          [description, 1, level, userId, day]
        );
        res.json({ message: "Challenge diperbarui" });
      } else {
        await connection.execute(
          "INSERT INTO amazing_challenge (id_participant, day, level, description, completed) VALUES (?, ?, ?, ?, 1)",
          [userId, day, level, description]
        );
        res.status(201).json({ message: "Challenge disimpan" });
      }

      connection.release();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal menyimpan data" });
    }
  }
);

// ========================== ADMIN ========================== //

// GET /challenge/all?day=3
router.get("/all", [authenticate, isAdmin], async (req, res) => {
  const { day } = req.query;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT ac.*, u.username FROM amazing_challenge ac JOIN users u ON ac.id_participant = u.id_user WHERE ac.day = ?",
      [day]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

// GET /challenge/status?day=3
router.get("/status", [authenticate, isAdmin], async (req, res) => {
  const { day } = req.query;

  try {
    const connection = await pool.getConnection();
    const [sudah] = await connection.execute(
      "SELECT COUNT(*) AS selesai FROM amazing_challenge WHERE day = ? AND completed = 1",
      [day]
    );
    const [total] = await connection.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'peserta'");

    connection.release();
    res.json({ selesai: sudah[0].selesai, total: total[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil status" });
  }
});

// DELETE /challenge/:id
router.delete("/:id", [authenticate, isAdmin], async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    await connection.execute("DELETE FROM amazing_challenge WHERE id_challenge = ?", [id]);
    connection.release();
    res.json({ message: "Challenge dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus data" });
  }
});

module.exports = router;
