"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformId = exports.Browsers = void 0;

const os = require("os");
const { proto } = require("../../WAProto/index.js"); 

const PLATFORM_MAP = {
    'aix': 'AIX',
    'darwin': 'Mac OS',
    'win32': 'Windows',
    'android': 'Android',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'Solaris',
    'linux': undefined,  // Default ke Ubuntu untuk Linux
    'haiku': undefined,
    'cygwin': undefined,
    'netbsd': undefined
};

// Fixed: Browsers sekarang fungsi yang return array [platform, browser, version]
// Ini kompatibel dengan pemanggilan Browsers('Chrome') di Defaults/index.js
exports.Browsers = (browser) => {
    console.log("BeowserUtils:/n", "browser:", browser)
  switch (browser) {
    case 'Android':
      return ['Android', 'Chrome', '13'];
    case 'and_roid':
      return ['Android', 'Business', '13'];
    default:
      return ['Ubuntu', 'Chrome', '120'];
  }
};

const getPlatformId = (browser) => {
     console.log("BeowserGETpLATFORMid:/n", "browser:", browser)
    const platformType = proto.DeviceProps.PlatformType[browser.toUpperCase()];
    return platformType ? platformType.toString() : '1'; // Default Chrome
};

exports.getPlatformId = getPlatformId;