const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find()
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      totalPosts,
      totalPages,
      currentPage: page,
      posts
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/', authenticateToken, authorizeRole('Write'), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const post = new Post({ title, content, author });
    const savedPost = await post.save();
    res.json(savedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put('/:postId', authenticateToken, authorizeRole('Write'), async (req, res) => {
  try {
    
    const { title, content, author } = req.body;
    
    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, { title, content, author }, { new: true });
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/:postId', authenticateToken, authorizeRole('Administer'), async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.postId);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
