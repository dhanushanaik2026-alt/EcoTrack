import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
const router = Router();

function makeToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '2h' });
}
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [normalizedEmail]);
    if (exists.rowCount) return res.status(409).json({ message: 'An account with this email already exists.' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users(name,email,password_hash,phone) VALUES($1,$2,$3,$4) RETURNING id,name,email,phone,role',
      [name.trim(), normalizedEmail, hash, phone?.trim() || null]);
    const user = result.rows[0];
    res.status(201).json({ message: 'Account created successfully.', token: makeToken(user), user });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not create account.' }); }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Invalid email or password.' });
    const safeUser = { id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role };
    res.json({ message: 'Login successful.', token: makeToken(safeUser), user: safeUser });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not log in.' }); }
});
export default router;
