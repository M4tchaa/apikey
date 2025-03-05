const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "mail.yukngajibogor.com", // Sesuai dengan "Outgoing Server"
  port: 465, // Menggunakan port SSL/TLS yang direkomendasikan
  secure: true, // True untuk SSL (Port 465)
  auth: {
    user: process.env.EMAIL_USER, // Ambil dari .env
    pass: process.env.EMAIL_PASS, // Ambil dari .env
  },
  tls: {
    rejectUnauthorized: false, // Hindari masalah SSL self-signed
  },
});

module.exports = transporter;
