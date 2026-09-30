// Usage: npm run create-user -- <username> "<Full Name>" [rol]
// Creates a user with a bcrypt-hashed password. rol defaults to "admin".
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../src/config/database');

const [username, ad, rol = 'admin'] = process.argv.slice(2);

if (!username || !ad) {
  console.error('Usage: npm run create-user -- <username> "<Full Name>" [rol]');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Password: ', async (password) => {
  rl.close();
  try {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, ad, rol) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, hash, ad, rol]
    );
    console.log(`Created user "${username}" (id ${result.rows[0].id}, rol: ${rol})`);
  } catch (err) {
    console.error('Could not create user:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
});
