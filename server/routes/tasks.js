
const express = require("express");
const Task = require("../models/Task");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Protect every route below this point
router.use(authenticateToken);

// GET: Get only the logged-in user's tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Could not load tasks." });
  }
});

// POST: Create a task for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      dueDate,
      status,
      user: req.userId
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT: Update only the logged-in user's task
router.put("/:id", async (req, res) => {
  try {
    const { user, _id, ...updates } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete only the logged-in user's task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
