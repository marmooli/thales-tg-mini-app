type TelegramBotEnv = {
  TELEGRAM_BOT_TOKEN: string;
};

export function buildCouponSentNotificationMessage() {
  return 'تبریک! کوپن ۳۸ دلاری تخفیف کارت برای شما آزاد شد. اکنون می‌توانید کارت XT خود را بصورت رایگان فعال کنید.';
}

export async function sendTelegramMessage(env: TelegramBotEnv, chatId: number | string, text: string, replyMarkup?: unknown) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}
