const { PREFIX, BOT_OWNER } = require('../data/config.js');

const Collection = require('discord.js').Collection;

const cooldowns = new Collection();

// List of autoresponses, part of easter egg
const responseObject = {
	// argument needs to be lowercase
	"watame wa": "warukunai yo nee",
};

module.exports = {
	async handle(client, message) {

		if (message.author.bot) return;

		// check for easter egg lines
		if (responseObject[message.content.toLowerCase()]) {
			message.channel.send(responseObject[message.content.toLowerCase()]);
		}

		// react and log when bot is mentioned
		if (message.mentions.has(client.user) && message.author.id !== client.user.id) {
			if (message.mentions.everyone) return;
			await message.react('🐑');
			// regex for bot mention, which is <@xxxxx>
			let mention = /<@(.*?)>/;
			// replace matched string with bot tag
			let content = message.content.replace(mention, client.user.tag);
			client.logger.log(`${message.author.tag} in ${message.guild.name}: ${content}`);
		}

		// cancel if message does not start with prefix or if author is a bot
		if (!message.content.startsWith(PREFIX)) return;
		// split message into array or args
		let args = message.content.slice(PREFIX.length).split(/ +/);
		// convert command to lowercase
		let commandName = args.shift().toLowerCase();
		// check if command or alias exist
		let command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
		if (!command) return;
		// check if command is guild only
		if (command.guildOnly && message.channel.type !== 'text') {
			return message.reply('you can only use that command inside servers.');
		}
		// check if command is dm only
		if (command.DMOnly && message.channel.type == 'text') {
			return message.reply('I can\'t execute that command outside DM.');
		}
		// check if command is owner only
		if (command.ownerOnly && message.author.id !== BOT_OWNER) {
			return message.reply('this command is for my owner only.');
		}
		// check if command is staff only
		if (command.staffOnly && !message.member.hasPermission("MANAGE_MESSAGES")) {
			return message.reply('you don\'t have permission to do that.');
		}
		// check if command require arguments
		if (command.args && !args.length) {
			let reply = `You didn't provide any argument, ${message.author}.`;
			if (command.usage) {
				reply += `\nThe proper usage would be: \`${PREFIX}${command.name} ${command.usage}\``;
			}
			return message.channel.send(reply);
		}

		// check for cooldowns
		if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());
		let now = Date.now();
		let timestamps = cooldowns.get(command.name);
		// in miliseconds
		let cooldownAmount = (command.cooldown || 3) * 1000;
		// check if command is coming from the same author
		if (timestamps.has(message.author.id)) {
			let expirationTime = timestamps.get(message.author.id) + cooldownAmount;
			if (now < expirationTime) {
				let timeLeft = (expirationTime - now) / 1000;
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}
		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		// execute command
		try {
			command.execute(client, message, args);
		} catch (error) {
			client.logger.error(error);
			message.reply('there was an error trying to execute that command!');
		}
	},
};