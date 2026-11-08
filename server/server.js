import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import { pool } from './config/db.js';
dotenv.config();
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 30 }), authRoutes);
app.use('/api/requests', requestRoutes);
app.get('/api/health', async (_req,res) => {
  try { await pool.query('SELECT 1'); res.json({status:'ok',database:'connected'}); }
  catch { res.status(503).json({status:'error',database:'disconnected'}); }
});
app.use((err,_req,res,_next) => { console.error(err); res.status(500).json({message:'Unexpected server error.'}); });
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`EcoTrack API running at http://localhost:${port}`));
