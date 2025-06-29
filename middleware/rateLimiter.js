const rateLimit = require('express-rate-limit');

// Limit untuk username/email checking (lebih ketat)
const checkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // max 5 request per menit per IP
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.' },
});

// Limit untuk register (bisa lebih longgar)
const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // max 10 request per menit per IP
  message: { success: false, message: 'Terlalu banyak percobaan registrasi, coba lagi nanti.' },
});

// Limit login (lebih ketat)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // max 5 request per menit per IP
  message: { success: false, message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.' },
  standardHeaders: true, // untuk debug di header
  legacyHeaders: false,
});

module.exports = { checkLimiter, registerLimiter, loginLimiter };