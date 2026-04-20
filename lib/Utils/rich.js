"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * Lia@Changes 09-04-26 [WIP]
 * Adds support for tables and code blocks with richResponseMessage (wrapped inside botForwardedMessage).
 * * Converted to CommonJS by MidSoune
 */

const crypto_1 = require("crypto");
const constants_js_1 = require("../WABinary");
const RichType_js_1 = require("../Types/RichType.js");
const WAProto_1 = require("../../WAProto");
const generics_js_1 = require("./generics.js");
const DONATE_URL = 'https://saweria.co/itsliaaa'; 
const LEXER_REGEX = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[\s\S]*?`)|(\b[a-zA-Z_]\w*\b)(?=\s*\()|(\b[a-zA-Z_]\w*\b)|(\b\d+(?:\.\d+)?\b)|(\s+|[^\w\s]+)/g;
const BOT_RENDERING_CONFIG_METADATA = {
    bloksVersioningId: '0903aa5f7f47de66789d5f4c86d3bd6e05e4bc3ff85e454a9f907d5ed7fef97c',
    pixelDensity: 2.75
};
const textEncoder = new TextEncoder();
const NOOP = new Set([]);

const tokenizeCode = (code, language = 'javascript') => {
    const keywords = constants_js_1.LANGUAGE_KEYWORDS[language] || NOOP;
    const blocks = [];
    LEXER_REGEX.lastIndex = 0;
    let match;
    while ((match = LEXER_REGEX.exec(code)) !== null) {
        if (match[1]) {
            blocks.push({ highlightType: RichType_js_1.CodeHighlightType.COMMENT, codeContent: match[1] });
        }
        else if (match[2]) {
            blocks.push({ highlightType: RichType_js_1.CodeHighlightType.STRING, codeContent: match[2] });
        }
        else if (match[3]) {
            blocks.push({
                highlightType: keywords.has(match[3]) ? RichType_js_1.CodeHighlightType.KEYWORD : RichType_js_1.CodeHighlightType.METHOD,
                codeContent: match[3],
            });
        }
        else if (match[4]) {
            blocks.push({
                highlightType: keywords.has(match[4]) ? RichType_js_1.CodeHighlightType.KEYWORD : RichType_js_1.CodeHighlightType.DEFAULT,
                codeContent: match[4],
            });
        }
        else if (match[5]) {
            blocks.push({ highlightType: RichType_js_1.CodeHighlightType.NUMBER, codeContent: match[5] });
        }
        else {
            blocks.push({ highlightType: RichType_js_1.CodeHighlightType.DEFAULT, codeContent: match[6] });
        }
    }
    return blocks;
};
exports.tokenizeCode = tokenizeCode;

const toUnified = (submessages) => ({
    response_id: (0, crypto_1.randomUUID)(),
    sections: submessages.map((submessage, index) => {
        switch (submessage.messageType) {
            case RichType_js_1.RichSubMessageType.CODE:
                const codeMetadata = submessage.codeMetadata;
                return {
                    view_model: {
                        primitive: {
                            language: codeMetadata.codeLanguage,
                            code_blocks: codeMetadata.codeBlocks.map((block) => ({ content: block.codeContent, type: RichType_js_1.CodeHighlightType[block.highlightType] })),
                            __typename: 'GenAICodeUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                };
            case RichType_js_1.RichSubMessageType.CONTENT_ITEMS:
                return {
                    view_model: {
                        primitives: submessage.contentItemsMetadata.itemsMetadata.map((item) => {
                            const reelItem = item.reelItem;
                            return {
                                reels_url: reelItem.videoUrl,
                                thumbnail_url: reelItem.thumbnailUrl,
                                creator: reelItem.creator || '@itsliaaa/baileys',
                                avatar_url: reelItem.profileIconUrl,
                                reels_title: reelItem.title,
                                likes_count: reelItem.likesCount || 0,
                                shares_count: reelItem.sharesCount || 0,
                                view_count: reelItem.viewCount || 0,
                                reel_source: reelItem.reelSource || 'IG',
                                is_verified: reelItem.isVerified || false,
                                __typename: 'GenAIReelPrimitive'
                            };
                        }),
                        __typename: 'GenAIHScrollLayoutViewModel'
                    }
                };
            case RichType_js_1.RichSubMessageType.LATEX:
                const latexMetadata = submessage.latexMetadata;
                const item = {
                    latex_expression: latexMetadata.expressions[0]?.latexExpression,
                    font_height: latexMetadata.expressions[0]?.fontHeight,
                    padding: 15,
                    latex_image: {
                        url: latexMetadata.expressions[0]?.url,
                        width: latexMetadata.expressions[0]?.width || 388,
                        height: latexMetadata.expressions[0]?.height || 160
                    }
                };
                return {
                    view_model: {
                        primitive: {
                            item,
                            ...item,
                            __typename: 'GenAILatexUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                };
            case RichType_js_1.RichSubMessageType.TABLE:
                const tableMetadata = submessage.tableMetadata;
                return {
                    view_model: {
                        primitive: {
                            title: tableMetadata.title,
                            rows: tableMetadata.rows.map((row) => ({ is_header: row.isHeading, cells: row.items, markdown_cells: [] })),
                            __typename: 'GenATableUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                };
            case RichType_js_1.RichSubMessageType.TEXT:
                const shouldAddInlineEntity = index == 0;
                const inlineEntity = [{
                        key: 'Starseed',
                        metadata: {
                            reference_id: 1,
                            reference_url: DONATE_URL,
                            reference_title: 'For Donation via Saweria',
                            reference_display_name: 'Donate',
                            sources: [{
                                    source_type: 'THIRD_PARTY',
                                    source_display_name: 'Donate',
                                    source_subtitle: '',
                                    source_url: DONATE_URL
                                }],
                            __typename: 'GenAISearchCitationItem'
                        }
                    }];
                const textEntity = shouldAddInlineEntity ? '{{Starseed}}¹{{/Starseed}}' : '';
                return {
                    view_model: {
                        primitive: {
                            text: submessage.messageText + textEntity,
                            inline_entities: shouldAddInlineEntity ? inlineEntity : [],
                            __typename: 'GenAIMarkdownTextUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                };
        }
        return submessage;
    })
});
exports.toUnified = toUnified;

const buildAdditionalBotMetadataContext = (submessages) => {
    const sources = [];
    const mediaDetailsMetadataList = [];
    for (let i = 0; i < submessages.length; i++) {
        const submessage = submessages[i];
        switch (submessage.messageType) {
            case RichType_js_1.RichSubMessageType.CONTENT_ITEMS:
                const itemsMetadata = submessage.contentItemsMetadata.itemsMetadata;
                for (let n = 0; n < itemsMetadata.length; n++) {
                    const reelItem = itemsMetadata[n].reelItem;
                    sources.push({
                        provider: 0,
                        thumbnailCdnUrl: reelItem.thumbnailUrl,
                        sourceProviderUrl: reelItem.videoUrl,
                        sourceQuery: '',
                        faviconCdnUrl: '',
                        citationNumber: i + 1,
                        sourceTitle: reelItem.title
                    });
                    mediaDetailsMetadataList.push({
                        id: (0, crypto_1.randomBytes)(32).toString('hex'),
                        previewMedia: {
                            fileSha256: '',
                            mediaKey: '',
                            fileEncSha256: '',
                            directPath: '',
                            mediaKeyTimestamp: (0, generics_js_1.unixTimestampSeconds)(),
                            mimetype: 'image/jpeg'
                        }
                    });
                }
                break;
            case RichType_js_1.RichSubMessageType.LATEX:
                const expressions = submessage.latexMetadata.expressions;
                for (let n = 0; n < expressions.length; n++) {
                    mediaDetailsMetadataList.push({
                        id: (0, crypto_1.randomBytes)(32).toString('hex'),
                        previewMedia: {
                            fileSha256: '',
                            mediaKey: '',
                            fileEncSha256: '',
                            directPath: '',
                            mediaKeyTimestamp: (0, generics_js_1.unixTimestampSeconds)(),
                            mimetype: 'image/jpeg'
                        }
                    });
                }
                break;
        }
    }
    return { sources, mediaDetailsMetadataList };
};
exports.buildAdditionalBotMetadataContext = buildAdditionalBotMetadataContext;

const prepareRichResponseMessage = (content) => {
    const { code, contentText, expressions, footerText, headerText, items, language, richResponse, table, text, title } = content;
    let submessages = [];
    if (Array.isArray(richResponse)) {
        submessages = richResponse.map((submessage) => {
            if (submessage.text) {
                return { messageType: RichType_js_1.RichSubMessageType.TEXT, messageText: submessage.text };
            }
            else if (submessage.code) {
                return {
                    messageType: RichType_js_1.RichSubMessageType.CODE,
                    codeMetadata: { codeLanguage: submessage.language, codeBlocks: submessage.code }
                };
            }
            else if (submessage.expressions) {
                return {
                    messageType: RichType_js_1.RichSubMessageType.LATEX,
                    latexMetadata: { text: submessage.text, expressions: submessage.expressions }
                };
            }
            else if (submessage.items) {
                return {
                    messageType: RichType_js_1.RichSubMessageType.CONTENT_ITEMS,
                    contentItemsMetadata: { itemsMetadata: submessage.items }
                };
            }
            else if (submessage.table) {
                return {
                    messageType: RichType_js_1.RichSubMessageType.TABLE,
                    tableMetadata: { title: submessage.title, rows: submessage.table }
                };
            }
            return submessage;
        });
    }
    else {
        if (headerText) {
            submessages.push({ messageType: RichType_js_1.RichSubMessageType.TEXT, messageText: headerText });
        }
        if (contentText) {
            submessages.push({ messageType: RichType_js_1.RichSubMessageType.TEXT, messageText: contentText });
        }
        if (code) {
            let lang = language ?? 'javascript';
            submessages.push({
                messageType: RichType_js_1.RichSubMessageType.CODE,
                codeMetadata: { codeLanguage: lang, codeBlocks: (0, exports.tokenizeCode)(code, lang) }
            });
        }
        else if (expressions) {
            submessages.push({
                messageType: RichType_js_1.RichSubMessageType.LATEX,
                latexMetadata: { text, expressions }
            });
        }
        else if (items) {
            submessages.push({
                messageType: RichType_js_1.RichSubMessageType.CONTENT_ITEMS,
                contentItemsMetadata: {
                    itemsMetadata: items.map((item) => ({ reelItem: item })),
                    contentType: WAProto_1.proto.AIRichResponseContentItemsMetadata.ContentType.CAROUSEL
                }
            });
        }
        else if (table) {
            const tableRows = table.map((items, index) => ({ isHeading: index == 0, items }));
            submessages.push({
                messageType: RichType_js_1.RichSubMessageType.TABLE,
                tableMetadata: { title, rows: tableRows }
            });
        }
        if (footerText) {
            submessages.push({ messageType: RichType_js_1.RichSubMessageType.TEXT, messageText: footerText });
        }
    }
    const unified = (0, exports.toUnified)(submessages);
    const message = (0, exports.wrapToBotForwardedMessage)({
        submessages,
        messageType: WAProto_1.proto.AIRichResponseMessageType.AI_RICH_RESPONSE_TYPE_STANDARD,
        unifiedResponse: { data: textEncoder.encode(JSON.stringify(unified)) },
        contextInfo: { isForwarded: true, forwardingScore: 1, forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' }, forwardOrigin: 4 }
    });
    const { sources, mediaDetailsMetadataList } = (0, exports.buildAdditionalBotMetadataContext)(submessages);
    const botMetadata = message.messageContextInfo.botMetadata;
    if (sources.length > 0) {
        botMetadata.richResponseSourcesMetadata = { sources };
    }
    if (mediaDetailsMetadataList.length > 0) {
        botMetadata.unifiedResponseMutation = { mediaDetailsMetadataList };
    }
    return message;
};
exports.prepareRichResponseMessage = prepareRichResponseMessage;

const botMetadataSignature = () => {
    const signature = new Uint8Array(64);
    (0, crypto_1.getRandomValues)(signature);
    return signature;
};
exports.botMetadataSignature = botMetadataSignature;

const botMetadataCertificate = (length = 700) => {
    const certificate = new Uint8Array(length);
    certificate[0] = 48;
    certificate[1] = 130;
    (0, crypto_1.getRandomValues)(certificate.subarray(2));
    return certificate;
};
exports.botMetadataCertificate = botMetadataCertificate;

const wrapToBotForwardedMessage = (richResponseMessage) => ({
    messageContextInfo: {
        botMetadata: {
            pluginMetadata: {},
            verificationMetadata: {
                proofs: [
                    {
                        certificateChain: [
                            (0, exports.botMetadataCertificate)(684),
                            (0, exports.botMetadataCertificate)(892)
                        ],
                        version: 1,
                        useCase: 1,
                        signature: (0, exports.botMetadataSignature)()
                    }
                ]
            },
            botRenderingConfigMetadata: BOT_RENDERING_CONFIG_METADATA
        }
    },
    botForwardedMessage: {
        message: { richResponseMessage }
    }
});
exports.wrapToBotForwardedMessage = wrapToBotForwardedMessage;
