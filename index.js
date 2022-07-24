"use strict";
/*
什么值得买自动签到评论脚本
更新地址：https://github.com/charmingYouYou/smzdm_sign_ql

[task_local]
#什么值得买自动签到评论
1 1 0 * * * index.js, tag=什么值得买自动签到脚本, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const sendNotify_js_1 = require("./sendNotify.js");
const utils_1 = require("./utils");
const moment_1 = __importDefault(require("moment"));
const SMZDM_COOKIE_LIST = (0, utils_1.getProcessEnv)("SMZDM_COOKIE_LIST") || [];
const SMZDM_COMMIT_LIST = (0, utils_1.getProcessEnv)("SMZDM_COMMIT_LIST") || [];
const isCommit = Boolean((0, utils_1.getProcessEnv)("SMZDM_IS_COMMIT")[0]) || true;
let cookieList = [];
let commitList = [];
SMZDM_COOKIE_LIST.forEach((cookies) => {
    cookieList = [...cookieList, ...cookies.split("|=|")];
});
SMZDM_COMMIT_LIST.forEach((commit) => {
    commitList = [...commitList, ...commit.split("|=|")];
});
axios_1.default.defaults.withCredentials = true;
axios_1.default.interceptors.request.use((config) => {
    config.headers = Object.assign(Object.assign({}, config.headers), { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36" });
    return config;
});
function getTime() {
    return (0, moment_1.default)().format("YYYY-MM-DD HH:mm:ss");
}
function getUser(cookie) {
    return cookie.slice(0, 10);
}
function sendNotifyFn(msg, cookie) {
    const time = getTime();
    if (isCommit) {
        (0, sendNotify_js_1.sendNotify)("什么值得买签到", `时间: ${time}\n用户: ${getUser(cookie)}\n${msg}`);
    }
}
//文章列表 默认
let postIdList = [
    "9350354",
    "9328133",
    "9328024",
    "9350282",
    "9350254",
    "9328044",
    "9350219",
    "9350181",
    "9350166",
    "9343266",
    "9350093",
    "9350065",
    "9350031",
    "9349991",
    "9349977",
    "9349974",
    "9349943",
    "9349901",
    "9349892",
    "9349732",
];
//评论地址
//家居生活 发现频道 30 - 100 页 随机页数
const getCommitUrl = () => {
    return `https://faxian.smzdm.com/h1s0t0f37c0p${(0, utils_1.getRandom)(30, 100)}/`;
};
/**
 * 什么值得买 获取用来评论的文章id
 * @param {Object} url 需要访问的url
 * @param {Object} referer 来源url
 * @param {Object} cookie 用来请求的 cookie
 */
const getPostID = (url, referer, cookie = "") => {
    //如果没传值 随机取一个cookie 防止重复提交
    return axios_1.default
        .get(url, {
        headers: {
            Referer: referer,
            Cookie: cookie,
        },
    })
        .then((res) => {
        const time = getTime();
        const data = res.data;
        //临时列表
        let tempPostIdList = [];
        let $ = cheerio_1.default.load(data);
        $(".feed-ver-pic").each(function (i, e) {
            const href = $(e).find("a").eq(0).attr("href");
            tempPostIdList.push(href.substring(href.indexOf("/p/") + 3, href.length - 1));
        });
        console.log(`${time} --- 新文章列表：`, tempPostIdList);
        //获取新列表，再更新，否则不更新
        if (tempPostIdList.length > 0) {
            postIdList = tempPostIdList;
        }
    })
        .catch((error) => {
        console.log(error);
        //发邮件
        sendNotifyFn(`事件: 文章列表报错\n错误内容: ${(0, utils_1.ascii2native)(error)}`, cookie);
    });
};
/**
 * 什么值得买 评论
 * @param {Object} cookie cookie信息
 */
