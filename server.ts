import 'dotenv/config';
import express, { Request, Response } from 'express';
import { MongoClient, Collection } from 'mongodb';
import path from 'path';
import fs from 'fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Document Database with JSON Disk Persistence (MongoDB-style Collection Store)
interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // stored simulation hash
  callsign: string;
  createdAt: number;
  lastLogin: number;
  stats: {
    totalMatches: number;
    totalKills: number;
    highestWave: number;
    highestScore: number;
    totalPlayTime: number;
    victories: number;
  };
  unlockedCharacters: string[];
  credits: number;
}

interface DBState {
  users: Record<string, UserRecord>;
  players: Record<string, any>;
  leaderboard: Array<{ id: string; name: string; title: string; score: number; kills: number; wave: number; character: string; avatar: string }>;
  news: Array<{ id: string; title: string; category: string; impact: string; affectedAsset: string; timestamp: number }>;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'game_db.json');
let mongoState: Collection<any> | null = null;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultLeaderboard = [
  { id: 'titan-1', name: 'CyberViper', title: 'Apex Survivor', score: 48500, kills: 642, wave: 15, character: 'Storm Commando', avatar: '⚡' },
  { id: 'titan-2', name: 'ShadowGhost', title: 'Blade Master', score: 39200, kills: 518, wave: 12, character: 'Cyber Ninja', avatar: '🗡️' },
  { id: 'titan-3', name: 'IronTitan', title: 'Fortress', score: 34100, kills: 470, wave: 11, character: 'Heavy Juggernaut', avatar: '🛡️' },
  { id: 'titan-4', name: 'NovaQueen', title: 'Vortex Witch', score: 29800, kills: 412, wave: 9, character: 'Void Sorceress', avatar: '🔮' },
  { id: 'titan-5', name: 'NeonRacer', title: 'Overdrive', score: 24500, kills: 350, wave: 8, character: 'Storm Commando', avatar: '🏎️' },
  { id: 'titan-6', name: 'GlitchHunter', title: 'Executioner', score: 19400, kills: 280, wave: 7, character: 'Cyber Ninja', avatar: '💀' },
];

let db: DBState = {
  users: {},
  players: {},
  leaderboard: defaultLeaderboard,
  news: [],
};

