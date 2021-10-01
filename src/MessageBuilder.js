const { MessageEmbed } = require("discord.js");

const messageBuilder = (title, fields) => {
    const message = new MessageEmbed()
        .setDescription(title)
        .setColor("ORANGE");
    fields.forEach(field => {
        message.addField(
            field.title,
            field.content,
            false,
        );
    })
    message.setFooter(
        'Bots altes besta para pessoas altes besta.'
    );
    return message;
}

module.exports = messageBuilder;