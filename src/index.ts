import { Client, IntentsBitField} from 'discord.js';
import * as path from 'path';
import { BOOLEAN, CHAR, INTEGER, Sequelize } from 'sequelize';
import {giveRole, listen, removeRole} from './command_handler';
import * as fs from "fs";

require('dotenv').config({
    path: path.join(__dirname, ".env")
})

export const GUILD_ID = "859736561830592522";
export const ONE_UNIT = 3_600_000;

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'roles.db',
    logging: false
})

sequelize.define('users', {
    userId: {
        type: CHAR(30),
        allowNull: false
    },
    roleId: {
        type: CHAR(30),
        allowNull: false
    },
    givenAt: {
        type: INTEGER,
        allowNull: false
    },
    duration: {
        type: INTEGER,
        allowNull: false
    }

}, {
    indexes: [
        {fields: ['userId'], unique: true}
    ],
    timestamps: false
})



sequelize.sync({alter: true}).then(sequelize => {
    client.login(process.env._TOKEN);
})


const F = IntentsBitField.Flags;
const client = new Client({
    intents: [F.Guilds, F.GuildMessages, F.GuildMembers, F.MessageContent]
})


client.once('ready', async (client) => {
    console.log("ready");
    listen(client, sequelize);
    setInterval(scan, 60_000, client, sequelize);

    //test
//     const STAFFS = ["1041351113594646648", "965922532609888302", "1028735048473645148", "884056387380989962", "914430907975344189", "932797794576633856", "989322114735693858"]
//     const guild = await client.guilds.fetch("859736561830592522");
//    let members = await guild.members.fetch({});

//    members = members.filter( m  =>{
//        if(m.roles.cache.some(role => STAFFS.some(staff => staff === role.id))) return true;
//    })
//     let text = "";
//     members.forEach(m => {
//         text += `user: ${m.user.username}#${m.user.discriminator} mention: <@${m.id}> \n`
//     })

//     fs.writeFileSync("staffs.txt", text);
})

const scan = async (client: Client, sequelize: Sequelize): Promise<boolean> => {
    try{
        const usersModel = sequelize.model('users');

        let users = await usersModel.findAll()
        
        users.forEach(user => {
            console.log(`now: ${Date.now()} total: ${user.get('givenAt') as number + (user.get('duration') as number)}`);
            console.log((user.get("givenAt") as number + (user.get('duration') as number) <= Date.now()));
            
        })
        users = users.filter(user => (user.get("givenAt") as number + (user.get('duration') as number) <= Date.now()));
    
        for(let user of users){
            await removeRole(user.get("userId") as string, user.get('roleId') as string, client);
            await user.destroy()
        }
        
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}









