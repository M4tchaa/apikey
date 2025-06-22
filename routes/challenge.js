const express = require("express");
const pool = require("../db");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const isAdmin = require("../middleware/isAdmin");

// ==================== HEADER CHALLENGE ====================

// GET /challenge/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();

    const [challenges] = await connection.execute(
      "SELECT id_challenge, level, day, completed, created_at FROM amazing_challenge WHERE id_participant = ? ORDER BY day",
      [userId]
    );

    const result = [];

    for (const challenge of challenges) {
      let description = null;

      if (challenge.level === 1) {
        const [akidahRows] = await connection.execute(
          "SELECT challenge_response FROM amazing_challenge_akidah WHERE id_challenge = ? LIMIT 1",
          [challenge.id_challenge]
        );
        description = akidahRows[0]?.challenge_response || null;
      } else {
        const [detailRows] = await connection.execute(
          "SELECT challenge_response FROM amazing_challenge_detail WHERE id_challenge = ? LIMIT 1",
          [challenge.id_challenge]
        );
        description = detailRows[0]?.challenge_response || null;
      }

      result.push({
        ...challenge,
        description, // override dengan challenge_response
      });
    }

    connection.release();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data challenge" });
  }
});


// POST /challenge/start
router.post("/start", authenticate, async (req, res) => {
  const { day, level } = req.body;
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();
    const [existing] = await connection.execute(
      "SELECT * FROM amazing_challenge WHERE id_participant = ? AND day = ? AND level = ?",
      [userId, day, level]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ message: "Challenge hari ini sudah dibuat" });
    }

    const [result] = await connection.execute(
      "INSERT INTO amazing_challenge (id_participant, day, level) VALUES (?, ?, ?)",
      [userId, day, level]
    );

    connection.release();
    res.status(201).json({
      message: "Challenge berhasil dibuat",
      id_challenge: result.insertId,
      level
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat challenge" });
  }
});

// ==================== NON-AKIDAH (4 DETAIL) ====================

// POST /challenge/detail
router.post("/detail", authenticate, async (req, res) => {
  const { id_challenge, challenges } = req.body;

  if (!Array.isArray(challenges) || challenges.length !== 4) {
    return res.status(400).json({ message: "Harus mengirim 4 sub-challenge" });
  }

  try {
    const connection = await pool.getConnection();

    for (const ch of challenges) {
      await connection.execute(
        `INSERT INTO amazing_challenge_detail 
         (id_challenge, challenge_title, challenge_response, is_completed) 
         VALUES (?, ?, ?, ?)`,
        [id_challenge, ch.challenge_title, ch.challenge_response ?? null, ch.is_completed ?? 0]
      );
    }

    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) AS total FROM amazing_challenge_detail 
       WHERE id_challenge = ? AND is_completed = 1`,
      [id_challenge]
    );

    await connection.execute(
      `UPDATE amazing_challenge SET completed = ? WHERE id_challenge = ?`,
      [total, id_challenge]
    );

    connection.release();
    res.status(201).json({ message: "4 sub-challenge berhasil disimpan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan sub-challenge" });
  }
});

// GET /challenge/detail/:id
router.get("/detail/:id", authenticate, async (req, res) => {
  const id_challenge = req.params.id;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM amazing_challenge_detail WHERE id_challenge = ? ORDER BY id_detail",
      [id_challenge]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil detail challenge" });
  }
});

// PUT /challenge/detail/:id
router.put("/detail/:id", authenticate, async (req, res) => {
  const id_detail = req.params.id;
  const { challenge_response, is_completed } = req.body;

  try {
    const connection = await pool.getConnection();

    await connection.execute(
      "UPDATE amazing_challenge_detail SET challenge_response = ?, is_completed = ? WHERE id_detail = ?",
      [challenge_response, is_completed ?? 0, id_detail]
    );

    const [[{ id_challenge }]] = await connection.execute(
      "SELECT id_challenge FROM amazing_challenge_detail WHERE id_detail = ?",
      [id_detail]
    );

    const [[{ total_completed }]] = await connection.execute(
      "SELECT COUNT(*) AS total_completed FROM amazing_challenge_detail WHERE id_challenge = ? AND is_completed = 1",
      [id_challenge]
    );

    await connection.execute(
      "UPDATE amazing_challenge SET completed = ? WHERE id_challenge = ?",
      [total_completed, id_challenge]
    );

    connection.release();
    res.json({ message: "Sub-challenge diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update sub-challenge" });
  }
});

// ==================== AKIDAH (1 RESPONSE) ====================

// POST /challenge/akidah
router.post("/akidah", authenticate, async (req, res) => {
  const { id_challenge, challenge_response, is_completed } = req.body;

  try {
    const connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO amazing_challenge_akidah 
        (id_challenge, challenge_response, is_completed)
        VALUES (?, ?, ?)`,
      [id_challenge, challenge_response ?? null, is_completed ?? 0]
    );

    await connection.execute(
      `UPDATE amazing_challenge SET completed = ? WHERE id_challenge = ?`,
      [is_completed ?? 0, id_challenge]
    );

    connection.release();
    res.status(201).json({ message: "Sub-challenge akidah disimpan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan sub-challenge akidah" });
  }
});

// GET /challenge/akidah/:id
router.get("/akidah/:id", authenticate, async (req, res) => {
  const id_challenge = req.params.id;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM amazing_challenge_akidah WHERE id_challenge = ?",
      [id_challenge]
    );
    connection.release();
    res.json(rows[0] ?? {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil sub-akidah" });
  }
});

// PUT /challenge/akidah/:id
router.put("/akidah/:id", authenticate, async (req, res) => {
  const id_challenge_ak = req.params.id;
  const { challenge_response, is_completed } = req.body;

  try {
    const connection = await pool.getConnection();

    await connection.execute(
      "UPDATE amazing_challenge_akidah SET challenge_response = ?, is_completed = ? WHERE id_challenge_ak = ?",
      [challenge_response, is_completed ?? 0, id_challenge_ak]
    );

    const [[{ id_challenge }]] = await connection.execute(
      "SELECT id_challenge FROM amazing_challenge_akidah WHERE id_challenge_ak = ?",
      [id_challenge_ak]
    );

    await connection.execute(
      "UPDATE amazing_challenge SET completed = ? WHERE id_challenge = ?",
      [is_completed ?? 0, id_challenge]
    );

    connection.release();
    res.json({ message: "Sub-challenge akidah diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update akidah" });
  }
});

// ==================== ADMIN ====================

// GET /challenge/all?day=3
router.get("/all", [authenticate, isAdmin], async (req, res) => {
  const { day } = req.query;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT ac.id_challenge, u.username, ac.day, ac.level, ac.completed, ac.created_at
       FROM amazing_challenge ac
       JOIN users u ON u.id_user = ac.id_participant
       WHERE ac.day = ?
       ORDER BY ac.level`,
      [day]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});


// GET /challenge/participant/:id
router.get("/participant/:id", [authenticate, isAdmin], async (req, res) => {
  const id_participant = req.params.id;

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM amazing_challenge WHERE id_participant = ? ORDER BY day`,
      [id_participant]
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data challenge peserta" });
  }
});

// DELETE /challenge/:id
router.delete("/:id", [authenticate, isAdmin], async (req, res) => {
  const id_challenge = req.params.id;

  try {
    const connection = await pool.getConnection();
    await connection.execute("DELETE FROM amazing_challenge WHERE id_challenge = ?", [id_challenge]);
    connection.release();
    res.json({ message: "Challenge dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus challenge" });
  }
});

module.exports = router;
