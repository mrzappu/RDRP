require('dotenv').config();
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  Events,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates]
});
const TOKEN = process.env.TOKEN;
const PORT = 3000;

// ===== Slash Commands =====

// Kick
const kickCommand = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member from the server')
  .addUserOption(opt => opt.setName('target').setDescription('User to kick').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

// Ban
const banCommand = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member from the server')
  .addUserOption(opt => opt.setName('target').setDescription('User to ban').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

// Say
const sayCommand = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Make the bot say something')
  .addStringOption(opt => opt.setName('message').setDescription('Message to say').setRequired(true));

// Give Role
const giveRoleCommand = new SlashCommandBuilder()
  .setName('giverole')
  .setDescription('Give a role to a user')
  .addUserOption(opt => opt.setName('target').setDescription('User to give role').setRequired(true))
  .addRoleOption(opt => opt.setName('role').setDescription('Role to give').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Remove Role
const removeRoleCommand = new SlashCommandBuilder()
  .setName('removerole')
  .setDescription('Remove a role from a user')
  .addUserOption(opt => opt.setName('target').setDescription('User to remove role').setRequired(true))
  .addRoleOption(opt => opt.setName('role').setDescription('Role to remove').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Mute (timeout)
const muteCommand = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Timeout (mute) a user for 10 minutes')
  .addUserOption(opt => opt.setName('target').setDescription('User to mute').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

// Unmute
const unmuteCommand = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Remove timeout (unmute) from a user')
  .addUserOption(opt => opt.setName('target').setDescription('User to unmute').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

// Move
const moveCommand = new SlashCommandBuilder()
  .setName('move')
  .setDescription('Move a user to another voice channel')
  .addUserOption(opt => opt.setName('target').setDescription('User to move').setRequired(true))
  .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel to move to').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers);

// Lock channel
const lockCommand = new SlashCommandBuilder()
  .setName('lockchannel')
  .setDescription('Lock the current channel (prevent @everyone from sending messages)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

// Unlock channel
const unlockCommand = new SlashCommandBuilder()
  .setName('unlockchannel')
  .setDescription('Unlock the current channel (allow @everyone to send messages)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

// Help
const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all available bot commands');

// ===== Register Commands =====
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Set bot status
  client.user.setPresence({
    activities: [{ name: 'moderating the server 👀', type: 3 }], // Watching
    status: 'online'
  });

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, "YOUR_GUILD_ID"), // <-- replace with your server ID
      {
        body: [
          kickCommand.toJSON(),
          banCommand.toJSON(),
          sayCommand.toJSON(),
          giveRoleCommand.toJSON(),
          removeRoleCommand.toJSON(),
          muteCommand.toJSON(),
          unmuteCommand.toJSON(),
          moveCommand.toJSON(),
          lockCommand.toJSON(),
          unlockCommand.toJSON(),
          helpCommand.toJSON()
        ]
      }
    );
    console.log('📤 Commands registered (guild only)');
  } catch (err) {
    console.error('❌ Command registration failed:', err);
  }
});

// ===== Handle Commands =====
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  try {
    if (commandName === 'kick') {
      const user = interaction.options.getUser('target');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '⚠️ User not found.' });
      await member.kick();
      return interaction.reply(`✅ Kicked ${user.tag}`);
    }

    if (commandName === 'ban') {
      const user = interaction.options.getUser('target');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '⚠️ User not found.' });
      await member.ban();
      return interaction.reply(`✅ Banned ${user.tag}`);
    }

    if (commandName === 'say') {
      const message = interaction.options.getString('message');
      return interaction.reply({ content: message });
    }

    if (commandName === 'giverole') {
      const user = interaction.options.getUser('target');
      const role = interaction.options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '⚠️ User not found.' });
      await member.roles.add(role);
      return interaction.reply(`✅ Added role ${role.name} to ${user.tag}`);
    }

    if (commandName === 'removerole') {
      const user = interaction.options.getUser('target');
      const role = interaction.options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '⚠️ User not found.' });
      await member.roles.remove(role);
      return interaction.reply(`✅ Removed role ${role.name} from ${user.tag}`);
    }

    if (commandName === 'mute') {
      const user = interaction.options.getUser('target');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '⚠️ User not found.' });
      await member.timeout(10 * 60 * 1000); // 10 min
      return interaction.reply(`✅ Muted ${user.tag} for 10 minutes`);
    }

    if (commandName === 'unmute') {
      const user = interaction.options.getUser('target');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: '⚠️ User not found.' });
      await member.timeout(null);
      return interaction.reply(`✅ Unmuted ${user.tag}`);
    }

    if (commandName === 'move') {
      const user = interaction.options.getUser('target');
      const channel = interaction.options.getChannel('channel');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member || !member.voice.channel) return interaction.reply({ content: '⚠️ User not in a voice channel.' });
      await member.voice.setChannel(channel);
      return interaction.reply(`✅ Moved ${user.tag} to ${channel.name}`);
    }

    if (commandName === 'lockchannel') {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      return interaction.reply(`🔒 Channel locked.`);
    }

    if (commandName === 'unlockchannel') {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      return interaction.reply(`🔓 Channel unlocked.`);
    }

    if (commandName === 'help') {
      const helpEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🤖 Bot Help Menu")
        .setDescription("Here are all the available commands you can use:")
        .addFields(
          {
            name: "⚙️ Moderation",
            value: "/kick @user → Kick a member\n/ban @user → Ban a member\n/mute @user → Mute (10 min)\n/unmute @user → Unmute a member"
          },
          {
            name: "👥 Role Management",
            value: "/giverole @user @role → Give a role\n/removerole @user @role → Remove a role"
          },
          {
            name: "🎙 Voice",
            value: "/move @user #channel → Move a user to a voice channel"
          },
          {
            name: "🔒 Channels",
            value: "/lockchannel → Lock this channel\n/unlockchannel → Unlock this channel"
          },
          {
            name: "💬 Utility",
            value: "/say text → Bot repeats your text\n/help → Show this help menu"
          }
        )
        .setFooter({ text: "Made by Rick | Author" })
        .setTimestamp();

      return interaction.reply({ embeds: [helpEmbed] }); // 👈 public embed
    }
  } catch (err) {
    console.error(err);
    return interaction.reply({ content: `❌ Error: ${err.message}` });
  }
});

// ===== Keep Alive =====
express().get('/', (_, res) => res.send('Bot is online')).listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});

client.login(TOKEN);
