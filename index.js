import 'dotenv/config';
import {Client, Events, GatewayIntentBits} from 'discord.js';
import FuzzySet from 'fuzzyset';

import pastaJson from './pasta.json' with {type: 'json'};
import memeJson from './memes.json' with {type: 'json'};

const fuzzyPastaSet = FuzzySet();
pastaJson.forEach(pasta => {
    fuzzyPastaSet.add(pasta.toLowerCase());
});
const fuzzyMemeSet = FuzzySet();
memeJson.forEach(meme => {
    fuzzyMemeSet.add(meme.toLowerCase());
});

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

function getMatchingStrings(stringToMatch, scoreMin = 0.4) {
    // array of [score, matched_value] arrays
    const allMatchedPastas = fuzzyPastaSet.get(stringToMatch);
    const allMatchedMemes = fuzzyMemeSet.get(stringToMatch);

    const allMatchedStrings = {};

    if (allMatchedPastas) {
        allMatchedStrings.pastas = getMatchingStringsSort(allMatchedPastas, scoreMin);
    }

    if (allMatchedMemes) {
        allMatchedStrings.memes = getMatchingStringsSort(allMatchedMemes, scoreMin);
    }

    console.log(`ALL MATCHED PASTAS: ${allMatchedStrings.pastas}`);
    console.log(`ALL MATCHED MEMES: ${allMatchedStrings.memes}`)
    return allMatchedStrings;
}

function getMatchingStringsSort(fuzzySet, scoreMin) {
    return fuzzySet.toSorted((thingA, thingB) => {
        return thingB[0] - thingA[0];
    }).filter(thing => {
        // We do not want perfect matches to be suggested
        return thing[0] >= scoreMin && thing[0] !== 1;
    }).map(thing => {
        return capitalize(thing[1]);
    }).join(', ');
}

function capitalize(stringToCapitalize) {
    if (!stringToCapitalize?.length) {
        return;
    }

    return String(stringToCapitalize[0]).toUpperCase() + String(stringToCapitalize).slice(1);
}

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (!textChannels.includes(message.channelId)) return;

    if (message.author.username.toLowerCase() === 'mercer_less') {
        message.react('🤌');
    }

    const content = message.content;
    // Matches: ((word))
    const regex = /\(\(([^\]]+)\)\)/g;
    if (!regex.test(content)) {
        return;
    }

    const messageContentClean = content.substring(2, content.length - 2).toLowerCase().trim();

    const allFuzzyMatchingStrings = getMatchingStrings(messageContentClean);

    if (allFuzzyMatchingStrings.pastas?.length) {
        message.channel.send(`Nonna asks if you meant any of the following: ${allFuzzyMatchingStrings.pastas}?`);

        return;
    }

    if (allFuzzyMatchingStrings.memes?.length) {
        message.channel.send(`Nonna asks if you meant any of the following: ${allFuzzyMatchingStrings.memes}?`);

        return;
    }

    const uriEncodedPasta = encodeURIComponent(messageContentClean);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("User-Agent", "DiscordBot PastaBot Jonathan Forscher");
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${uriEncodedPasta}?redirect=true`;
    console.log(`FORMATTED URL: ${url}`);
    const getDaPastaRequest = new Request(url, {
        method: "GET",
        headers: headers,
    });
    // TODO rate limit
    const response = await fetch(getDaPastaRequest);

    if (!response.ok) {

        if (response.status === 404) {
            message.channel.send("Mama mia, Nonna cannot find that!");

            return;
        }
        message.channel.send("Mama mia, that request was too spicy and Nonna had an error!");
        console.log(`Error response status: ${response.status}`);
        const errorBody = await response.text();
        console.log(`Error body: ${errorBody}`);

        return;
    }

    const responseJson = await response.json();

    if (!responseJson['thumbnail']) {
        message.channel.send("Nonna says no thumbnail, sad!");

        return;
    }

    const pastaPicture = responseJson['thumbnail']['source'];
    const pastaDescription = responseJson['description'];
    const pastaExtract = responseJson['extract'];

    const stuffToSend = pastaPicture + '\n\n' + pastaDescription + '\n\n' + pastaExtract;

    // TODO This probably has terrible performance
    if (!stuffToSend.toLowerCase().includes("pasta")) {
        message.channel.send("Nonna says you need to include pastas only!");

        return;
    }

    console.log("Sending: " + stuffToSend);
    message.channel.send(stuffToSend);
});

// eslint-disable-next-line no-undef
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Logged in!'));
