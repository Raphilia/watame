const { canModifyQueue } = require("../../modules/Utils");

module.exports = {
	name: "skipto",
	aliases: ["st"],
	description: "Skip to the selected queue number",
	execute(client, message, args) {
		if (!args.length)
			return message
				.reply(`Usage: ${message.client.prefix}${module.exports.name} <Queue Number>`);

		if (isNaN(args[0]))
			return message
				.reply(`Usage: ${message.client.prefix}${module.exports.name} <Queue Number>`);

		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return message.channel.send("There is no queue.");
		if (!canModifyQueue(message.member)) return;

		if (args[0] > queue.songs.length)
			return message.reply(`The queue is only ${queue.songs.length} songs long!`);

		queue.playing = true;
		if (queue.loop) {
			for (let i = 0; i < args[0] - 2; i++) {
				queue.songs.push(queue.songs.shift());
			}
		} else {
			queue.songs = queue.songs.slice(args[0] - 2);
		}
		queue.connection.dispatcher.end();
		queue.textChannel.send(`${message.author} ⏭ skipped ${args[0] - 1} songs`);
	}
};