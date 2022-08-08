/** 
 * 什么值得买自动签到评论脚本
 * 更新地址：https://github.com/charmingYouYou/smzdm_sign_ql
 * cron: 0 15 10 * * * index.js
 * new Env('什么值得买自动签到评论')
 */
import axios, { AxiosRequestConfig } from "axios";
import cheerio from "cheerio";
import { sendNotify } from "./sendNotify.js";
import { getRandom, ascii2native, getProcessEnv } from "./utils";
import moment from "moment";

const SMZDM_COOKIE_LIST = getProcessEnv("SMZDM_COOKIE_LIST") || [];
const SMZDM_COMMIT_LIST = getProcessEnv("SMZDM_COMMIT_LIST") || [];
const isCommit = Boolean(getProcessEnv("SMZDM_IS_COMMIT")[0]) || true;
let cookieList = [];
let commitList = [];
SMZDM_COOKIE_LIST.forEach((cookies) => {
  cookieList = [...cookieList, ...cookies.split("|=|")];
});
SMZDM_COMMIT_LIST.forEach((commit) => {
  commitList = [...commitList, ...commit.split("|=|")];
});

axios.defaults.withCredentials = true;
axios.interceptors.request.use((config: AxiosRequestConfig) => {
  config.headers = {
    ...config.headers,
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
  };
  return config;
});

function getTime() {
  return moment().format("YYYY-MM-DD HH:mm:ss");
}

function getUser(cookie: string) {
  return cookie.slice(0, 10);
}

function sendNotifyFn(msg: string, cookie: string) {
  const time = getTime();
  if (isCommit) {
    sendNotify(
      "什么值得买签到",
      `时间: ${time}\n用户: ${getUser(cookie)}\n${msg}`
    );
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
  // return `https://faxian.smzdm.com/h1s0t0f37c0p${getRandom(30, 100)}/`;
  return `https://faxian.smzdm.com`;
};

/**
 * 什么值得买 获取用来评论的文章id
 * @param {Object} url 需要访问的url
 * @param {Object} referer 来源url
 * @param {Object} cookie 用来请求的 cookie
 */
const getPostID = (url, referer, cookie = "") => {
  //如果没传值 随机取一个cookie 防止重复提交
  return axios
    .get(url, {
      headers: {
        Referer: referer,
        // Cookie: cookie,
      },
    })
    .then((res) => {
      const time = getTime();
      const data = res.data;
      //临时列表
      let tempPostIdList: string[] = [];
      let $ = cheerio.load(data);
      $(".feed-ver-pic").each(function (i, e) {
        const href: string = $(e).find("a").eq(0).attr("href");
        tempPostIdList.push(
          href.substring(href.indexOf("/p/") + 3, href.length - 1)
        );
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
      sendNotifyFn(
        `事件: 文章列表报错\n错误内容: ${ascii2native(error)}`,
        cookie
      );
    });
};

/**
 * 什么值得买 评论
 * @param {Object} cookie cookie信息
 */
let smzdmCommit = (cookie: string) => {
  let pId = postIdList[Math.floor(Math.random() * postIdList.length)];
  const url = `https://zhiyou.smzdm.com/user/comment/ajax_set_comment?callback=jQuery111006551744323225079_${new Date().getTime()}&type=3&pid=${pId}&parentid=0&vote_id=0&vote_type=&vote_group=&content=${encodeURI(
    commitList[Math.floor(Math.random() * commitList.length)]
  )}&_=new Date().getTime()`;
  axios
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
      } else {
        sendNotifyFn(`事件: 失败\n错误内容: ${ascii2native(data)}`, cookie);
      }
    })
    .catch((error) => {
      console.log(error);
      sendNotifyFn(`事件: 失败\n错误内容: ${ascii2native(error)}`, cookie);
    });
};

/**
 * 什么值得买签到
 * @param {Object} cookieSess
 */
const smzdmSign = (cookie: string) => {
  const url = `https://zhiyou.smzdm.com/user/checkin/jsonp_checkin?callback=jQuery112409568846254764496_${new Date().getTime()}&_=${new Date().getTime()}`;
  axios
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
        sendNotifyFn(`事件: 签到成功!!!!`, cookie);
      } else {
        sendNotifyFn(`事件: 签到失败\n错误内容: ${ascii2native(data)}`, cookie);
      }
    })
    .catch((error) => {
      console.log(error);
      sendNotifyFn(`事件: 签到失败\n错误内容: ${ascii2native(error)}`, cookie);
    });
};

//延迟执行签到
const setTimeSmzdmSign = (cookie: string) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      //签到
      await smzdmSign(cookie);
      resolve("success");
    }, getRandom(0, 10000));
  });
};

//评论三次 执行时间自定
const commitSetTimeout = (cookie: string, timeNum = 1) => {
  return new Promise((resolve) => {
    if (timeNum == 4) {
      resolve("success");
      return;
    }
    setTimeout(async () => {
      await getPostID(getCommitUrl(), "https://www.smzdm.com/jingxuan/", cookie);
      await smzdmCommit(cookie);
      console.log(`已评论${timeNum}次`)
      timeNum++;
      commitSetTimeout(cookie, timeNum);
    }, getRandom(0, 30000) * timeNum);
  });
};

const init = async () => {
  await getPostID(getCommitUrl(), "https://www.smzdm.com/jingxuan/");
  if (cookieList.length) {
    console.log(`共找到${cookieList.length}个用户, 准备开始执行...`);
    for (const index in cookieList) {
      const cookie = encodeURI(cookieList[index]);
      console.log(`开始执行第${index + 1}用户签到...`);
      await setTimeSmzdmSign(cookie);
      if (commitList.length) {
        console.log(`开始执行第${index + 1}用户评论...`);
        await commitSetTimeout(cookie);
      } else {
        console.log("未找到smzdm对应评论列表, 请配置SMZDM_COMMIT_LIST环境变量");
      }
    }
  } else {
    console.log("未找到smzdm对应cookie, 请配置SMZDM_COOKIE_LIST环境变量");
  }
};

init();
