const ms = require("ms");

const muteModel = require('../../data/models/Mute.js');

const EmbedGenerator = require('../../modules/sendEmbed');

module.exports = {
	name: 'mute',
	description: 'Temporarily mute a user.',
	usage: '<user> <time: 10s/10m/1h>',
	guildOnly: true,
	staffOnly: true,
	args: true,
	async execute(client, message, args) {

		let tomute = await message.guild.member(message.mentions.members.first()
			|| message.guild.members.cache.get(args[0]));

		if (!tomute) return message.reply('No user was found.');

		if (tomute.hasPermission("MANAGE_MESSAGES")) return message.reply('that user is a staff!');

		let muterole = message.guild.roles.cache.find(role => role.name === "Muted");
		if (!muterole) {
			try {
				muterole = await message.guild.roles.create({
					data: {
						name: 'Muted',
						permissions: []
					},
					reason: 'Mute role creation'
				});
				client.logger.log(`Created "${muterole.name}" role in ${message.guild.name} server`);
				message.guild.channels.cache.forEach(async (channel) => {
					await channel.updateOverwrite(muterole, {
						SEND_MESSAGES: false,
						ADD_REACTION: false,
					});
				});
				client.logger.log(`Updated all channel overrides for the role.`);
			} catch (error) {
				client.logger.error(`Error creating Mute role: ${error.stack}`);
				return message.reply('there was an error trying to create mute role for this server.');
			}
		}
		if (tomute.roles.cache.some(role => role.name === 'Muted')) return message.reply('that person is already muted.');

		let mutetime = args[1];
		if (!mutetime) return message.reply('you didn\'t specify mute time.');
		if (ms(mutetime) >= ms('3h')) mutetime = '3h';

		try {
			await message.delete();
			await (tomute.roles.add(muterole.id));
			message.channel.send(EmbedGenerator.generate('')
				.setDescription(`${tomute} has been muted by ${message.author}`)
				.addField('Duration:', `${ms(ms(mutetime), { long: true })}`));

			setTimeout(async () => {
				tomute.roles.remove(muterole.id);
				message.channel.send(`${tomute} has been unmuted.`);

				let rowCount = await muteModel.destroy({ where: { uid: tomute.id, serverid: message.guild.id } });
				if (!rowCount) return client.logger.log('that tag did not exist.');
				else return client.logger.log('Tag entry successfully deleted.');

			}, ms(mutetime));

			await muteModel.create({
				uid: tomute.id,
				serverid: message.guild.id,
				mutestart: message.createdTimestamp,
				mutefinish: message.createdTimestamp + ms(mutetime),
			});

			client.logger.log(`Mute tag added for ${tomute.user.tag}.`);

		} catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return message.reply('That tag already exists.');
			}
			client.logger.error(e.stack);
			message.reply('there was an error trying to mute that user.');
		}
	},
};