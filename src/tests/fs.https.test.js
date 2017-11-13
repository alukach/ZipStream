import { expect } from 'chai';
import { getStream, IpAddressError } from '../backends/fs/https';


describe('FS Backend - https:', () => {
  describe('fs.getStream', () => {
    it('should throw error on ip address', (done) => {
      expect(() => getStream('http://169.254.169.254/latest/dynamic/instance-identity/'))
        .to.throw(IpAddressError);
      done();
    });
  });
});
