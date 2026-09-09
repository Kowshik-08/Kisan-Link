const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5000, subdomain: 'kisanlink-live-' + Math.floor(Math.random() * 8999 + 1000) });
    console.log('====================================================');
    console.log('🌾 KisanLink Online Public Tunnel Active!');
    console.log('🌐 Public Online URL:', tunnel.url);
    console.log('🩺 Public Health Check:', `${tunnel.url}/api/health`);
    console.log('====================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to create tunnel:', err);
  }
})();
