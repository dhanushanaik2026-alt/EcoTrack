import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);

router.get('/categories', async (_req,res) => {
  try { const r = await pool.query('SELECT id,name,description FROM waste_categories ORDER BY name'); res.json(r.rows); }
  catch { res.status(500).json({message:'Could not load categories.'}); }
});
router.post('/', async (req,res) => {
  try {
    const { category_id, quantity, pickup_address, pickup_date, notes } = req.body;
    if (!category_id || !quantity?.trim() || !pickup_address?.trim() || !pickup_date)
      return res.status(400).json({message:'Please complete all required fields.'});
    const date = new Date(`${pickup_date}T00:00:00`);
    const today = new Date(); today.setHours(0,0,0,0);
    if (Number.isNaN(date.getTime()) || date < today) return res.status(400).json({message:'Pickup date cannot be in the past.'});
    const cat = await pool.query('SELECT id FROM waste_categories WHERE id=$1',[category_id]);
    if (!cat.rowCount) return res.status(400).json({message:'Select a valid waste category.'});
    const r = await pool.query(
      `INSERT INTO pickup_requests(user_id,category_id,quantity,pickup_address,pickup_date,notes)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING id,status,pickup_date,quantity,pickup_address,notes,created_at`,
      [req.user.id,category_id,quantity.trim(),pickup_address.trim(),pickup_date,notes?.trim() || null]);
    res.status(201).json(r.rows[0]);
  } catch(err) { console.error(err); res.status(500).json({message:'Could not create pickup request.'}); }
});
router.get('/mine', async (req,res) => {
  try {
    const r = await pool.query(
      `SELECT p.*, c.name AS category_name FROM pickup_requests p
       JOIN waste_categories c ON c.id=p.category_id WHERE p.user_id=$1 ORDER BY p.created_at DESC`,[req.user.id]);
    res.json(r.rows);
  } catch { res.status(500).json({message:'Could not load your requests.'}); }
});
router.get('/admin/all', adminOnly, async (_req,res) => {
  try {
    const r = await pool.query(
      `SELECT p.*, c.name AS category_name, u.name AS user_name, u.email AS user_email
       FROM pickup_requests p JOIN waste_categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC`);
    res.json(r.rows);
  } catch { res.status(500).json({message:'Could not load requests.'}); }
});
router.patch('/admin/:id/status', adminOnly, async (req,res) => {
  const allowed = ['Pending','Approved','Rejected','Scheduled','Completed'];
  const { status } = req.body;
  if (!allowed.includes(status)) return res.status(400).json({message:'Invalid status.'});
  try {
    const r = await pool.query('UPDATE pickup_requests SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[status,req.params.id]);
    if (!r.rowCount) return res.status(404).json({message:'Request not found.'});
    res.json(r.rows[0]);
  } catch { res.status(500).json({message:'Could not update status.'}); }
});
router.get('/admin/stats', adminOnly, async (_req,res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status='Pending')::int AS pending,
      COUNT(*) FILTER (WHERE status='Approved')::int AS approved,
      COUNT(*) FILTER (WHERE status='Completed')::int AS completed,
      COUNT(*) FILTER (WHERE status='Rejected')::int AS rejected
      FROM pickup_requests`);
    res.json(r.rows[0]);
  } catch { res.status(500).json({message:'Could not load statistics.'}); }
});
export default router;
