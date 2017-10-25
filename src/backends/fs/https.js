import { parse } from 'url';
import request from 'request';
import isIp from 'is-ip';
import { APIError } from '../../helpers/errors';

const IpAddressError = new APIError('IP Addresses are not supported', 400);

export default {
  IpAddressError,
  getStream(src) {
    if (isIp(parse(src).host)) {
      throw IpAddressError;
    }
    return request
      .get(src);
  }
};
