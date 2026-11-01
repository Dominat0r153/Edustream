process.env.NODE_ENV = 'test';
const path = require('path');
const fs = require('fs');
const os = require('os');
const tempDataFile = path.join(os.tmpdir(), `edustream-api-${process.pid}-${Date.now()}.json`);
process.env.EDUSTREAM_DATA_FILE = tempDataFile;

const request = require('supertest');
const app = require('../server');
const { sequelize, clearStoreCache } = require('../config/database');

afterAll(async () => {
  await sequelize.close();
  clearStoreCache();
  try { fs.unlinkSync(tempDataFile); } catch {}
});

describe('EduStream Backend Integration Tests', () => {
  let studentToken;
  let instructorToken;
  let testRoomId;

  test('registers a new instructor account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'prof@edustream.edu', password: 'password123', role: 'instructor' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user_id');
  });

  test('authenticates and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'prof@edustream.edu', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    instructorToken = res.body.token;
  });

  test('rejects protected requests without authentication', async () => {
    const res = await request(app).get('/api/v1/dashboard');
    expect(res.statusCode).toBe(401);
  });

  test('creates and retrieves an instructor classroom', async () => {
    const createRes = await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'CS-301: Systems Relational Layer' });
    expect(createRes.statusCode).toBe(201);
    testRoomId = createRes.body.room_id;

    const listRes = await request(app)
      .get('/api/v1/classrooms')
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.some(room => room.room_id === testRoomId)).toBe(true);
  });

  test('returns classroom context for the authorized instructor', async () => {
    const res = await request(app)
      .get(`/api/v1/classrooms/${testRoomId}`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.classroom.id).toBe(testRoomId);
  });

  test('rejects quiz scores above 100', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'student@edustream.edu', password: 'password123', role: 'student' });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@edustream.edu', password: 'password123' });
    studentToken = loginRes.body.token;

    const res = await request(app)
      .post('/api/v1/quizzes/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ room_id: testRoomId, score_ratio: 150 });
    expect(res.statusCode).toBe(400);
  });

  test('records a correct quiz submission and persists it', async () => {
    const trigger = await request(app)
      .post('/api/v1/quizzes/trigger')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ room_id: testRoomId });
    expect(trigger.statusCode).toBe(200);
    expect(trigger.body.quiz).toHaveProperty('options');

    const submit = await request(app)
      .post('/api/v1/quizzes/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ room_id: testRoomId, selection: 'B' });
    expect(submit.statusCode).toBe(201);
    expect(submit.body.isCorrect).toBe(true);
  });
});
