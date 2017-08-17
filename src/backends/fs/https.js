import request from 'request';

export default {
  getStream(src) {
    return request
      .get(src);
  }
};
