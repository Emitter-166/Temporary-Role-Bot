import {
    EmbedBuilder
} from "@discordjs/builders";
import {
    Client,
    GuildMember,
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
        if (!msg.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        if (!msg.content.startsWith('!')) return;

        const args = msg.content.split(" ");

        const command = args[0];

        switch (command) {
            case "!add-temp-role":
                if (args.length !== 4) {
                    wrongUsage('Usage: !add-temp-role userId roleId hours', msg);
                    return;
                }

                const userId = args[1].replace(/[<@>]/g, "");
                const roleId = args[2].replace(/[<@&>]/g, "");

                let time = Number(args[3]);

                if (Number.isNaN(time)) {
                    wrongUsage('time must be a number', msg);
                    return;
                }

                time *= ONE_UNIT;

                const [model, created] = await sequelize.model('users').findOrCreate({
                    where: {
                        userId: msg.author.id,
                        roleId: roleId,
                        givenAt: Date.now(),
                        duration: time
                    }
                })

                if (created) {

                    if (await giveRole(userId, roleId, client)) {
                        success(msg);
                    } else {
                        wrongUsage('Unable to give role', msg);
                        await model.destroy();
                    }

                } else {
                    model.update({
                        duratiton: model.get("duration") as number + time
                    })
                    success(msg)
                }
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

export const giveRole = async (userId: string, roleId: string, client: Client): Promise < boolean > => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        await member.roles.add(roleId);
        return true;
    } catch (err) {
        return false;
    }

}

export const removeRole = async (userId: string, roleId: string, client: Client) => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        await member.roles.remove(roleId);
    } catch (err) {
        console.log(err);
    }

}