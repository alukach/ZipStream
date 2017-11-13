module.exports = {
  ignoreUrls: ['/health-check', '/favicon.ico'],
  active: process.env.NODE_ENV === 'production',
};
