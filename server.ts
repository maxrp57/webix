import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to persist tracking data across reloads
const DATA_FILE = path.join(process.cwd(), '.bot_tracking.json');

interface TrackingData {
  currentChannelId: string;
  currentMessageId: string;
  currentStatus: '🟢' | '🔴' | '🟡' | '';
  lastUpdated: string | null;
  history: Array<{
    id: string;
    status: '🟢' | '🔴' | '🟡';
    timestamp: string;
    messageId: string;
    channelId: string;
    action: 'send' | 'edit';
  }>;
}

let trackingState: TrackingData = {
  currentChannelId: process.env.DISCORD_CHANNEL_ID || '',
  currentMessageId: '',
  currentStatus: '',
  lastUpdated: null,
  history: [],
};

// Load existing state if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    trackingState = {
      ...trackingState,
      ...parsed,
      currentChannelId: parsed.currentChannelId || process.env.DISCORD_CHANNEL_ID || '',
    };
  }
} catch (e) {
  console.warn('Could not read .bot_tracking.json, using defaults', e);
}

function saveTrackingState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(trackingState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save tracking state', e);
  }
}

function getDiscordToken(): string {
  return process.env.DISCORD_BOT_TOKEN?.trim() || '';
}

// Helper to format friendly Discord error messages
function formatDiscordError(errData: any, status: number): string {
  if (!errData) return `Erreur Discord (${status})`;
  const code = errData.code;
  const message = errData.message || '';

  if (code === 50001 || message === 'Missing Access') {
    return 'Accès refusé (Missing Access - code 50001) : Le bot Discord n\'est pas membre du serveur contenant ce salon, ou n\'a pas la permission "Voir le salon". Invitez le bot sur le serveur !';
  }
  if (code === 50013 || message === 'Missing Permissions') {
    return 'Permissions insuffisantes (code 50013) : Le bot a besoin des permissions "Envoyer des messages" et "Intégrer des liens" dans ce salon.';
  }
  if (code === 10003 || message === 'Unknown Channel') {
    return 'Salon introuvable (code 10003) : Vérifiez que l\'identifiant du salon est correct (17 à 20 chiffres) et que le bot est sur le serveur.';
  }
  if (code === 10008 || message === 'Unknown Message') {
    return 'Message introuvable (code 10008) : Le message a probablement été supprimé sur Discord. Cliquez sur "Forcer un nouveau message".';
  }
  if (code === 40001 || status === 401) {
    return 'Token Discord invalide ou révoqué. Veuillez vérifier votre DISCORD_BOT_TOKEN.';
  }

  return message ? `${message} (code ${code || status})` : `Erreur Discord (${status})`;
}

// Discord API helper
async function callDiscordApi(endpoint: string, options: RequestInit = {}) {
  const token = getDiscordToken();
  if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
    const err: any = new Error('MISSING_TOKEN');
    err.status = 401;
    err.code = 'MISSING_TOKEN';
    throw err;
  }

  const cleanToken = token.startsWith('Bot ') ? token : `Bot ${token}`;

  let res: Response;
  try {
    res = await fetch(`https://discord.com/api/v10${endpoint}`, {
      ...options,
      headers: {
        Authorization: cleanToken,
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordStatusController (https://ai.studio, 1.0.0)',
        ...(options.headers || {}),
      },
    });
  } catch (networkErr: any) {
    const err: any = new Error(`Impossible de contacter l'API Discord : ${networkErr.message || 'Erreur réseau'}`);
    err.status = 503;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => '');
    data = { message: text || res.statusText };
  }

  if (!res.ok) {
    const friendlyMessage = formatDiscordError(data, res.status);
    const err: any = new Error(friendlyMessage);
    err.status = res.status;
    err.code = data?.code;
    err.details = data;
    throw err;
  }

  return data;
}

