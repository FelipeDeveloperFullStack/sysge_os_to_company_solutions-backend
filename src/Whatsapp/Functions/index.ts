import {
  DownloadableMessage,
  downloadContentFromMessage,
  GroupParticipant,
  isJidGroup,
  proto,
} from "@adiwajshing/baileys";
import { IBotData } from "./Types";
import fs from "fs";
import { writeFile } from "fs/promises";
// import fetch from "node-fetch"
import path from "path";

export const getBotData = (
  socket: any,
  webMessage: proto.IWebMessageInfo
): IBotData => {
  const { remoteJid } = webMessage.key;

  const sendText = async (text: string) => {
    return socket?.sendMessage(remoteJid, { text });
  };

  const sendImage = async (
    pathOrBuffer: string | Buffer,
    caption = "",
    isReply = true
  ) => {
    let options = {};
    if (isReply) {
      options = {
        quoted: webMessage,
      };
    }
    const image =
      pathOrBuffer instanceof Buffer
        ? pathOrBuffer
        : fs.readFileSync(pathOrBuffer);
    const params = caption
      ? {
          image,
          caption,
        }
      : { image };
    return await socket.sendMessage(remoteJid, params, options);
  };

  const sendSticker = async (pathOrBuffer: string | Buffer, isReply = true) => {
    let options = {};
    if (isReply) {
      options = {
        quoted: webMessage,
      };
    }
    const sticker =
      pathOrBuffer instanceof Buffer
        ? pathOrBuffer
        : fs.readFileSync(pathOrBuffer);
    return await socket.sendMessage(remoteJid, { sticker }, options);
  };

  const sendAudio = async (
    pathOrBuffer: string | Buffer,
    isReply = true,
    ptt = true
  ) => {
    let options = {};
    if (isReply) {
      options = {
        quoted: webMessage,
      };
    }
    const audio =
      pathOrBuffer instanceof Buffer
        ? pathOrBuffer
        : fs.readFileSync(pathOrBuffer);
    if (pathOrBuffer instanceof Buffer) {
      return await socket.sendMessage(
        remoteJid,
        {
          audio,
          ptt,
          mimetype: "audio/mpeg",
        },
        options
      );
    }
    options = { ...options, url: pathOrBuffer };
    return await socket.sendMessage(
      remoteJid,
      {
        audio: { url: pathOrBuffer },
        ptt,
        mimetype: "audio/mpeg",
      },
      options
    );
  };

  const reply = async (text: string) => {
    return await socket.sendMessage(
      remoteJid,
      { text },
      { quoted: webMessage }
    );
  };

  const {
    messageText,
    isImage,
    isVideo,
    isSticker,
    isAudio,
    isDocument,
    userJid,
    replyJid,
  } = extractDataFromWebMessage(webMessage);

  return {
    sendText,
    sendImage,
    sendSticker,
    sendAudio,
    reply,
    remoteJid,
    userJid,
    replyJid,
    socket,
    webMessage,
    isImage,
    isVideo,
    isSticker,
    isAudio,
    isDocument,
  };
};

export const downloadImage = async (
  webMessage: proto.IWebMessageInfo,
  fileName: string,
  folder: string | null = null,
  ...subFolders: string[]
) => {
  const content = (webMessage?.message?.imageMessage ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.imageMessage) as DownloadableMessage;

  if (!content) return null;

  const stream = await downloadContentFromMessage(content, "image");

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  let directory = [__dirname, "..", "assets"];

  if (!folder) {
    directory = [...directory, "temp"];
  }

  if (folder) {
    directory = [...directory, folder];
  }

  if (subFolders.length) {
    directory = [...directory, ...subFolders];
  }

  const filePath = path.resolve(...directory, `${fileName}.jpg`);

  await writeFile(filePath, buffer);

  return filePath;
};

export const readJSON = (pathFile: string) => {
  // @ts-ignore
  return JSON.parse(fs.readFileSync(pathFile));
};

export const writeJSON = (pathFile: string, data: any) => {
  fs.writeFileSync(pathFile, JSON.stringify(data));
};

