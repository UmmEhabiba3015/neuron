export type Platform = 'mobile' | 'tablet' | 'desktop';

const DEVICE_MODIFIER: Record<Platform, string> = {
  mobile: '',
  tablet: 't',
  desktop: 'd',
};

export function deviceClass(platform: Platform): string {
  const modifier = DEVICE_MODIFIER[platform];
  return modifier ? `device ${modifier}` : 'device';
}

export const PLATFORMS: Platform[] = ['mobile', 'tablet', 'desktop'];
