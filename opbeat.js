'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  ignoreUrls: ['/health-check', '/favicon.ico'],
  active: process.env.NODE_ENV === 'production'
};
module.exports = exports['default'];
//# sourceMappingURL=opbeat.js.map
