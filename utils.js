"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ascii2native = exports.getProcessEnv = exports.getRandom = void 0;
const IS_TEST = false;
//取随机数 min = 最小值 ； max = 最大值
const getRandom = (min, max) => {
    return IS_TEST
        ? 5000
        : parseInt(String(Math.random() * (max - min + 1) + min));
};
exports.getRandom = getRandom;
const getProcessEnv = (key) => {
    let res = [];
    const env = process.env[key];
    if (env) {
        if (env.indexOf("&") > -1) {
            res = env === null || env === void 0 ? void 0 : env.split("&");
        }
        else if (env.indexOf("\n") > -1) {
            res = env.split("\n");
        }
        else {
            res = [env];
        }
    }
    return res;
};
exports.getProcessEnv = getProcessEnv;
//转码ascii 转 native
const ascii2native = (str) => {
    let asciicode = str.split("\\u");
    let nativeValue = asciicode[0];
    for (let i = 1; i < asciicode.length; i++) {
        let code = asciicode[i];
        nativeValue += String.fromCharCode(parseInt("0x" + code.substring(0, 4)));
        if (code.length > 4) {
            nativeValue += code.substring(4, code.length);
        }
    }
    return nativeValue;
};
exports.ascii2native = ascii2native;
