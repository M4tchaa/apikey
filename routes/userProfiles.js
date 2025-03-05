const express = require('express');
const router = express.Router();
const db = require('../db'); // Sesuaikan path koneksi database

// POST tambah user profile baru
router.post('/', async (req, res) => {
    try {
        const { id_user, fullname, hobby, address, phone_number, subdistrict, group_id, city, age, status } = req.body;

        // Cek apakah user ada
        const [user] = await db.execute('SELECT email FROM users WHERE id_user = ?', [id_user]);
        if (user.length === 0) return res.status(404).json({ error: "User not found" });

        const email = user[0].email;

        // Tentukan apakah profile lengkap
        const completedProfile = fullname && hobby && address && phone_number && subdistrict && group_id && city && email && age && status ? 1 : 0;

        const sql = `INSERT INTO user_profiles 
                     (id_user, fullname, hobby, address, phone_number, subdistrict, group_id, city, email, completed_profile, age, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [id_user, fullname, hobby, address, phone_number, subdistrict, group_id, city, email, completedProfile, age, status];

        // Eksekusi query
        const [result] = await db.execute(sql, values);
        res.json({ message: "User profile created successfully", id_profile: result.insertId, completed_profile: completedProfile });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update user profile berdasarkan id_user
router.put('/:id_user', async (req, res) => {
    try {
        const { fullname, hobby, address, phone_number, subdistrict, group_id, city, age, status } = req.body;
        const { id_user } = req.params;

        // Cek apakah profil user ada
        const [profile] = await db.execute('SELECT id_profile FROM user_profiles WHERE id_user = ?', [id_user]);
        if (profile.length === 0) return res.status(404).json({ error: "Profile not found" });

        // Cek apakah user ada
        const [user] = await db.execute('SELECT email FROM users WHERE id_user = ?', [id_user]);
        if (user.length === 0) return res.status(404).json({ error: "User not found" });

        const email = user[0].email;

        // Tentukan apakah profile lengkap
        const completedProfile = fullname && hobby && address && phone_number && subdistrict && group_id && city && email && age && status ? 1 : 0;

        const sql = `UPDATE user_profiles 
                     SET fullname = ?, hobby = ?, address = ?, phone_number = ?, subdistrict = ?, group_id = ?, city = ?, email = ?, completed_profile = ?, age = ?, status = ? 
                     WHERE id_user = ?`;

        const values = [fullname, hobby, address, phone_number, subdistrict, group_id, city, email, completedProfile, age, status, id_user];

        // Eksekusi query
        await db.execute(sql, values);
        res.json({ message: "User profile updated successfully", completed_profile: completedProfile });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;