// 1. Check Bot Status and Authentication
app.get('/api/bot/status', async (req, res) => {
  const token = getDiscordToken();
  if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
    return res.json({
      configured: false,
      valid: false,
      message: 'Token DISCORD_BOT_TOKEN non configuré',
      channelId: trackingState.currentChannelId || process.env.DISCORD_CHANNEL_ID || '',
    });
  }

  try {
    const botUser = await callDiscordApi('/users/@me');
    // Generate OAuth2 bot invite URL with Send Messages and Embed Links permissions
    // Permissions integer 2048 (Send Messages) + 16384 (Embed Links) + 65536 (Read Message History) + 1024 (View Channel) = 84992
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botUser.id}&permissions=84992&scope=bot%20applications.commands`;

    return res.json({
      configured: true,
      valid: true,
      bot: {
        id: botUser.id,
        username: botUser.username,
        discriminator: botUser.discriminator,
        global_name: botUser.global_name,
        avatar: botUser.avatar
          ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png?size=128`
          : null,
        inviteUrl,
      },
      channelId: trackingState.currentChannelId || process.env.DISCORD_CHANNEL_ID || '',
      defaultEnvChannelId: process.env.DISCORD_CHANNEL_ID || '',
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      valid: false,
      error: err.message || 'Token invalide ou non autorisé',
      status: err.status || 401,
      channelId: trackingState.currentChannelId || '',
    });
  }
});

// 2. Fetch Bot Guilds (Servers)
app.get('/api/bot/guilds', async (req, res) => {
  try {
    const guilds = await callDiscordApi('/users/@me/guilds');
    return res.json({ guilds });
  } catch (err: any) {
    return res.status(err.status || 500).json({
      error: err.message || 'Impossible de récupérer les serveurs du bot',
    });
  }
});

// 3. Fetch Channels for a Guild
app.get('/api/bot/channels/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const channels = await callDiscordApi(`/guilds/${guildId}/channels`);
    // Filter for text (0) and announcement (5) channels
    const textChannels = Array.isArray(channels)
      ? channels
          .filter((c: any) => c.type === 0 || c.type === 5)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            position: c.position,
            parentId: c.parent_id,
          }))
          .sort((a, b) => (a.position || 0) - (b.position || 0))
      : [];

    return res.json({ channels: textChannels });
  } catch (err: any) {
    return res.status(err.status || 500).json({
      error: err.message || 'Impossible de récupérer les salons',
    });
  }
});

// 4. Validate and get single channel information
app.get('/api/bot/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!channelId || !/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({ error: 'ID de salon invalide (doit contenir 17 à 20 chiffres)' });
    }
    const channel = await callDiscordApi(`/channels/${channelId}`);
    return res.json({
      channel: {
        id: channel.id,
        name: channel.name,
        guildId: channel.guild_id,
        type: channel.type,
      },
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({
      error: err.message || 'Salon introuvable ou bot non invité dans ce salon',
    });
  }
});

// 5. Get current tracking state
app.get('/api/status/current', (req, res) => {
  return res.json(trackingState);
});