export const extractDataFromWebMessage = (message: proto.IWebMessageInfo) => {
  let remoteJid: string;
  let messageText: string | null | undefined;

  let isReply = false;

  let replyJid: string | null = null;
  let replyText: string | null = null;

  const {
    key: { remoteJid: jid, participant: tempUserJid },
  } = message;

  if (jid) {
    remoteJid = jid;
  }

  if (message) {
    const extendedTextMessage = message.message?.extendedTextMessage;
    const buttonTextMessage = message.message?.buttonsResponseMessage;
    const listTextMessage = message.message?.listResponseMessage;

    const type1 = message.message?.conversation;

    const type2 = extendedTextMessage?.text;

    const type3 = message.message?.imageMessage?.caption;

    const type4 = buttonTextMessage?.selectedButtonId;

    const type5 = listTextMessage?.singleSelectReply?.selectedRowId;

    const type6 = message?.message?.videoMessage?.caption;

    messageText = type1 || type2 || type3 || type4 || type5 || type6 || "";

    isReply =
      !!extendedTextMessage && !!extendedTextMessage.contextInfo?.quotedMessage;

    replyJid =
      extendedTextMessage && extendedTextMessage.contextInfo?.participant
        ? extendedTextMessage.contextInfo.participant
        : null;

    replyText = extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
  }

  const userJid = tempUserJid?.replace(/:[0-9][0-9]|:[0-9]/g, "");

  const tempMessage = message?.message;

  const isImage =
    !!tempMessage?.imageMessage ||
    !!tempMessage?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.imageMessage;

  const isVideo =
    !!tempMessage?.videoMessage ||
    !!tempMessage?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.videoMessage;

  const isAudio =
    !!tempMessage?.audioMessage ||
    !!tempMessage?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.audioMessage;

  const isSticker =
    !!tempMessage?.stickerMessage ||
    !!tempMessage?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.stickerMessage;

  const isDocument =
    !!tempMessage?.documentMessage ||
    !!tempMessage?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.documentMessage;

  let mentionedJid = "";

  const mentionedJidObject =
    tempMessage?.extendedTextMessage?.contextInfo?.mentionedJid;

  if (mentionedJidObject) {
    mentionedJid = mentionedJidObject[0];
  }

  return {
    userJid,
    remoteJid,
    messageText,
    isReply,
    replyJid,
    replyText,
    isAudio,
    isImage,
    isSticker,
    isVideo,
    isDocument,
    mentionedJid,
    webMessage: message,
  };
};

export const downloadVideo = async (
  webMessage: proto.IWebMessageInfo,
  fileName: string,
  folder: string | null = null,
  ...subFolders: string[]
) => {
  const content = (webMessage?.message?.videoMessage ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.videoMessage) as DownloadableMessage;

  if (!content) return null;

  const stream = await downloadContentFromMessage(content, "video");

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  let directory = [__dirname, "..", "assets"];

  if (!folder) {
    directory = [...directory, "temp"];
  }

  if (folder) {
    directory = [...directory, folder];
  }

  if (subFolders.length) {
    directory = [...directory, ...subFolders];
  }

  const filePath = path.resolve(...directory, `${fileName}.mp4`);

  await writeFile(filePath, buffer);

  return filePath;
};

export const downloadSticker = async (
  webMessage: proto.IWebMessageInfo,
  fileName: string,
  folder: string | null = null,
  ...subFolders: string[]
) => {
  const content = (webMessage?.message?.stickerMessage ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.stickerMessage) as DownloadableMessage;

  if (!content) return null;

  const stream = await downloadContentFromMessage(content, "sticker");

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  let directory = [__dirname, "..", "assets"];

  if (!folder) {
    directory = [...directory, "temp"];
  }

  if (folder) {
    directory = [...directory, folder];
  }

  if (subFolders.length) {
    directory = [...directory, ...subFolders];
  }

  const filePath = path.resolve(...directory, `${fileName}.webp`);

  await writeFile(filePath, buffer);

  return filePath;
};

export const validate = async (
  type: string,
  { remoteJid, socket, userJid }: IBotData
) => {
  if (!isJidGroup(remoteJid)) return true;

  const { participants } = await socket.groupMetadata(remoteJid);

  const participant = participants.find(
    (participant: GroupParticipant) => participant.id === userJid
  );

  return participant && participant.admin === type;
};

export const isSuperAdmin = async (botData: IBotData) => {
  return await validate("superadmin", botData);
};

export const isAdmin = async (botData: IBotData) => {
  return (
    (await validate("admin", botData)) ||
    (await validate("superadmin", botData))
  );
};

// export async function getBuffer(url: string) {
//   const res = await fetch(url, {
//     headers: { "User-Agent": "okhttp/4.5.0" },
//     method: "GET",
//   });

//   const buff = await res.buffer();

//   if (buff) return { type: res.headers.get("content-type"), result: buff };

//   return { type: res.headers.get("content-type"), result: "Error" };
// }
