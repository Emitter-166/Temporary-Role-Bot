import {
    EmbedBuilder
} from "@discordjs/builders";
import {
    Client,
    Message,
    PermissionsBitField
} from "discord.js";
import {
    Sequelize
} from "sequelize";
import {
    GUILD_ID,
    ONE_UNIT
} from ".";

export const listen = (client: Client, sequelize: Sequelize) => {

    client.on('messageCreate', async (msg) => {
        if (!msg.member ?.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        if (!msg.content.startsWith('!')) return;

        const args = msg.content.split(" ");

        const command = args[0];

        switch (command) {
            case "!add-temp-role":
                if (!(args.length >= 4)) {
                    wrongUsage('Usage: !add-temp-role roleId hours userIds', msg);
                    return;
                }

                let userIds = [];

                for (let i = 0; i < args.length; i++) {
                    if (i > 2) {
                        userIds.push(args[i].replace(/[<@>]/g, ""))
                    }
                }

                const roleId = args[1].replace(/[<@&>]/g, "");

                let time = Number(args[2]);

                if (Number.isNaN(time)) {
                    wrongUsage('time must be a number', msg);
                    return;
                }

                time *= ONE_UNIT;

                for (let userId of userIds) {

                    const [model, created] = await sequelize.model('users').findOrCreate({
                        where: {
                            userId: userId,
                            roleId: roleId
                        },
                        defaults: {
                            duration: time,
                            givenAt: Date.now()
                        }
                    })

                    if (created) {
                        if (await giveRole(userId, roleId, client, Number(args[2]))) {} else {
                            wrongUsage(`Unable to give role to ${userId}`, msg);
                            await model.destroy();
                        }

                    } else {
                        const updated = await model.increment('duration', {
                            by: time
                        });
                    }
                }

                success(msg);
        }
    })
}

export const wrongUsage = async (issue: string, msg: Message) => {
    const embed = new EmbedBuilder()
        .setDescription("```markdown\n" + issue + "```");

    try {
        await msg.react('⛔');

        await msg.reply({
            embeds: [embed],
            allowedMentions: {
                repliedUser: false
            }
        });
    } catch (err) {
        console.log(err);
    }
}

export const success = async (msg: Message) => {
    try {
        msg.react('✅');
    } catch (err) {
        console.log(err);
    }
}

export const giveRole = async (userId: string, roleId: string, client: Client, time: number): Promise < boolean > => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        await member.roles.add(roleId);

        const role = await guild.roles.fetch(roleId);

        try {
            const dm = await member.user.createDM();
            const embed = new EmbedBuilder()
                .setDescription(`Yay! You now have the awesome **@${role?.name}** role for ${time} whole hours! 🎉🎊 Let's have some fun! 🥳`);

            if (role ?.color)
                embed.setColor(role ?.color);
            await dm.send({
                embeds: [embed]
            });

        } catch (err) {
            console.log("unable to dm member: " + `userId: ${userId} user: ${member.user.username}#${member.user.discriminator}`)
        }



        return true;

    } catch (err) {
        return false;
    }

}

export const removeRole = async (userId: string, roleId: string, client: Client): Promise < boolean > => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        await member.roles.remove(roleId);

        const role = await guild.roles.fetch(roleId);

        try {
            const dm = await member.user.createDM();
            const embed = new EmbedBuilder()
                .setDescription(`Oh no! Your **@${role?.name}** role is about to be taken away 😔🕒`);

            if (role ?.color)
                embed.setColor(role?.color);
            await dm.send({
                embeds: [embed]
            });

        } catch (err) {
            console.log("unable to dm member: " + `userId: ${userId} user: ${member.user.username}#${member.user.discriminator}`)
        }

        return true;
    } catch (err) {
        console.log(err);
        return false;
    }

}