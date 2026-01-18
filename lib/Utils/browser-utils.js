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
    'linux': 'Ubuntu',  // الافتراضي لنظام لينكس
    'haiku': undefined,
    'cygwin': undefined,
    'netbsd': undefined
};

// تم تصحيح exports.Browsers هنا
exports.Browsers = {
    ubuntu: (browser = 'Chrome') => ['Ubuntu', browser, '22.04.4'],

    macOS: (browser = 'Chrome') => ['Mac OS', browser, '14.4.1'],

    windows: (browser = 'Chrome') => ['Windows', browser, '10.0.22631'],

    baileys: (browser = 'Baileys') => ['Baileys', browser, '6.5.0'],

    /** ANDROID الرسمي */
    android: (version = '15') => ['Android', 'android', version],

    /** SMB ANDROID (and_roid) */
    and_roid: (version = '15') => ['Android', 'and_roid', version],

    /** التعرف التلقائي على النظام */
    appropriate: (browser = 'Chrome') => [
        PLATFORM_MAP[os.platform()] || 'Ubuntu',
        browser,
        os.release()
    ]
};

const getPlatformId = (browser) => {
    const key = browser.toUpperCase();

    // التحقق من منصة أندرويد
    if (key === 'ANDROID' || key === 'AND_ROID') {
        return proto.DeviceProps.PlatformType.ANDROID_PHONE.toString();
    }

    // محاولة جلب النوع من ملف الـ proto أو العودة للمتصفح الافتراضي
    return (
        proto.DeviceProps.PlatformType[key]?.toString() ||
        proto.DeviceProps.PlatformType.CHROME.toString()
    );
};

// تصدير الدالة
exports.getPlatformId = getPlatformId;