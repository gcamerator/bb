"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptMessageNode = exports.NACK_REASONS = exports.MISSING_KEYS_ERROR_TEXT = exports.NO_MESSAGE_FOUND_ERROR_TEXT = void 0;
exports.decodeMessageNode = decodeMessageNode;
const boom_1 = require("@hapi/boom");
const WAProto_1 = require("../../WAProto");
const WABinary_1 = require("../WABinary");
const generics_1 = require("./generics");

exports.NO_MESSAGE_FOUND_ERROR_TEXT = 'Message absent from node';
exports.MISSING_KEYS_ERROR_TEXT = 'Key used already or never filled';
exports.NACK_REASONS = {
    ParsingError: 487,
    UnrecognizedStanza: 488,
    UnrecognizedStanzaClass: 489,
    UnrecognizedStanzaType: 490,
    InvalidProtobuf: 491,
    InvalidHostedCompanionStanza: 493,
    MissingMessageSecret: 495,
    SignalErrorOldCounter: 496,
    MessageDeletedOnPeer: 499,
    UnhandledError: 500,
    UnsupportedAdminRevoke: 550,
    UnsupportedLIDGroup: 551,
    DBOperationFailed: 552
};
const extractAddressingContext = stanza => {
    let senderAlt;
    let recipientAlt;
    const sender = stanza.attrs.participant || stanza.attrs.from;
    const addressingMode = stanza.attrs.addressing_mode || (sender?.endsWith('lid') ? 'lid' : 'pn');
    if (addressingMode === 'lid') {
        senderAlt = stanza.attrs.participant_pn || stanza.attrs.sender_pn || stanza.attrs.peer_recipient_pn;
        recipientAlt = stanza.attrs.recipient_pn;
    } else {
        senderAlt = stanza.attrs.participant_lid || stanza.attrs.sender_lid || stanza.attrs.peer_recipient_lid;
        recipientAlt = stanza.attrs.recipient_lid;
    }
    return {
        addressingMode,
        senderAlt,
        recipientAlt
    };
};
/**
 * Decode the received node as a message.
 * @note this will only parse the message, not decrypt it
 */
