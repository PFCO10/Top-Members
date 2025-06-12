const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();

const GUILD_ID = process.env.GUILD_ID;  // Asegúrate de tener esta variable en tus secrets o entorno
const messageCounts = {};

// Contador de mensajes
client.on('messageCreate', message => {
  if (message.guild?.id !== GUILD_ID) return;
  if (message.author.bot) return;

  const userId = message.author.id;
  messageCounts[userId] = (messageCounts[userId] || 0) + 1;

  console.log(`[MSG] ${message.author.tag}: ${messageCounts[userId]} mensajes`);
});

// Función que genera el ranking top 5
async function obtenerTop5() {
  const guild = await client.guilds.fetch(GUILD_ID);
  const ranking = Object.entries(messageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const top5 = await Promise.all(
    ranking.map(async ([userId, count], i) => {
      const member = await guild.members.fetch(userId).catch(() => null);
      return member
        ? {
            username: member.user.tag,
            count,
            rank: i + 1
          }
        : null;
    })
  );

  return top5.filter(Boolean);
}

// Ruta principal que muestra la página
app.get('/', async (req, res) => {
  const top5 = await obtenerTop5();
  console.log('Top 5 en /:', top5);

  let html = `
    <html>
      <head>
        <title>Top Miembros Activos</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; }
          h1 { text-align: center; }
          ul { list-style-type: none; padding: 0; }
          li { padding: 8px; border-bottom: 1px solid #ddd; }
          .top1 { font-weight: bold; color: gold; }
          .top2 { font-weight: bold; color: silver; }
          .top3 { font-weight: bold; color: #cd7f32; }
        </style>
      </head>
      <body>
        <h1>Top 5 Miembros Más Activos</h1>
        <ul>
  `;

  if (top5.length === 0) {
    html += `<li>No hay datos aún. ¡Empieza a hablar en el servidor!</li>`;
  } else {
    top5.forEach(user => {
      const className = user.rank === 1 ? 'top1' : user.rank === 2 ? 'top2' : user.rank === 3 ? 'top3' : '';
      html += `<li class="${className}">#${user.rank} - ${user.username} - ${user.count} mensajes</li>`;
    });
  }

  html += `
        </ul>
        <p style="text-align:center;"><a href="/refresh">🔄 Actualizar Top</a></p>
      </body>
    </html>
  `;

  res.send(html);
});

// Ruta para forzar un refresh manual
app.get('/refresh', (req, res) => {
  // Solo redirige para que la página recargue datos
  res.redirect('/');
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// PON TU TOKEN AQUÍ para que el bot funcione
client.login('MTM4MjMyMTQzNTM3MjE1OTA1Ng.GlKRkl.bAZDg4qQwsZcS4yn6ljSiuHJSDQ28uUP3y9xqg');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌐 Servidor web escuchando en puerto ${port}`);
});
