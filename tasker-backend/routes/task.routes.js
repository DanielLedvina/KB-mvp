const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createTaskSchema, updateTaskSchema } = require("../schemas/task.schema");

router.use(authMiddleware);

router.get("/", taskController.getAll);
router.post("/", validate(createTaskSchema), taskController.create);
router.patch("/:id", validate(updateTaskSchema), taskController.update);
router.delete("/:id", taskController.remove);

module.exports = router;
