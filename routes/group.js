const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 🔍 GET all groups
router.get('/', async (req, res) => {
  try {
    const [groups] = await db.execute("SELECT group_id, name FROM team_group");

    for (let group of groups) {
      const [mentors] = await db.execute(
        "SELECT mentor_id FROM group_mentors WHERE group_id = ?",
        [group.group_id]
      );
      group.mentor_ids = mentors.map(m => m.mentor_id); // gunakan mentor_id
    }

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 GET group by ID
router.get("/:id", async (req, res) => {
  try {
    const [groups] = await db.execute(
      "SELECT group_id, name FROM team_group WHERE group_id = ?",
      [req.params.id]
    );

    if (groups.length === 0) return res.status(404).json({ message: "Group not found" });

    const [mentors] = await db.execute(
      "SELECT mentor_id FROM group_mentors WHERE group_id = ?",
      [req.params.id]
    );

    const group = {
      ...groups[0],
      mentor_ids: mentors.map(m => m.mentor_id),
    };

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➕ CREATE group
router.post("/", async (req, res) => {
  const { name, mentor_ids } = req.body;

  if (!name || !Array.isArray(mentor_ids)) {
    return res.status(400).json({ message: "Name and mentor_ids (array) are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      "INSERT INTO team_group (name) VALUES (?)",
      [name]
    );

    const groupId = result.insertId;

    for (const mentorId of mentor_ids) {
      await connection.execute(
        "INSERT INTO group_mentors (group_id, mentor_id) VALUES (?, ?)",
        [groupId, mentorId]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Group created", group_id: groupId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ✏️ UPDATE group
router.put("/:id", async (req, res) => {
  const { name, mentor_ids } = req.body;

  if (!name || !Array.isArray(mentor_ids)) {
    return res.status(400).json({ message: "Name and mentor_ids (array) are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      "UPDATE team_group SET name = ? WHERE group_id = ?",
      [name, req.params.id]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Group not found" });
    }

    await connection.execute("DELETE FROM group_mentors WHERE group_id = ?", [req.params.id]);

    for (const mentorId of mentor_ids) {
      await connection.execute(
        "INSERT INTO group_mentors (group_id, mentor_id) VALUES (?, ?)",
        [req.params.id, mentorId]
      );
    }

    await connection.commit();
    res.json({ message: "Group updated" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// ❌ DELETE group
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute("DELETE FROM group_mentors WHERE group_id = ?", [req.params.id]);
    const [result] = await connection.execute("DELETE FROM team_group WHERE group_id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Group not found" });
    }

    await connection.commit();
    res.json({ message: "Group deleted" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
