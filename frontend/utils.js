function getApiBaseUrl(locationLike, override) {
  if (override) return override.replace(/\/$/, '');
  const staticPorts = new Set(['5500', '5501', '3000', '5173', '4173']);
  return staticPorts.has(locationLike.port) ? 'http://localhost:5000/api/v1' : '/api/v1';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

module.exports = { getApiBaseUrl, escapeHtml };