let smzdmCommit = (cookie) => {
    let pId = postIdList[Math.floor(Math.random() * postIdList.length)];
    const url = `https://zhiyou.smzdm.com/user/comment/ajax_set_comment?callback=jQuery111006551744323225079_${new Date().getTime()}&type=3&pid=${pId}&parentid=0&vote_id=0&vote_type=&vote_group=&content=${encodeURI(commitList[Math.floor(Math.random() * commitList.length)])}&_=new Date().getTime()`;
    axios_1.default
        .get(url, {
        headers: {
            Referer: "https://zhiyou.smzdm.com/user/submit/",
            Cookie: cookie,
        },
    })
        .then((res) => {
        const data = res.data;
        console.log("data===", data);
        if (data.indexOf('"error_code":0') != -1) {
            sendNotifyFn(`事件: 评论成功!!!!`, cookie);
        }
        else {
            sendNotifyFn(`事件: 失败\n错误内容: ${(0, utils_1.ascii2native)(data)}`, cookie);
        }
    })
        .catch((error) => {
        console.log(error);
        sendNotifyFn(`事件: 失败\n错误内容: ${(0, utils_1.ascii2native)(error)}`, cookie);
    });
};
/**
 * 什么值得买签到
 * @param {Object} cookieSess
 */
const smzdmSign = (cookie) => {
    const url = `https://zhiyou.smzdm.com/user/checkin/jsonp_checkin?callback=jQuery112409568846254764496_${new Date().getTime()}&_=${new Date().getTime()}`;
    axios_1.default
        .get(url, {
        headers: {
            Referer: "http://www.smzdm.com/qiandao/",
            Cookie: cookie,
        },
    })
        .then((res) => {
        const data = res.data;
        console.log("data===", data);
        if (data.indexOf('"error_code":0') != -1) {
            console.log(`什么值得买 签到成功!!!!`);
            sendNotifyFn(`事件: 签到成功!!!!已连续签到${data.data.checkin_num}`, cookie);
        }
        else {
            sendNotifyFn(`事件: 签到失败\n错误内容: ${(0, utils_1.ascii2native)(data)}`, cookie);
        }
    })
        .catch((error) => {
        console.log(error);
        sendNotifyFn(`事件: 签到失败\n错误内容: ${(0, utils_1.ascii2native)(error)}`, cookie);
    });
};
//延迟执行签到
const setTimeSmzdmSign = (cookie) => {
    return new Promise((resolve) => {
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            //签到
            yield smzdmSign(cookie);
            resolve("success");
        }), (0, utils_1.getRandom)(10000, 10000000));
    });
};
//评论三次 执行时间自定
const commitSetTimeout = (cookie, timeNum = 1) => {
    return new Promise((resolve) => {
        if (timeNum == 4) {
            resolve("success");
        }
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            yield getPostID(getCommitUrl(), "https://www.smzdm.com/jingxuan/", cookie);
            yield smzdmCommit(cookie);
            console.log(`已评论${timeNum}次`);
            timeNum++;
            commitSetTimeout(cookie, timeNum);
        }), (0, utils_1.getRandom)(60000, 6000000) * timeNum);
    });
};
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    yield getPostID(getCommitUrl(), "https://www.smzdm.com/jingxuan/");
    if (cookieList.length) {
        console.log(`共找到${cookieList.length}个用户, 准备开始执行...`);
        for (const index in cookieList) {
            const cookie = encodeURI(cookieList[index]);
            console.log(`开始执行第${index + 1}用户签到...`);
            yield setTimeSmzdmSign(cookie);
            if (commitList.length) {
                console.log(`开始执行第${index + 1}用户评论...`);
                yield commitSetTimeout(cookie);
            }
            else {
                console.log("未找到smzdm对应评论列表, 请配置SMZDM_COMMIT_LIST环境变量");
            }
        }
    }
    else {
        console.log("未找到smzdm对应cookie, 请配置SMZDM_COOKIE_LIST环境变量");
    }
});
init();
