process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('./server');

describe('EduStream Compatibility & Performance Tests', () => {
  test('GET /api/dashboard returns metrics and classroom data', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('metrics');
    expect(res.body).toHaveProperty('classrooms');
  });

  test('dashboard cache returns cached response on second request', async () => {
    const first = await request(app).get('/api/dashboard');
    const second = await request(app).get('/api/dashboard');
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.body._cached).toBe(true);
  });

  test('invalid classroom id returns a controlled 404', async () => {
    const res = await request(app).get('/api/classroom/room-invalid-hash');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('quiz trigger endpoint returns an active state', async () => {
    const res = await request(app).post('/api/classroom/quiz/trigger');
    expect(res.statusCode).toBe(200);
    expect(res.body.quizActive).toBe(true);
  });

  test('quiz submit endpoint handles a valid selection', async () => {
    const res = await request(app)
      .post('/api/classroom/quiz/submit')
      .send({ selection: 'B' });
    expect(res.statusCode).toBe(200);
    expect(res.body.isCorrect).toBe(true);
  });
});
