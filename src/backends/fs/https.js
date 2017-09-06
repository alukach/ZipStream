import request from 'request';

export default {
  get(src) {
    return new Promise((resolve, reject) => {
        resolve(request.get(src));
    })
  }
};