function decodeMessageNode(stanza, meId, meLid) {
    let msgType;
    let chatId;
    let author;
    let fromMe = false;

    const isMeJid = (jid) => (0, WABinary_1.areJidsSameUser)(jid, meId);
    const isMeLid = (jid) => (0, WABinary_1.areJidsSameUser)(jid, meLid);
    
    const msgId = stanza.attrs.id;
    const senderPn = stanza.attrs?.sender_pn;
    const senderLid = stanza.attrs?.sender_lid;
    const participant = stanza.attrs.participant_pn || stanza.attrs.participant;
    const addressingContext = extractAddressingContext(stanza);
    
    const normalizePrivateChatJid = (jid) => {
        if ((0, WABinary_1.isJidGroup)(jid)) return jid;
        if ((0, WABinary_1.isJidUser)(jid) && jid.includes(":")) return jid.split(":")[0] + "@s.whatsapp.net";
        if ((0, WABinary_1.isLidUser)(jid) && jid.includes(":")) return jid.split(":")[0] + "@lid";
        if (senderPn && (0, WABinary_1.isJidUser)(senderPn)) return senderPn;
        return jid;
    };
    
    const from = normalizePrivateChatJid(stanza.attrs.from);
    const participantLid = stanza.attrs?.participant;
    const recipient = stanza.attrs.recipient;
    
    if ((0, WABinary_1.isJidUser)(from) || (0, WABinary_1.isLidUser)(from)) {
        if (recipient && !(0, WABinary_1.isJidMetaAi)(recipient)) {
            if (!isMeJid(from) && !isMeLid(from)) {
                throw new boom_1.Boom('recipient present, but msg not from me', { data: stanza });
            }
            chatId = recipient;
            fromMe = true;
        } else {
            chatId = from;
        }
        msgType = 'chat';
        author = from;
    } 
    else if ((0, WABinary_1.isJidGroup)(from)) {
        if (!participant) {
            throw new boom_1.Boom('No participant in group message');
        }
        fromMe = isMeLid(participant) || isMeJid(participant);
        msgType = 'group';
        author = participant;
        chatId = from;
    }
    else if ((0, WABinary_1.isJidNewsletter)(from)) {
        fromMe = stanza.attrs?.is_sender === 'true' || !!stanza.attrs?.is_sender;
        msgType = 'newsletter';
        author = from;
        chatId = from;
    }
    else if ((0, WABinary_1.isJidBroadcast)(from)) {
        if (!participant) {
            throw new boom_1.Boom('No participant in group message');
        }
        const isParticipantMe = participant.endsWith("@lid") ? isMeLid(participant) : isMeJid(participant);
        if ((0, WABinary_1.isJidStatusBroadcast)(from)) {
            msgType = isParticipantMe ? 'direct_peer_status' : 'other_status';
        }
        else {
            msgType = isParticipantMe ? 'peer_broadcast' : 'other_broadcast';
        }
        chatId = from;
        author = participant;
    }
    else {
        throw new boom_1.Boom('Unknown message type', { data: stanza });
    }

    const pushname = stanza?.attrs?.notify ?? stanza?.attrs?.display_name;
    if (chatId?.endsWith("@lid") && senderPn?.endsWith("@s.whatsapp.net")) {
        chatId = senderPn;
    }

    const key = Object.fromEntries(
        Object.entries({
            remoteJid: chatId,
            remoteJidAlt: !(0, WABinary_1.isJidGroup)(chatId) ? addressingContext.senderAlt : undefined,
            fromMe,
            id: msgId,
            senderPn,
            senderLid: senderLid || ((0, WABinary_1.isLidUser)(from) ? from : null),
            participant: (0, WABinary_1.isJidGroup)(chatId) ? participant : undefined,
            participantAlt: (0, WABinary_1.isJidGroup)(chatId) ? addressingContext.senderAlt : undefined,
            participantLid: (0, WABinary_1.isJidGroup)(chatId) ? participantLid : undefined,
            'server_id': stanza.attrs?.server_id
        }).filter(([_, v]) => v != null)
    );

    const fullMessage = {
        key,
        category: stanza.attrs.category,
        messageTimestamp: +stanza.attrs.t,
        pushName: pushname,
        broadcast: WABinary_1.isJidBroadcast(from), 
        newsletter: WABinary_1.isJidNewsletter(from),
        additionalAttributes: stanza.attrs
    }
    if (msgType === 'newsletter') {
        fullMessage.newsletterServerId = +stanza.attrs?.server_id;
    }
    if (key.fromMe) {
        fullMessage.status = WAProto_1.proto.WebMessageInfo.Status.SERVER_ACK;
    }

    return {
        fullMessage,
        author,
        sender: msgType === 'chat' ? author : chatId
    };
}

