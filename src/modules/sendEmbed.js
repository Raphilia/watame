// Module to send standardized embed message
'use strict';

const { BOT_LOGO, BOT_URL } = require("../data/config.js");

const MessageEmbed = require('discord.js').MessageEmbed;

module.exports = {
	generate: (title) => generate(title),
	generateWithImage: (description, imageUrl) => generate(description).setImage(imageUrl),
};

function generate(title) {
	return new MessageEmbed()
		.setAuthor('Project Watame', BOT_LOGO, BOT_URL)
		.setTitle(title)
		.setColor('#F47FFF')
		.setFooter('With 🤍 by Shoukaku');
}