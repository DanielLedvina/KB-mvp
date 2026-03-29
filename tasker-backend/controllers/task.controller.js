const taskService = require("../services/task.service");
const asyncHandler = require("../middleware/async-handler");

const getAll = asyncHandler(async (_req, res) => {
  const tasks = await taskService.getAll();
  res.status(200).json(tasks);
});

const create = asyncHandler(async (req, res) => {
  const { title, tag, description } = req.body;
  const task = await taskService.create(title, tag, description);
  res.status(201).json(task);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await taskService.update(id, req.body);

  if (!task)
    return res.status(404).json({ error: "Task not found" });

  res.json(task);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await taskService.remove(id);

  if (!deleted)
    return res.status(404).json({ error: "Task not found" });

  res.status(200).json({ message: "Task deleted successfully" });
});

module.exports = { getAll, create, update, remove };
