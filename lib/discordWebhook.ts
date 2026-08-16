import { safeStorage } from './storageAdapter';

const DISCORD_WEBHOOK_KEY = '@vega_discord_webhook_url';
const DEFAULT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1537362265840418837/xbbyXId3hKtcBvtuqIY74Gm08eroSUb1pujXqGGDrQ72LhvX3H4FQ4qXRQgzEFvR6_4p';

export const getDiscordWebhookUrl = async (): Promise<string> => {
  try {
    const stored = await safeStorage.getItem(DISCORD_WEBHOOK_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch {}
  return (
    process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL ||
    DEFAULT_WEBHOOK_URL
  );
};

export const setDiscordWebhookUrl = async (url: string): Promise<void> => {
  try {
    await safeStorage.setItem(DISCORD_WEBHOOK_KEY, url.trim());
  } catch {}
};

export const sendDiscordReport = async ({
  mediaTitle,
  issueType,
  description,
  userEmail,
}: {
  mediaTitle: string;
  issueType: string;
  description?: string;
  userEmail?: string;
}): Promise<boolean> => {
  const webhookUrl = await getDiscordWebhookUrl();
  if (!webhookUrl) return false;

  const payload = {
    username: 'AuraFlex Fix Bot',
    avatar_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200',
    embeds: [
      {
        title: '🚨 Broken Video / Link Report',
        description: `**Title:** ${mediaTitle}`,
        color: 15673937, // Crimson Red (#EF4444)
        fields: [
          { name: 'Issue Type', value: issueType, inline: true },
          { name: 'Submitted By', value: userEmail || 'Guest User', inline: true },
          { name: 'Details', value: description || 'No additional details provided.' },
        ],
        footer: { text: `AuraFlex Automated Report • ${new Date().toLocaleString()}` },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn('Discord report webhook failed:', e);
    return false;
  }
};

export const sendDiscordRequest = async ({
  title,
  mediaType,
  year,
  notes,
  userEmail,
}: {
  title: string;
  mediaType: string;
  year?: string;
  notes?: string;
  userEmail?: string;
}): Promise<boolean> => {
  const webhookUrl = await getDiscordWebhookUrl();
  if (!webhookUrl) return false;

  const payload = {
    username: 'AuraFlex Request Bot',
    avatar_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200',
    embeds: [
      {
        title: '🎬 New Media Request',
        description: `**Requested Title:** ${title}`,
        color: 1095969, // Emerald Green (#10B981)
        fields: [
          { name: 'Media Category', value: mediaType.toUpperCase(), inline: true },
          { name: 'Release Year', value: year || 'Not specified', inline: true },
          { name: 'Submitted By', value: userEmail || 'Guest User', inline: true },
          { name: 'Notes', value: notes || 'No additional notes.' },
        ],
        footer: { text: `AuraFlex Request System • ${new Date().toLocaleString()}` },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn('Discord request webhook failed:', e);
    return false;
  }
};
