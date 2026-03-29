const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  tag: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    tag: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

module.exports = { createTaskSchema, updateTaskSchema };
