const { getApiBaseUrl, escapeHtml } = require('../../../frontend/edustream-frontend/utils');

describe('Front-end utility unit tests', () => {
  test('uses backend URL when running through Live Server', () => {
    expect(getApiBaseUrl({ port: '5500' })).toBe('http://localhost:5000/api/v1');
  });

  test('uses same-origin API in integrated deployment', () => {
    expect(getApiBaseUrl({ port: '5000' })).toBe('/api/v1');
  });

  test('honors an explicit API URL override', () => {
    expect(getApiBaseUrl({ port: '5500' }, 'https://example.test/api')).toBe('https://example.test/api');
  });

  test('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
});
