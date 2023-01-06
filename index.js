import whatsappweb from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import * as dotenv from "dotenv";
import bot from "nlp-chatbot";
dotenv.config();
const { Client, RemoteAuth } = whatsappweb;
// Require database
import {MongoStore} from 'wwebjs-mongo';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI).then(() => {
  const store = new MongoStore({ mongoose: mongoose });
  const client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000
    })
  });

  client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('Client is ready!');
  });

  client.on('message', message => {
    (async ()=>{
      try {
        await handleMessage(message,client);
      } catch (error) {
        console.log(error);
      }
    }
    )()
  });

  client.initialize();
});

async function handleMessage(message,client) {
  console.log(
    `From: ${message._data.id.remote} (${message._data.notifyName})`
  );
  console.log(`Message: ${message.body}`);
  // If added to a chatgroup, only respond if tagged
  const chat = await message.getChat();
  if (chat.isGroup && !message.mentionedIds.includes(client.info.wid._serialized)) {
    return;
  }

  if (message.type !== "chat") {
    return;
  }

  let msg = message.body;
  msg = msg.replace(/@\d+\b/g,"");
  const response = await bot.chat(msg);
  message.reply(response.text);
}
