const request = require('supertest');
const app = require('../index');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const testUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'JohnDoe',
  password: '123dev321',
  role: 'Write'
};
const testToken = jwt.sign({ userId: testUser._id, username: testUser.username, role: testUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('GET /api/posts', () => {
  it('responds with JSON containing the list of posts', async () => {
    const response = await request(app).get('/api/posts');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('posts');
  });
});

describe('POST /api/posts', () => {
  it('responds with JSON containing the newly created post', async () => {
    const postData = { title: 'Test Post', content: 'Test content', author: 'Test Author' };
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${testToken}`)
      .send(postData);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(postData);
  });

  it('responds with 401 if user is not authenticated', async () => {
    const response = await request(app).post('/api/posts').send({ title: 'Test Post', content: 'Test content', author: 'Test Author' });
    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/posts/:postId', () => {
  it('responds with JSON containing the post with the specified ID', async () => {
    const newPost = new Post({ title: 'Test Post', content: 'Test content', author: 'Test Author' });
    await newPost.save();
    const response = await request(app).get(`/api/posts/${newPost._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(newPost.toJSON());
  });

  it('responds with 404 if the post with the specified ID does not exist', async () => {
    const response = await request(app).get('/api/posts/invalid-id');
    expect(response.statusCode).toBe(404);
  });
});

describe('PUT /api/posts/:postId', () => {
  it('responds with JSON containing the updated post', async () => {
    const newPost = new Post({ title: 'Test Post', content: 'Test content', author: 'Test Author' });
    await newPost.save();
    const updatedData = { title: 'Updated Post', content: 'Updated content' };
    const response = await request(app)
      .put(`/api/posts/${newPost._id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(updatedData);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(updatedData);
  });

  it('responds with 404 if the post with the specified ID does not exist', async () => {
    const response = await request(app).put('/api/posts/invalid-id').set('Authorization', `Bearer ${testToken}`);
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /api/posts/:postId', () => {
  it('responds with JSON containing success message upon successful deletion', async () => {
    const newPost = new Post({ title: 'Test Post', content: 'Test content', author: 'Test Author' });
    await newPost.save();
    const response = await request(app).delete(`/api/posts/${newPost._id}`).set('Authorization', `Bearer ${testToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Post deleted successfully');
  });

  it('responds with 404 if the post with the specified ID does not exist', async () => {
    const response = await request(app).delete('/api/posts/invalid-id').set('Authorization', `Bearer ${testToken}`);
    expect(response.statusCode).toBe(404);
  });
});

describe('Authentication and Authorization Middleware', () => {
  it('responds with 401 if authentication token is missing', async () => {
    const response = await request(app).post('/api/posts').send({ title: 'Test Post', content: 'Test content', author: 'Test Author' });
    expect(response.statusCode).toBe(401);
  });

  it('responds with 403 if user does not have required role for endpoint', async () => {
    const invalidUser = {
      _id: mongoose.Types.ObjectId(),
      username: 'AliceSmith',
      password: 'alice123',
      role: 'Read'
    };
    const invalidToken = jwt.sign({ userId: invalidUser._id, username: invalidUser.username, role: invalidUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send({ title: 'Test Post', content: 'Test content', author: 'Test Author' });
    expect(response.statusCode).toBe(403);
  });
});

afterAll(async () => {
  await Post.deleteMany({});
  await User.deleteMany({});
});