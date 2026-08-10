export interface SniffedMedia {
  url: string;
  type: 'm3u8' | 'mp4';
  title: string;
  timestamp: number;
}

let sniffedStreams: SniffedMedia[] = [];
let listeners: Array<(media: SniffedMedia) => void> = [];

export const getSniffedStreams = (): SniffedMedia[] => sniffedStreams;

export const injectMediaSniffer = (onSniff?: (media: SniffedMedia) => void) => {
  if (typeof window === 'undefined') return;

  if (onSniff && !listeners.includes(onSniff)) {
    listeners.push(onSniff);
  }

  if (!(window.fetch as any).__isSnifferInjected) {
    const originalFetch = window.fetch;
    const customFetch = async (...args: Parameters<typeof originalFetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url;
      if (url && (url.includes('.m3u8') || url.includes('.mp4'))) {
        const item: SniffedMedia = {
          url,
          type: url.includes('.m3u8') ? 'm3u8' : 'mp4',
          title: typeof document !== 'undefined' && document.title ? document.title : 'AuraFlex Media',
          timestamp: Date.now(),
        };
        if (!sniffedStreams.some((s) => s.url === url)) {
          sniffedStreams.unshift(item);
          listeners.forEach((listener) => listener(item));
        }
      }
      return originalFetch(...args);
    };
    (customFetch as any).__isSnifferInjected = true;
    window.fetch = customFetch;
  }
};