// Helper to build Discord message payload
function buildMessagePayload(status: '🟢' | '🔴' | '🟡', useEmbed = true) {
  const content = `Etat du flux : ${status}`;

  if (!useEmbed) {
    return { content };
  }

  // Color mapping: Green (0x22c55e), Red (0xef4444), Yellow (0xeab308)
  const colors: Record<string, number> = {
    '🟢': 0x22c55e,
    '🔴': 0xef4444,
    '🟡': 0xeab308,
  };

  const titles: Record<string, string> = {
    '🟢': 'Flux en direct (En Ligne)',
    '🔴': 'Flux arrêté (Hors Ligne)',
    '🟡': 'Flux en attente / pause',
  };

  const descriptions: Record<string, string> = {
    '🟢': 'Le flux est actuellement actif et opérationnel.',
    '🔴': 'Le flux est actuellement coupé ou terminé.',
    '🟡': 'Le flux est momentanément en pause ou va bientôt démarrer.',
  };

  return {
    content, // Exact message requested
    embeds: [
      {
        title: titles[status] || `Etat du flux : ${status}`,
        description: descriptions[status] || '',
        color: colors[status] || 0x5865f2,
        fields: [
          {
            name: 'Statut Actuel',
            value: `**Etat du flux : ${status}**`,
            inline: true,
          },
          {
            name: 'Dernière mise à jour',
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true,
          },
        ],
        footer: {
          text: 'Contrôleur de Flux Discord',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// 6. Send a brand new message in the chosen channel
app.post('/api/status/send', async (req, res) => {
  try {
    const { channelId, status, useEmbed = true } = req.body;

    if (!channelId || !/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({ error: 'Identifiant de salon (Channel ID) invalide' });
    }

    if (!['🟢', '🔴', '🟡'].includes(status)) {
      return res.status(400).json({ error: 'Le statut doit être 🟢, 🔴 ou 🟡' });
    }

    const payload = buildMessagePayload(status, useEmbed);

    const createdMsg = await callDiscordApi(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const now = new Date().toISOString();
    trackingState.currentChannelId = channelId;
    trackingState.currentMessageId = createdMsg.id;
    trackingState.currentStatus = status;
    trackingState.lastUpdated = now;
    trackingState.history.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status,
      timestamp: now,
      messageId: createdMsg.id,
      channelId,
      action: 'send',
    });

    if (trackingState.history.length > 20) {
      trackingState.history = trackingState.history.slice(0, 20);
    }

    saveTrackingState();

    return res.json({
      success: true,
      action: 'send',
      messageId: createdMsg.id,
      channelId,
      status,
      content: payload.content,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('Error sending message:', err);
    return res.status(err.status || 500).json({
      error: err.message || "Erreur lors de l'envoi du message sur Discord",
      details: err.details,
    });
  }
});

// 7. Edit the existing message
app.patch('/api/status/edit', async (req, res) => {
  try {
    const { channelId, messageId, status, useEmbed = true } = req.body;

    const targetChannelId = channelId || trackingState.currentChannelId;
    const targetMessageId = messageId || trackingState.currentMessageId;

    if (!targetChannelId) {
      return res.status(400).json({ error: 'Aucun salon spécifié' });
    }
    if (!targetMessageId) {
      return res.status(400).json({
        error: "Aucun message existant à modifier. Cliquez d'abord sur 'Envoyer un nouveau message'.",
      });
    }

    if (!['🟢', '🔴', '🟡'].includes(status)) {
      return res.status(400).json({ error: 'Le statut doit être 🟢, 🔴 ou 🟡' });
    }

    const payload = buildMessagePayload(status, useEmbed);

    const updatedMsg = await callDiscordApi(
      `/channels/${targetChannelId}/messages/${targetMessageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );

    const now = new Date().toISOString();
    trackingState.currentChannelId = targetChannelId;
    trackingState.currentMessageId = targetMessageId;
    trackingState.currentStatus = status;
    trackingState.lastUpdated = now;
    trackingState.history.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status,
      timestamp: now,
      messageId: targetMessageId,
      channelId: targetChannelId,
      action: 'edit',
    });

    if (trackingState.history.length > 20) {
      trackingState.history = trackingState.history.slice(0, 20);
    }

    saveTrackingState();

    return res.json({
      success: true,
      action: 'edit',
      messageId: targetMessageId,
      channelId: targetChannelId,
      status,
      content: payload.content,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('Error editing message:', err);
    return res.status(err.status || 500).json({
      error: err.message || 'Erreur lors de la modification du message sur Discord',
      details: err.details,
    });
  }
});

// 8. Set custom tracking target (e.g. user already has an existing message ID)
app.post('/api/status/target', (req, res) => {
  const { channelId, messageId } = req.body;
  if (channelId) trackingState.currentChannelId = channelId;
  if (messageId) trackingState.currentMessageId = messageId;
  saveTrackingState();
  return res.json({ success: true, trackingState });
});

// Explicit 404 handler for any unmatched /api/* routes so they never return HTML
app.all('/api/*', (req, res) => {
  return res.status(404).json({ error: `Route API introuvable : ${req.method} ${req.path}` });
});

// Start server function with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
