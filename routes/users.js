const express = require('express');
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const db = require('../db'); // Import koneksi database

// GET semua users dengan JOIN ke user_profiles
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT u.id_user, u.username, u.email, u.role, u.created_at, 
             p.id_profile, p.fullname, p.hobby, p.address, 
             p.phone_number, p.subdistrict, p.group_id, p.city, 
             p.age, p.status, p.completed_profile
      FROM users u
      LEFT JOIN user_profiles p ON u.id_user = p.id_user
      WHERE u.deleted = 0;
    `;
    const [users] = await db.execute(sql);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET user berdasarkan id_user
router.get('/:id_user', async (req, res) => {
  try {
    const { id_user } = req.params;
    const sql = `
      SELECT u.id_user, u.username, u.email, u.role, u.created_at, 
             p.id_profile, p.fullname, p.hobby, p.address, 
             p.phone_number, p.subdistrict, p.group_id, p.city, 
             p.age, p.status, p.completed_profile
      FROM users u
      LEFT JOIN user_profiles p ON u.id_user = p.id_user
      WHERE u.id_user = ? AND u.deleted = 0;
    `;
    const [result] = await db.execute(sql, [id_user]);

    if (result.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Tambah user baru (opsional bisa langsung buat profil)
router.post('/', async (req, res) => {
  try {
    let { username, email, password, role } = req.body;

    // Validasi input wajib
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email, and password are required" });
    }

    // Jika role tidak diberikan, gunakan null
    role = role ?? null;

    // Tambahkan user ke tabel users
    const userSql = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
    const [userResult] = await db.execute(userSql, [username, email, password, role]);

    res.json({ success: true, message: 'User created successfully', id_user: userResult.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update user dan profile berdasarkan id_user
// PUT Update user dan profile berdasarkan id_user
router.put('/:id_user', async (req, res) => {
  try {
    const { id_user } = req.params;
    const { username, email, role, fullname, hobby, address, phone_number, subdistrict, group_id, city, age, status } = req.body;

    // Cek apakah user ada di database
    const [userCheck] = await db.execute('SELECT * FROM users WHERE id_user = ?', [id_user]);
    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Ambil data lama dari database untuk menghindari NULL
    const oldUser = userCheck[0];

    // Jika email tidak dikirim, gunakan email lama
    const newEmail = email !== undefined ? email : oldUser.email;

    // Pastikan email tidak NULL atau kosong
    if (!newEmail || newEmail.trim() === '') {
      return res.status(400).json({ success: false, message: "Email cannot be empty" });
    }

    // Update tabel users (gunakan data lama jika tidak dikirim)
    const updateUserSql = `
      UPDATE users SET 
        username = ?, 
        email = ?, 
        role = ? 
      WHERE id_user = ?`;

    await db.execute(updateUserSql, [
      username || oldUser.username,
      newEmail, 
      role || oldUser.role,
      id_user
    ]);

    // Cek apakah user punya profil
    const [profileCheck] = await db.execute('SELECT * FROM user_profiles WHERE id_user = ?', [id_user]);
    
    if (profileCheck.length > 0) {
      // Jika profil ada, update (gunakan nilai lama jika tidak dikirim)
      const oldProfile = profileCheck[0];

      const updateProfileSql = `
        UPDATE user_profiles SET 
          fullname = ?, 
          hobby = ?, 
          address = ?, 
          phone_number = ?, 
          subdistrict = ?, 
          group_id = ?, 
          city = ?, 
          age = ?, 
          status = ?, 
          completed_profile = CASE 
            WHEN fullname IS NOT NULL AND address IS NOT NULL AND phone_number IS NOT NULL 
                 AND subdistrict IS NOT NULL AND group_id IS NOT NULL AND city IS NOT NULL
                 AND age IS NOT NULL AND status IS NOT NULL THEN 1 
            ELSE 0 END
        WHERE id_user = ?`;

      await db.execute(updateProfileSql, [
        fullname || oldProfile.fullname,
        hobby || oldProfile.hobby,
        address || oldProfile.address,
        phone_number || oldProfile.phone_number,
        subdistrict || oldProfile.subdistrict,
        group_id || oldProfile.group_id,
        city || oldProfile.city,
        age || oldProfile.age,
        status || oldProfile.status,
        id_user
      ]);
    } else {
      // Jika tidak ada profil, buat profil baru dengan nilai default jika tidak dikirim
      const insertProfileSql = `
        INSERT INTO user_profiles 
        (id_user, fullname, hobby, address, phone_number, subdistrict, group_id, city, age, status, email, completed_profile) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; 

      const completedProfile = fullname && address && phone_number && subdistrict && group_id && city && age && status ? 1 : 0;

      await db.execute(insertProfileSql, [
        id_user, fullname || '', hobby || '', address || '', phone_number || '',
        subdistrict || 'UNKNOWN',
        group_id || 0,
        city || '',
        age || 0,
        status || 0,
        newEmail, // Pastikan email tidak NULL
        completedProfile
      ]);
    }

    res.json({ success: true, message: 'User and profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE user dan profil
router.delete('/:id_user', async (req, res) => {
  try {
    const { id_user } = req.params;

    // Cek apakah user ada
    const [userCheck] = await db.execute('SELECT * FROM users WHERE id_user = ?', [id_user]);
    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Soft delete: tandai user sebagai terhapus
    await db.execute('UPDATE users SET deleted = 1 WHERE id_user = ?', [id_user]);

    // Hapus profil dari tabel user_profiles
    await db.execute('DELETE FROM user_profiles WHERE id_user = ?', [id_user]);

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// HARD DELETE user dan profil (khusus superadmin)
router.delete('/hard/:id_user', [authenticate, isSuperAdmin], async (req, res) => {
  try {
    const { id_user } = req.params;

    // Cek apakah target user ada
    const [userCheck] = await db.execute('SELECT * FROM users WHERE id_user = ?', [id_user]);
    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." });
    }

    // Hapus profil dulu (jika ada)
    await db.execute('DELETE FROM user_profiles WHERE id_user = ?', [id_user]);

    // Hapus user utama
    await db.execute('DELETE FROM users WHERE id_user = ?', [id_user]);

    res.json({ success: true, message: 'User berhasil dihapus secara permanen.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