const decryptMessageNode = (stanza, meId, meLid, repository, logger) => {
    const { fullMessage, author, sender } = decodeMessageNode(stanza, meId, meLid);
    return {
        fullMessage,
        category: stanza.attrs.category,
        author,
        async decrypt() {
            const normalizeDecryptJid = (jid = '') => {
                const value = String(jid || '').trim();
                if (!value || !value.includes('@')) {
                    return '';
                }
                return (0, WABinary_1.jidNormalizedUser)(value);
            };

            let decryptables = 0;
            if (Array.isArray(stanza.content)) {
                for (const { tag, attrs, content } of stanza.content) {
                    // دمج ميزات الـ Meta والـ Verified Business والـ Bot
                    if (tag === 'verified_name' && content instanceof Uint8Array) {
                        const cert = WAProto_1.proto.VerifiedNameCertificate.decode(content);
                        const details = WAProto_1.proto.VerifiedNameCertificate.Details.decode(cert.details);
                        fullMessage.verifiedBizName = details.verifiedName;
                    }
                    if (tag === 'multicast' && content instanceof Uint8Array) {
                        fullMessage.multicast = true;
                    }
                    if (tag === 'meta' && content instanceof Uint8Array) {
                        fullMessage.metaInfo = { targetID: attrs.target_id };
                        if (attrs.target_sender_jid) {
                            fullMessage.metaInfo.targetSender = (0, WABinary_1.jidNormalizedUser)(attrs.target_sender_jid);
                        }
                    }
                    if (tag === 'bot' && content instanceof Uint8Array) {
                        if (attrs.edit) {
                            fullMessage.botInfo = {
                                editType: attrs.edit, 
                                editTargetID: attrs.edit_target_id, 
                                editSenderTimestampMS: attrs.sender_timestamp_ms
                            };
                        }
                    }
                    // كشف الـ ViewOnce الجديد من الكود الثاني
                    if (tag === 'unavailable' && attrs.type === 'view_once') {
                        fullMessage.key.isViewOnce = true;
                        fullMessage.additionalAttributes.viewonce = true;
                    }

                    if (tag !== 'enc' && tag !== 'plaintext') {
                        continue;
                    }
                    if (!(content instanceof Uint8Array)) {
                        continue;
                    }

                    decryptables += 1;
                    let msgBuffer;

                    try {
                        const e2eType = tag === 'plaintext' ? 'plaintext' : attrs.type;
                        switch (e2eType) {
                            case 'skmsg':
                                msgBuffer = await repository.decryptGroupMessage({
                                    group: sender,
                                    authorJid: author,
                                    msg: content
                                });
                                break;
                            case 'pkmsg':
                            case 'msg':
                                {
                                    // دمج الأمان العالي: تجريب فك التشفير بالمعرفات المتعددة (الـ PN والـ LID معاً)
                                    const primaryUser = (0, WABinary_1.isJidUser)(sender) ? sender : author;
                                    const pnCandidate = normalizeDecryptJid(
                                        stanza.attrs.sender_pn ||
                                        stanza.attrs.peer_recipient_pn ||
                                        stanza.attrs.participant_pn ||
                                        fullMessage.key?.senderPn ||
                                        ''
                                    );
                                    const decryptCandidates = Array.from(new Set([
                                        normalizeDecryptJid(primaryUser),
                                        pnCandidate
                                    ].filter(Boolean)));
                                    
                                    let lastDecryptError = null;

                                    for (const candidate of decryptCandidates) {
                                        try {
                                            msgBuffer = await repository.decryptMessage({
                                                jid: candidate,
                                                type: e2eType,
                                                ciphertext: content
                                            });
                                            lastDecryptError = null;
                                            break; // نجح فك التشفير! اخرج من الـ Loop
                                        }
                                        catch (error) {
                                            lastDecryptError = error;
                                        }
                                    }

                                    if (lastDecryptError) {
                                        throw lastDecryptError;
                                    }
                                }
                                break;
                            case 'plaintext':
                            case undefined:
                                msgBuffer = content;
                                break;
                            default:
                                throw new Error(`Unknown e2e type: ${e2eType}`);
                        }

                        let msg = WAProto_1.proto.Message.decode(e2eType !== 'plaintext' ? (0, generics_1.unpadRandomMax16)(msgBuffer) : msgBuffer);
                        msg = msg.deviceSentMessage?.message || msg;

                        if (msg.senderKeyDistributionMessage) {
                            try {
                                await repository.processSenderKeyDistributionMessage({
                                    authorJid: author,
                                    item: msg.senderKeyDistributionMessage
                                });
                            }
                            catch (err) {
                                logger.error({ key: fullMessage.key, err }, 'failed to decrypt message');
                            }
                        }

                        if (fullMessage.message) {
                            Object.assign(fullMessage.message, msg);
                        } else {
                            fullMessage.message = msg;
                        }
                    }
                    catch (err) {
                        logger.error({ key: fullMessage.key, err }, 'failed to decrypt message');
                        fullMessage.messageStubType = WAProto_1.proto.WebMessageInfo.StubType.CIPHERTEXT;
                        fullMessage.messageStubParameters = [err.message];
                    }
                }
            }
           if (!decryptables) {
                fullMessage.messageStubType = WAProto_1.proto.WebMessageInfo.StubType.CIPHERTEXT;
                fullMessage.messageStubParameters = [(0, exports.NO_MESSAGE_FOUND_ERROR_TEXT) || "No message found"];
            }
        }
    };
};
exports.decryptMessageNode = decryptMessageNode;
