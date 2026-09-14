const axios = require('axios');

async function getBuffer(url, options = {}) {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      ...options,
      responseType: 'arraybuffer',
      timeout: options.timeout || 8000
    });
    return Buffer.from(res.data);
  } catch (err) {
    throw new Error(`getBuffer failed: ${err.message}`);
  }
}

async function fetchJson(url, options = {}) {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers
      },
      ...options,
      timeout: options.timeout || 8000
    });
    return res.data;
  } catch (err) {
    throw new Error(`fetchJson failed: ${err.message}`);
  }
}

global.getBuffer = getBuffer;
global.fetchJson = fetchJson;

module.exports = {
  getBuffer,
  fetchJson
};
