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
    'linux': undefined,  // Default ke Ubuntu untuk Linux
    'haiku': undefined,
    'cygwin': undefined,
    'netbsd': undefined
};

// Fixed: Browsers sekarang fungsi yang return array [platform, browser, version]
// Ini kompatibel dengan pemanggilan Browsers('Chrome') di Defaults/index.js
exports.Browsers = {
  android: (version = '15') => ({
    name: 'Android',
    device: 'Android',
    version,
    platform: 'ANDROID'
  }),

  and_roid: (version = '15') => ({
    name: 'Android',
    device: 'Android',
    version,
    platform: 'SMB_ANDROID'
  }),

  web: (browser = 'Chrome') => ({
    name: 'Ubuntu',
    device: browser,
    version: '22.04',
    platform: 'WEB'
  })
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
