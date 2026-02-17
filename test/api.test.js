const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server/index');

function start() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test('connect + groups endpoints work', async () => {
  const server = await start();
  const { port } = server.address();

  const connectRes = await fetch(`http://127.0.0.1:${port}/api/tenants/t1/sessions/connect`, { method: 'POST' });
  assert.equal(connectRes.status, 201);
  const session = await connectRes.json();
  assert.equal(typeof session.id, 'string');

  const groupsRes = await fetch(`http://127.0.0.1:${port}/api/tenants/t1/groups`);
  assert.equal(groupsRes.status, 200);
  const groups = await groupsRes.json();
  assert.ok(Array.isArray(groups));
  assert.ok(groups.length > 0);

  server.close();
});
