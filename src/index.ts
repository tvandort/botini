import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

import FuzzySet from "fuzzyset";

import memeJson from "../data/memes.json";
import foodJson from "../data/food.json";
import pastaJson from "../data/pastas.json";
import { RateLimiter } from "./rater-limiter.js";
import { getLogger } from "./logger.js";
import { mapRawPastas } from "./pasta.js";
import { ensureEnv } from "./env";
import { capitalize } from "./capitalize";

const logger = getLogger();
// eslint-disable-next-line no-undef
ensureEnv({ logger });

const rateLimiter = new RateLimiter();
const pastaData = mapRawPastas(pastaJson);

const fuzzyPastaSet = FuzzySet(pastaData.allNames);
const fuzzyMemeSet = FuzzySet();
memeJson.forEach((meme) => {
  fuzzyMemeSet.add(meme.toLowerCase());
});

const PASTA_SET = "PASTA_SET";
const MEME_SET = "MEME_SET";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

function getHighestScoringInSet(allMatchedItems: [number, string][]) {
  return allMatchedItems?.reduce((maxItem, currentItem) =>
    currentItem[0] > maxItem[0] ? currentItem : maxItem,
  )[0];
}

function getMatchingStrings(
  stringToMatch: string,
  scoreMin = 0.5,
  setsToCheck = [PASTA_SET],
) {
  logger.info(`SETS MATCHING ON: ${setsToCheck.join(", ")}`);
  // Comma separated list of strings to suggest
  const allMatchedStrings: { pastas: any; memes: any } = {
    pastas: [],
    memes: [],
  };

  // array of [score, matched_value] arrays
  let allMatchedPastas: [number, string][] | null = null;
  if (setsToCheck.includes(PASTA_SET)) {
    allMatchedPastas = fuzzyPastaSet.get(stringToMatch);
  }

  if (allMatchedPastas) {
    const highestScorePasta = getHighestScoringInSet(allMatchedPastas);

    if (highestScorePasta === 1) {
      // Don't suggest an exact match
      return;
    }

    allMatchedStrings.pastas = getMatchingStringsSorted(
      allMatchedPastas,
      scoreMin,
    );

    logger.info(`ALL MATCHED PASTAS: ${allMatchedStrings.pastas}`);
  }

  // array of [score, matched_value] arrays
  let allMatchedMemes: [number, string][] | null = null;
  if (setsToCheck.includes(MEME_SET)) {
    allMatchedMemes = fuzzyMemeSet.get(stringToMatch);
  }

  if (allMatchedMemes) {
    const highestScoreMeme = getHighestScoringInSet(allMatchedMemes);

    if (highestScoreMeme === 1) {
      // Don't suggest an exact match
      return;
    }

    allMatchedStrings.memes = getMatchingStringsSorted(
      allMatchedMemes,
      scoreMin,
    );

    logger.info(`ALL MATCHED MEMES: ${allMatchedStrings.memes}`);
  }

  return allMatchedStrings;
}

/**
 * 1. Sort by score descending
 * 2. Remove items that do not exceed or match the minimum score
 * 3. Capitalize the item names
 * 4. Combine into one string, comma separated
 */
function getMatchingStringsSorted(
  fuzzySet: [number, string][],
  scoreMin: number,
) {
  return fuzzySet
    .filter((thing) => {
      return thing[0] >= scoreMin;
    })
    .sort((thingA, thingB) => {
      return thingB[0] - thingA[0];
    })
    .map((thing) => {
      return capitalize(thing[1]);
    })
    .join(", ");
}

