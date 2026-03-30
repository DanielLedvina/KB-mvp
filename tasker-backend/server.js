const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const swaggerAuth = YAML.load("./swagger/auth.yaml");
const swaggerTasks = YAML.load("./swagger/tasks.yaml");

const swaggerDocument = {
  ...swaggerTasks,
  paths: { ...swaggerAuth.paths, ...swaggerTasks.paths },
  components: {
    schemas: { ...swaggerAuth.components.schemas, ...swaggerTasks.components.schemas },
    responses: { ...swaggerAuth.components.responses, ...swaggerTasks.components.responses },
  },
};

app.use("/api-docs/auth", swaggerUi.serveFiles(swaggerAuth), swaggerUi.setup(swaggerAuth));
app.use("/api-docs/tasks", swaggerUi.serveFiles(swaggerTasks), swaggerUi.setup(swaggerTasks));
app.use("/api-docs", swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => res.send("Welcome to Tasker API!"));
app.use("/", authRoutes);
app.use("/tasks", taskRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
