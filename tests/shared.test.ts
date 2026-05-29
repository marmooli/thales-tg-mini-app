import { describe, expect, it } from 'vitest';
import {
  buildBotStartMessage,
  buildTelegramMenuButton,
  buildTelegramStartKeyboard,
  getDiscountAccessCopy,
  isUidAllowedByFormat,
  normalizeUid,
  toPersianDigits,
} from '../src/shared';

describe('shared helpers', () => {
  it('normalizes XT UIDs', () => {
    expect(normalizeUid(' 12 34 ')).toBe('1234');
  });

  it('validates allowed UID format', () => {
    expect(isUidAllowedByFormat('ABCD_123')).toBe(true);
    expect(isUidAllowedByFormat('ab')).toBe(false);
    expect(isUidAllowedByFormat('not valid!')).toBe(false);
  });

  it('converts digits to Persian digits', () => {
    expect(toPersianDigits('38')).toBe('۳۸');
  });

  it('builds the Telegram start button payload', () => {
    const keyboard = buildTelegramStartKeyboard('https://example.com/app');
    expect(keyboard.inline_keyboard[0][0].text).toBe('Open Thales App');
    expect(keyboard.inline_keyboard[0][0].web_app.url).toBe('https://example.com/app');
  });

  it('builds the Telegram menu button payload', () => {
    const button = buildTelegramMenuButton('https://example.com/app');
    expect(button.type).toBe('web_app');
    expect(button.text).toBe('Open Thales App');
    expect(button.web_app.url).toBe('https://example.com/app');
  });

  it('builds the bot start message', () => {
    expect(buildBotStartMessage()).toBe('لطفاً از طریق دکمۀ زیر وارد مینی‌اپ طالس شوید.');
  });

  it('returns locked discount copy for unverified users', () => {
    const copy = getDiscountAccessCopy(false);
    expect(copy.allowed).toBe(false);
    expect(copy.body).toContain('این بخش فقط پس از تأیید');
  });
});
