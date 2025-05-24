const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const transporter = require("../config/email");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Endpoint Registrasi
router.post(
    "/register",
    [
      body("username").notEmpty().withMessage("Username wajib diisi"),
      body("email").isEmail().withMessage("Email tidak valid"),
      body("password").isLength({ min: 6 }).withMessage("Password minimal 6 karakter"),
      body("role").optional().isIn(["superadmin", "pembimbing", "admin", "peserta"]).withMessage("Role tidak valid"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { username, email, password, role } = req.body;
  
      try {
        const connection = await pool.getConnection();
  
        // Cek apakah email sudah terdaftar
        const [existingUser] = await connection.execute("SELECT email FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
          connection.release();
          return res.status(400).json({ message: "Email sudah digunakan" });
        }
  
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Insert data ke database
        const [result] = await connection.execute(
          "INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, 0)",
          [username, email, hashedPassword, role || null]
        );
  
        const userId = result.insertId;
  
        // Buat token verifikasi
        const verificationToken = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const verificationLink = `https://apikey.yukngajibogor.com/auth/verify-email/${verificationToken}`;
  
        // Kirim email verifikasi
        const mailOptions = {
          from: `"YukNgaji Bogor" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Verifikasi Email - Yuk Ngaji Bogor",
          text: `Halo ${username},\n\nKlik link berikut untuk verifikasi email Anda:\n${verificationLink}\n\nLink ini berlaku selama 24 jam.`,
        };
  
        await transporter.sendMail(mailOptions);
  
        connection.release();
        res.status(201).json({ message: "Registrasi berhasil! Cek email untuk verifikasi akun." });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      }
    }
  );

//   Verifikasi Email
  router.get("/verify-email/:token", async (req, res) => {
    const { token } = req.params;
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const connection = await pool.getConnection();
      await connection.execute("UPDATE users SET is_verified = 1 WHERE id_user = ?", [decoded.id]);
  
      connection.release();
      res.json({ message: "Email berhasil diverifikasi! Silakan login." });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
    }
  });
  
// Login
router.post(
    "/login",
    [
      body("identifier").notEmpty().withMessage("Email atau username wajib diisi"),
      body("password").notEmpty().withMessage("Password wajib diisi"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { identifier, password } = req.body;
  
      try {
        const connection = await pool.getConnection();
  
        // Cek apakah pengguna ada berdasarkan username atau email
        const [users] = await connection.execute(
          "SELECT * FROM users WHERE email = ? OR username = ?",
          [identifier, identifier]
        );
  
        if (users.length === 0) {
          connection.release();
          return res.status(400).json({ message: "Username/email atau password salah" });
        }
  
        const user = users[0];
  
        // Cek apakah email sudah diverifikasi
        if (user.is_verified === 0) {
          connection.release();
          return res.status(400).json({ message: "Akun belum diverifikasi! Cek email Anda." });
        }
  
        // Cek password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          connection.release();
          return res.status(400).json({ message: "Username/email atau password salah" });
        }
  
        // Buat JWT Token
        const token = jwt.sign(
          { id: user.id_user, email: user.email, username: user.username, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "2h" }
        );
  
        connection.release();
        res.json({ message: "Login berhasil", token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan server" });
      }
    }
  );  
// Endpoint untuk request reset password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    console.log("[FORGOT PASSWORD] Request diterima untuk email:", email);
  
    try {
      const connection = await pool.getConnection();
      console.log("[FORGOT PASSWORD] Database connected");
  
      // Cek apakah email ada di database
      const [users] = await connection.execute("SELECT * FROM users WHERE email = ?", [email]);
  
      if (users.length === 0) {
        connection.release();
        console.log("[FORGOT PASSWORD] Email tidak ditemukan:", email);
        return res.status(400).json({ message: "Email tidak ditemukan" });
      }
  
      const user = users[0];
      console.log("[FORGOT PASSWORD] Pengguna ditemukan:", user.username);
  
      // Buat token reset password
      const resetToken = jwt.sign(
        { id: user.id_user, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      console.log("[FORGOT PASSWORD] Token reset password dibuat:", resetToken);
  
      const resetLink = `https://key.yukngajibogor.com/reset-password/${resetToken}`;
      // const resetLink = `https://apikey.yukngajibogor.com/auth/reset-password/${resetToken}`;
      console.log("[FORGOT PASSWORD] Reset link:", resetLink);
  
      // Kirim email reset password
      const mailOptions = {
        from: `"YukNgaji Bogor" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Reset Password - Yuk Ngaji Bogor",
        text: `Halo ${user.username},\n\nKlik link berikut untuk reset password:\n${resetLink}\n\nLink ini hanya berlaku selama 15 menit.`,
      };
  
      console.log("[FORGOT PASSWORD] Mengirim email ke:", user.email);
      
      await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("[FORGOT PASSWORD] Kesalahan saat mengirim email:", error);
          return res.status(500).json({ message: "Gagal mengirim email", error: error.message });
        }
        console.log("[FORGOT PASSWORD] Email berhasil dikirim:", info.response);
        res.json({ message: "Link reset password telah dikirim ke email Anda" });
      });
  
      connection.release();
    } catch (error) {
      console.error("[FORGOT PASSWORD] Kesalahan server:", error);
      res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
  });
  

// Reset Password
  router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Hash password baru
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const connection = await pool.getConnection();
      await connection.execute("UPDATE users SET password = ? WHERE id_user = ?", [hashedPassword, decoded.id]);
  
      connection.release();
      res.json({ message: "Password berhasil direset, silakan login" });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
    }
  });
  

module.exports = router;
