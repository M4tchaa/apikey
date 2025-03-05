const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

// 📌 Get All Groups
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM team_group");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Get Group by ID
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM team_group WHERE group_id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Group not found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Create Group
router.post("/", async (req, res) => {
    const { name, id_mentor } = req.body;
    if (!name || !id_mentor) return res.status(400).json({ message: "Name and id_mentor are required" });

    try {
        const [result] = await db.execute("INSERT INTO team_group (name, id_mentor) VALUES (?, ?)", [name, id_mentor]);
        res.status(201).json({ message: "Group created", group_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Update Group
router.put("/:id", async (req, res) => {
    const { name, id_mentor } = req.body;
    try {
        const [result] = await db.execute("UPDATE team_group SET name = ?, id_mentor = ? WHERE group_id = ?", [name, id_mentor, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Group not found" });
        res.json({ message: "Group updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Delete Group
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.execute("DELETE FROM team_group WHERE group_id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Group not found" });
        res.json({ message: "Group deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
