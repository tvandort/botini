import 'dotenv/config';
import {Client, Events, GatewayIntentBits} from 'discord.js';

// eslint-disable-next-line no-undef
if (!process.env.DISCORD_TOKEN) {
    console.log('Error: Specify DISCORD_TOKEN in .env');
    // eslint-disable-next-line no-undef
    process.exit(1);
}

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

let textChannels;
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    textChannels = client.channels.cache.filter(channel => {
        return channel.isTextBased() && channel.isSendable();
    }).map(channel => {
        return channel.id;
    });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (!textChannels.includes(message.channelId)) return;

    if (message.author.username.toLowerCase() === 'mercer') {
        message.react('🤌');
    }

    const regex = /\(\(([^\]]+)\)\)/g;
    if (!regex.test(message.content)) {
        return;
    }

    // TODO Get hardcoded list of pasta to narrow the scope of retrievable pages.
    // TODO rate limit
    // TODO User Agent and other wikipedia politeness
    const messageContentClean = message.content.substring(2, message.content.length - 2);
    const UriEncodedPasta = encodeURI(messageContentClean);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("User-Agent", "DiscordBot PastaBot Jonathan Forscher");
    const getDaPastaRequest = new Request("https://en.wikipedia.org/api/rest_v1/page/summary/" + UriEncodedPasta + "?redirect=true", {
        method: "GET",
        headers: headers,
    });

    const response = await fetch(getDaPastaRequest);

    if (!response.ok) {
        message.channel.send("Mama mia, that request was too spicy and Nonna had an error!");
        throw new Error(`Error response status: ${response.status}`);
    }

    const responseJson = await response.json();

    const pastaPicture = responseJson['thumbnail']['source'];
    const pastaDescription = responseJson['description'];
    const pastaExtract = responseJson['extract'];

    const stuffToSend = pastaPicture + '\n\n' + pastaDescription + '\n\n' + pastaExtract;
    console.log("Sending: " + stuffToSend);
    message.channel.send(stuffToSend);
});

// eslint-disable-next-line no-undef
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Logged in!'));
