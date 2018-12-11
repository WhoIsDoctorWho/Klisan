const config = require('../config');

const TelegramBotApi = require('telegram-bot-api');

const telegramBotApi = new TelegramBotApi({
    token: config.bot_token,
    updates: {
        enabled: true  // do message pull
    }
});

telegramBotApi.on('message',
    (message) => processRequest(message)
        .catch(() => telegramBotApi.sendMessage({
            chat_id: message.chat.id,
            text: 'Something went wrong. Try again later.',
            parse_mode: 'Markdown'
        })));