// Load saved data if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = { ...db, ...parsed };
    if (!db.users) db.users = {};
    if (!db.leaderboard || db.leaderboard.length === 0) {
      db.leaderboard = defaultLeaderboard;
    }
  } catch (err) {
    console.error('Error loading DB file:', err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
  if (mongoState) {
    void mongoState.replaceOne({ _id: 'primary' }, { _id: 'primary', ...db }, { upsert: true })
      .catch((err) => console.warn('MongoDB save failed; local JSON remains available:', err.message));
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expectedHex] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHex) {
    // Keep accounts from the source project's local JSON store usable.
    return stored === Buffer.from(password).toString('base64');
  }
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function startServer() {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (mongoUri) {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2500 });
    try {
      await client.connect();
      mongoState = client.db(process.env.MONGODB_DB || 'bloodmoon_sylas').collection('game_state');
      const saved = await mongoState.findOne({ _id: 'primary' });
      if (saved) {
        const { _id: _ignored, ...state } = saved;
        db = { ...db, ...state } as DBState;
      } else {
        await mongoState.insertOne({ _id: 'primary', ...db });
      }
      console.log('MongoDB connected; persistent game profiles and progress are enabled.');
    } catch (err) {
      await client.close().catch(() => undefined);
      mongoState = null;
      console.warn('MongoDB unavailable; using local JSON save mode:', err instanceof Error ? err.message : err);
    }
  } else {
    console.log('MONGODB_URI is not set; using local JSON save mode.');
  }
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes (RESTful MEAN architecture)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now(), service: 'Bloodmoon: Sylas', database: mongoState ? 'mongodb' : 'local-json' });
  });

  // --- USER AUTHENTICATION & PROFILE APIS (REST/MEAN) ---
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { username, email, password, callsign } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = Object.values(db.users).find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username or email already registered in arena records.' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: UserRecord = {
      id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      callsign: callsign && callsign.trim() ? callsign.trim() : username.trim(),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      stats: {
        totalMatches: 0,
        totalKills: 0,
        highestWave: 1,
        highestScore: 0,
        totalPlayTime: 0,
        victories: 0,
      },
      unlockedCharacters: ['commando', 'ninja', 'juggernaut', 'sorceress'],
      credits: 250,
    };

    db.users[userId] = newUser;
    saveDb();

    // Return sanitized user object
    const { passwordHash: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser, token: `tok_${userId}` });
  });

  // Guest Instant Session (No Registration Required)
  app.post('/api/auth/guest', (_req: Request, res: Response) => {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestId = `guest_${Date.now()}_${guestNum}`;
    const guestUser: UserRecord = {
      id: guestId,
      username: `GuestOperative_${guestNum}`,
      email: `guest_${guestNum}@arena.local`,
      passwordHash: '',
      callsign: `GUEST-${guestNum}`,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      stats: {
        totalMatches: 0,
        totalKills: 0,
        highestWave: 1,
        highestScore: 0,
        totalPlayTime: 0,
        victories: 0,
      },
      unlockedCharacters: ['commando', 'ninja', 'juggernaut', 'sorceress'],
      credits: 100,
    };

    db.users[guestId] = guestUser;
    saveDb();

    const { passwordHash: _, ...safeUser } = guestUser;
    res.json({ success: true, user: { ...safeUser, isGuest: true }, token: `tok_${guestId}` });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const clean = username.trim().toLowerCase();
    const user = Object.values(db.users).find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Operative profile not found. Register first.' });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Incorrect combat access passkey.' });
    }

    user.lastLogin = Date.now();
    saveDb();

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: `tok_${user.id}` });
  });

  app.get('/api/auth/me/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Update profile or record match completion
  app.post('/api/auth/stats/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { score, kills, wave, timeSurvived, isVictory, character } = req.body;
    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.stats.totalMatches += 1;
    user.stats.totalKills += kills || 0;
    user.stats.totalPlayTime += timeSurvived || 0;
    if (isVictory) user.stats.victories += 1;
    if ((wave || 1) > user.stats.highestWave) user.stats.highestWave = wave;
    if ((score || 0) > user.stats.highestScore) user.stats.highestScore = score;
    user.credits += Math.floor((score || 0) / 100) + (kills || 0) * 2;

    // Leaderboard upsert
    const existingIdx = db.leaderboard.findIndex((t) => t.id === userId);
    const entry = {
      id: userId,
      name: user.callsign || user.username,
      title: isVictory ? 'Apex Champion' : 'Arena Veteran',
      score: user.stats.highestScore,
      kills: user.stats.totalKills,
      wave: user.stats.highestWave,
      character: character || 'Storm Commando',
      avatar: isVictory ? '👑' : '⚡',
    };

    if (existingIdx >= 0) {
      if (entry.score > db.leaderboard[existingIdx].score) {
        db.leaderboard[existingIdx] = entry;
      }
    } else {
      db.leaderboard.push(entry);
    }
    db.leaderboard.sort((a, b) => b.score - a.score);

    saveDb();
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Complete Game Reset / Delete Account or History Endpoint
  app.delete('/api/auth/delete-data/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { deleteAccount } = req.query;

    if (deleteAccount === 'true') {
      delete db.users[userId];
      delete db.players[userId];
      db.leaderboard = db.leaderboard.filter((e) => e.id !== userId);
      saveDb();
      return res.json({ success: true, message: 'Operative account and all records permanently expunged.' });
    }

    // Reset game stats only
    if (db.users[userId]) {
      db.users[userId].stats = {
        totalMatches: 0,
        totalKills: 0,
        highestWave: 1,
        highestScore: 0,
        totalPlayTime: 0,
        victories: 0,
      };
      db.users[userId].credits = 100;
    }
    delete db.players[userId];
    db.leaderboard = db.leaderboard.filter((e) => e.id !== userId);
    saveDb();

    res.json({ success: true, message: 'Game progression and battle statistics reset to factory defaults.' });
  });

  // Fetch or sync player state
  app.get('/api/game/state/:playerId', (req: Request, res: Response) => {
    const { playerId } = req.params;
    const player = db.players[playerId] || null;
    res.json({ success: true, player });
  });

  app.post('/api/game/state/:playerId', (req: Request, res: Response) => {
    const { playerId } = req.params;
    const playerData = req.body;
    db.players[playerId] = {
      ...playerData,
      updatedAt: Date.now(),
    };

    // Update leaderboard if player has score
    if (playerData.score !== undefined) {
      const existingIdx = db.leaderboard.findIndex((t) => t.id === playerId);
      const entry = {
        id: playerId,
        name: playerData.name || 'Hero',
        title: playerData.title || 'Arena Fighter',
        score: playerData.score || 0,
        kills: playerData.kills || 0,
        wave: playerData.wave || 1,
        character: playerData.character || 'Commando',
        avatar: playerData.avatar || '⚡',
      };
      if (existingIdx >= 0) {
        if (entry.score > db.leaderboard[existingIdx].score) {
          db.leaderboard[existingIdx] = entry;
        }
      } else {
        db.leaderboard.push(entry);
      }
      db.leaderboard.sort((a, b) => b.score - a.score);
    }

    saveDb();
    res.json({ success: true, savedAt: Date.now() });
  });

  // Leaderboard endpoint
  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    res.json({
      success: true,
      titans: db.leaderboard.slice(0, 15),
    });
  });

  // News ticker endpoint
  app.get('/api/news', (_req: Request, res: Response) => {
    res.json({ success: true, news: db.news });
  });

  app.post('/api/news/generate', (req: Request, res: Response) => {
    const { title, category, impact, affectedAsset } = req.body;
    const newArticle = {
      id: `n-${Date.now()}`,
      title,
      category: category || 'Market Intelligence',
      impact: impact || '+0.0%',
      affectedAsset: affectedAsset || 'ALL',
      timestamp: Date.now(),
    };
    db.news.unshift(newArticle);
    if (db.news.length > 20) db.news.pop();
    saveDb();
    res.json({ success: true, article: newArticle });
  });

  // Setup Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bloodmoon: Sylas] running on http://localhost:${PORT}`);
  });
}

startServer();
