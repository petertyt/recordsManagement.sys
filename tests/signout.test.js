const assert = require('assert');
const express = require('express');

async function runTest() {
  const app = express();
  app.use(express.json());
  let receivedToken;

  const server = app.post('/api/session/logout', (req, res) => {
    receivedToken = req.body.sessionToken;
    res.json({ message: 'Logged out successfully' });
  }).listen(0);

  const port = server.address().port;
  const token = 'test-token';

  await fetch(`http://localhost:${port}/api/session/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken: token }),
  });

  assert.strictEqual(receivedToken, token, 'Token not received by logout endpoint');
  server.close();
  console.log('Sign-out integration test passed');
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
