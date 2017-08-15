import config from '../../config/config';

// Import required fs interfaces
let FS_INTERFACES = {}
const _interfaces = config['FS_INTERFACES'].split(',').map(v => v.trim())
for (const _interface of _interfaces) {
  FS_INTERFACES[_interface] = require(`./${_interface}`);
console.debug(`Setup '${_interface}' interface`)
  if (_interface === 'https') {
    FS_INTERFACES['http'] = FS_INTERFACES['https'];
    console.debug("Setup 'http' interface")
  }
}
export default FS_INTERFACES