// TODO Handle non-wikipedia
async function makeRequest(searchTerm: string, usernameMakingRequest: string) {
  const isAllowed = await rateLimiter.isUserRateLimited(usernameMakingRequest);

  if (!isAllowed) {
    logger.warn(`${usernameMakingRequest} has exceeded their rate limit`);

    throw new RateLimitError(usernameMakingRequest);
  }

  const uriEncodedPasta = encodeURIComponent(searchTerm);
  const spaceReplacedUri = uriEncodedPasta.replace("/%20/g", "_");

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("User-Agent", "DiscordBot PastaBot Jonathan Forscher");
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${spaceReplacedUri}?redirect=true`;
  logger.info(`FORMATTED URL: ${url}`);
  const getDaPastaRequest = new Request(url, {
    method: "GET",
    headers: headers,
  });

  const response = await fetch(getDaPastaRequest);

  if (!response.ok) {
    if (response.status === 404) {
      throw new RequestNotFoundError("Mama mia, Nonna cannot find that!");
    }

    logger.error(`Error response status: ${response.status}`);
    const errorBody = await response.text();
    logger.error(`Error body: ${errorBody}`);

    throw new RequestFailedError(
      "Oof marone, that request was too spicy and Nonna had an error!",
    );
  }

  return response.json();
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (!message.channel.isSendable() || !message.channel.isTextBased()) {
    return;
  }

  if (message.author.username.toLowerCase() === "mercer_less") {
    await message.react("🤌");
  }

  const content = message.content;
  // Matches: ((word))
  const regex = /\(\(([^\]]+)\)\)/g;
  if (!regex.test(content)) {
    return;
  }

  const messageContentClean = content
    .substring(2, content.length - 2)
    .toLowerCase()
    .trim();

  if (messageContentClean.includes("taylor ham")) {
    await message.react("🤌");

    message.channel.send(
      "https://tenor.com/view/soprano-smile-happy-gif-14831229",
    );

    return;
  } else if (messageContentClean.includes("pork roll")) {
    await message.react("🖕");

    message.channel.send(
      "https://tenor.com/view/sopranos-paulie-gualtieri-happy-smile-lol-gif-16139758",
    );

    return;
  }

  // TODO Bring back the meme set
  const allFuzzyMatchingStrings = getMatchingStrings(messageContentClean);

  if (allFuzzyMatchingStrings?.pastas?.length) {
    message.channel.send(
      `Nonna asks if you meant any of the following: ${allFuzzyMatchingStrings.pastas}?`,
    );

    return;
  }

  if (allFuzzyMatchingStrings?.memes?.length) {
    message.channel.send(
      `Nonna asks if you meant any of the following: ${allFuzzyMatchingStrings.memes}?`,
    );

    return;
  }

  let responseJson;
  try {
    responseJson = await makeRequest(
      messageContentClean,
      message.author.username,
    );
  } catch (error) {
    switch (true) {
      case error instanceof RateLimitError:
        await message.reply(
          `Nonna demands you slow down with your requests ${message.author.username}, or she can't serve pasta to everyone!`,
        );
        break;
      default:
        message.channel.send((error as any).message);
        break;
    }

    return;
  }

  let wikipediaPicture = "";
  if (responseJson?.thumbnail) {
    wikipediaPicture = responseJson.thumbnail["source"];
  }

  let wikipediaArticleDescription = responseJson["description"];
  let wikipediaArticleExtract = responseJson["extract"];

  // TODO FIX THIS. It should follow redirects or something?
  if (wikipediaArticleDescription === "Topics referred to by the same term") {
    wikipediaArticleDescription =
      responseJson["content_urls"]["desktop"]["page"];
    wikipediaArticleExtract = responseJson["content_urls"]["mobile"]["page"];
  }

  const stuffToSend =
    wikipediaPicture +
    "\n\n" +
    wikipediaArticleDescription +
    "\n\n" +
    wikipediaArticleExtract;

  if (findPastaRelatedItems(stuffToSend) > 0) {
    message.channel.send("Nonna says you need to include pasta only!");

    return;
  }

  logger.info(`Sending: ${stuffToSend}`);
  message.channel.send(stuffToSend);
});

// eslint-disable-next-line no-undef
client.login(process.env.DISCORD_TOKEN).then(() => logger.info("Logged in!"));

class RequestNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestNotFoundError";
  }
}

class RequestFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestFailedError";
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

function findPastaRelatedItems(inputString: string) {
  const lowerCaseInput = inputString.toLowerCase();
  const matches = [];

  for (let item of foodJson) {
    if (lowerCaseInput.includes(item.toLowerCase())) {
      matches.push(item);
    }
  }

  logger.info("Found the following pasta-related items: ", matches.join(", "));

  return matches.length;
}
