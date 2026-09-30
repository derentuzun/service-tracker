const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
    }
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND aktif = true',
      [username]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol, ad: user.ad },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, ad: user.ad, rol: user.rol }
    });
  } catch (err) {
    console.error('Login hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;