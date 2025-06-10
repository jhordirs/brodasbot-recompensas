require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const db = require('./db.js');
const app = express();
const port = 3000;

// Configura Express
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicia cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Base de datos
db.initialize();

// Rutas
app.get('/api/guilds', async (req, res) => {
  const guilds = Array.from(client.guilds.cache.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL()
    }));
  res.json(guilds);
});

app.get('/api/guilds/:id/channels', async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).send('Servidor no encontrado');
  
  const channels = Array.from(guild.channels.cache.values())
    .filter(ch => [0, 2, 13].includes(ch.type)) // GUILD_TEXT, GUILD_VOICE, STAGE_CHANNEL
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type
    }));
  res.json(channels);
});

app.get('/api/guilds/:id/members', async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).send('Servidor no encontrado');
  
  await guild.members.fetch();
  const members = Array.from(guild.members.cache.values())
    .filter(m => m.id !== client.user.id) // Excluye el bot propio
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(member => ({
      id: member.id,
      name: member.displayName,
      avatar: member.user.displayAvatarURL({ size: 64 }),
      isBot: member.user.bot
    }));
  res.json(members);
});

app.get('/api/guilds/:id/roles', async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).send('Servidor no encontrado');
  
  await guild.roles.fetch();
  const roles = Array.from(guild.roles.cache.values())
    .filter(role => !role.managed && role.name !== '@everyone')
    .sort((a, b) => b.position - a.position)
    .map(role => ({
      id: role.id,
      name: role.name
    }));
  res.json(roles);
});

app.get('/api/guilds/:id/emojis', async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).send('Servidor no encontrado');
  
  await guild.emojis.fetch();
  const emojis = Array.from(guild.emojis.cache.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(emoji => ({
      id: emoji.id,
      name: emoji.name,
      animated: emoji.animated,
      url: emoji.url
    }));
  res.json(emojis);
});

app.get('/api/rewards/:guildId', async (req, res) => {
  const rewards = await db.getRewards(req.params.guildId);
  res.json(rewards);
});

app.post('/api/rewards/:guildId', async (req, res) => {
  const { guildId } = req.params;
  const { members, headerText, footerText } = req.body;
  await db.saveRewards(guildId, members, headerText, footerText);
  res.json({ success: true });
});

app.post('/api/send/:guildId', async (req, res) => {
  const { guildId } = req.params;
  const { channelId } = req.body;
  
  const rewards = await db.getRewards(guildId);
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(channelId);
  
  if (!channel) return res.status(404).send('Canal no encontrado');
  
  const embed = {
    title: "**SISTEMA DE RECOMPENSAS**", // Negrita en título
    color: 0x3498db,
    description: rewards.headerText || " ",
    fields: []
  };

  // Organizar miembros y roles en 3 columnas
  const chunkSize = 3;
  for (let i = 0; i < rewards.members.length; i += chunkSize) {
    const chunk = rewards.members.slice(i, i + chunkSize);
    let fieldValue = "";
    
    for (const item of chunk) {
      const points = item.points;
      const tokens = item.tokens;
      let pointDisplay = "";
      
      if (tokens >= 3) {
        pointDisplay = "🔵🔵🔵";
      } else {
        pointDisplay = "🟢".repeat(points) + "⭕".repeat(3 - points);
      }
      
      // Si es un rol, usamos mención de rol, de lo contrario mención de usuario
      const mention = item.type === 'role' ? `<@&${item.id}>` : `<@${item.id}>`;
      fieldValue += `${mention}\n${pointDisplay}\nTokens: ${tokens}/3\n\n`;
    }
    
    embed.fields.push({ name: "\u200B", value: fieldValue, inline: true });
  }

  // Agregar texto inferior como un field normal
  if (rewards.footerText) {
    embed.fields.push({
      name: "\u200B",
      value: rewards.footerText,
      inline: false
    });
  }

  await channel.send({ embeds: [embed] });
  res.json({ success: true });
});


// Inicia servidor
client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  app.listen(port, () => {
    console.log(`Dashboard en http://localhost:${port}`);
  });
});

client.login(process.env.DISCORD_TOKEN);