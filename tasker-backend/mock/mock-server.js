const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('./mock/db.json');
const middlewares = jsonServer.defaults();
const port = 3001;

// Mock token — fixed string, frontend just needs something truthy
const MOCK_TOKEN = 'mock-jwt-token-dev';

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Mock /login endpoint
server.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = router.db.getState();
  const user = db.users.find((u) => u.email === email);

  if (user && password === 'password') {
    res.json({ id: user.id, name: user.name, email: user.email, token: MOCK_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

server.use(router);

server.listen(port, () => {
  console.log(`Mock server running on http://localhost:${port}`);
  console.log(`  GET    /tasks`);
  console.log(`  POST   /tasks`);
  console.log(`  PATCH  /tasks/:id`);
  console.log(`  DELETE /tasks/:id`);
  console.log(`  POST   /login`);
});
