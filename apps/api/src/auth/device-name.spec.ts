import { deviceName } from './device-name';

/*
 * One case for each real header. Each is copied from the browser it names,
 * and each shows why the order of the checks matters: almost every one of
 * them also contains the name of a browser or a system it is not.
 */
describe('deviceName', () => {
  it.each([
    [
      'Firefox on Linux',
      'Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0',
    ],
    [
      'Chrome on Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    ],
    [
      'Edge on Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    ],
    [
      'Safari on macOS',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    ],
    [
      'Chrome on macOS',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    ],
    [
      'Firefox on macOS',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0',
    ],
    [
      'Firefox on Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
    ],
    [
      'Safari on iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    ],
    [
      'Chrome on iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1',
    ],
    [
      'Firefox on iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/143.0 Mobile/15E148 Safari/605.1.15',
    ],
    [
      'Edge on iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/141.0.3537.57 Mobile/15E148 Safari/605.1.15',
    ],
    [
      'Safari on iPad',
      'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    ],
    [
      'Chrome on Android',
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    ],
    [
      'Edge on Android',
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0',
    ],
    [
      'Firefox on Android',
      'Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0',
    ],
    [
      'Chrome on Linux',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    ],
  ])('names %s', (name, header) => {
    expect(deviceName(header)).toBe(name);
  });

  it('says "A browser on" the system when the browser is not one it knows', () => {
    expect(
      deviceName(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Konqueror/5.0',
      ),
    ).toBe('A browser on Linux');
  });

  it('names the browser alone when the system is not one it knows', () => {
    expect(
      deviceName(
        'Mozilla/5.0 (X11; FreeBSD amd64; rv:143.0) Gecko/20100101 Firefox/143.0',
      ),
    ).toBe('Firefox');
  });

  it('says "A browser" when it knows neither, or there is no header', () => {
    expect(deviceName('curl/8.9.1')).toBe('A browser');
    expect(deviceName('')).toBe('A browser');
    expect(deviceName(null)).toBe('A browser');
    expect(deviceName(undefined)).toBe('A browser');
  });
});
