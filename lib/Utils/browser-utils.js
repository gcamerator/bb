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
    'and_roid': 'Android',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'Solaris',
    'linux': 'Ubuntu',  // Default ke Ubuntu untuk Linux
    'haiku': undefined,
    'cygwin': undefined,
    'netbsd': undefined
};

// Fixed: Browsers sekarang fungsi yang return array [platform, browser, version]
// Ini kompatibel dengan pemanggilan Browsers('Chrome') di Defaults/index.js

export.Browsers = {
  ubuntu: (browser = 'Chrome') => ['Ubuntu', browser, '22.04.4'],

  macOS: (browser = 'Chrome') => ['Mac OS', browser, '14.4.1'],

  windows: (browser = 'Chrome') => ['Windows', browser, '10.0.22631'],

  baileys: (browser = 'Baileys') => ['Baileys', browser, '6.5.0'],

  /** ANDROID الرسمي */
  android: (version = '15') => ['Android', 'android', version],

  /** SMB ANDROID (and_roid) */
  and_roid: (version = '15') => ['Android', 'and_roid', version],

  /** Auto detect */
  appropriate: (browser = 'Chrome') => [
    PLATFORM_MAP[os.platform()] || 'Ubuntu',
    browser,
    os.release()
  ]
}



const getPlatformId = (browser) => {
  const key = browser.toUpperCase()

  if (key === 'ANDROID' || key === 'AND_ROID') {
    return proto.DeviceProps.PlatformType.ANDROID_PHONE.toString()
  }

  return (
    proto.DeviceProps.PlatformType[key]?.toString() ||
    proto.DeviceProps.PlatformType.CHROME.toString()
  )
}


exports.getPlatformId = getPlatformId;
