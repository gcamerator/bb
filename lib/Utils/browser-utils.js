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
    'and_roid': 'And_roid',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'Solaris',
    'linux': 'Ubuntu',  // الافتراضي لنظام لينكس
    'haiku': undefined,
    'cygwin': undefined,
    'netbsd': undefined
};

// تم تصحيح exports.Browsers هنا
// 1. تعريف الدالة الأساسية التي تستدعيها المكتبة افتراضياً
// Fixed: Browsers sekarang fungsi yang return array [platform, browser, version]
// Ini kompatibel dengan pemanggilan Browsers('Chrome') di Defaults/index.js
exports.Browsers = (browser) => {
    const osName = PLATFORM_MAP[os.platform()] || 'Ubuntu';  // Default Ubuntu kalau undefined
    const osRelease = os.release();  // Ambil versi OS real-time
    return [osName, browser, osRelease];
};

const getPlatformId = (browser) => {
    const platformType = proto.DeviceProps.PlatformType[browser.toUpperCase()];
    return platformType ? platformType.toString() : '1'; // Default Chrome
};
// تصدير الدالة
exports.getPlatformId = getPlatformId;
