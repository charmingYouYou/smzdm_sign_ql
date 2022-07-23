/** 
 * 什么值得买自动签到脚本
 * cron: 0 1 * * * smzdm_auto_sign_bot.py
 * new Env('什么值得买签到评论');
 */

import axios, { AxiosRequestConfig } from "axios";
import cheerio from 'cheerio'
import { sendNotify } from './sendNotify.js'
import {getRandom, ascii2native} from './utils'
import moment from 'moment'

console.log(process.env)

const COOKIE_LIST = process.env.SMZDM_COOKIE_LIST || []
const COMMIT_LIST = process.env.SMZDM_COMMIT_LIST || []
const IS_COMMIT = process.env.SMZDM_IS_COMMIT || true

axios.interceptors.request.use((config: AxiosRequestConfig) => {
  config.headers = {
    ...config.headers,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
  };
  return config;
});

function getTime() {
  return  moment().format('YYYY-MM-DD HH:mm:ss')
}

function sendNotifyFn(msg: string, cookie: string) {
  const time = getTime()
  if (IS_COMMIT) {
    sendNotify('什么值得买签到', `时间: ${time}\n用户: ${cookie.slice(0, 10)}\n${msg}`)
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
  return `https://faxian.smzdm.com/h1s0t0f37c0p${getRandom(30, 100)}/`;
};

/**
 * 什么值得买 获取用来评论的文章id
 * @param {Object} url 需要访问的url
 * @param {Object} referer 来源url
 * @param {Object} cookie 用来请求的 cookie
 */
const getPostID = (url, referer, cookie = "") => {
  //如果没传值 随机取一个cookie 防止重复提交
  axios.get(url, {
    headers: {
      Referer: referer,
      Cookie: cookie
    }
  }).then(res => {
    const time = getTime()
    const data = res.data
    //临时列表
    let tempPostIdList: string[] = [];
      let $ = cheerio.load(data);
      $(".feed-ver-pic").each(function (i, e) {
        const href: string = $(e).find("a").eq(0).attr("href");
        tempPostIdList.push(
          href.substring(href.indexOf("/p/") + 3, href.length - 1)
        );
      });
      console.log(
        `${time} --- 新文章列表：`,
        tempPostIdList
      );
      //获取新列表，再更新，否则不更新
      if (tempPostIdList.length > 0) {
        postIdList = tempPostIdList;
      }
  }).catch(error => {
    console.log(error);
    //发邮件
    sendNotifyFn(
      `事件: 文章列表报错\n错误内容: ${ascii2native(error)}`,
      cookie
    );
  })
};

/**
 * 什么值得买 评论
 * @param {Object} cookie cookie信息
 */
let smzdmCommit = (cookie: string) => {
  //	let num = Math.floor(Math.random() * 900);
  // let cookieName = cookieSess.username;
  let pId = postIdList[Math.floor(Math.random() * postIdList.length)];
  const url = `https://zhiyou.smzdm.com/user/comment/ajax_set_comment?callback=jQuery111006551744323225079_${new Date().getTime()}&type=3&pid=${pId}&parentid=0&vote_id=0&vote_type=&vote_group=&content=${encodeURI(commitList[Math.floor(Math.random() * commitList.length)])}&_=new Date().getTime()`
  axios.get(url, {
    headers: {
      Referer: "https://zhiyou.smzdm.com/user/submit/",
      Cookie: cookie
    }
  }).then(res => {
    const data = res.data
    console.log("data===", data);
    if (data.indexOf('"error_code":0') != -1) {
      sendNotifyFn(
        `事件: 评论成功!!!!`,
        cookie
      );
    } else {
      sendNotifyFn(
        `事件: 失败\n错误内容: ${ascii2native(data)}`,
        cookie
      );
    }
  }).catch(error => {
    console.log(error);
    sendNotifyFn(
      `事件: 失败\n错误内容: ${ascii2native(error)}`,
      cookie
    );
  })
};

/**
 * 什么值得买签到
 * @param {Object} cookieSess
 */
const smzdmSign = (cookie: string) => {
  const url =  `https://zhiyou.smzdm.com/user/checkin/jsonp_checkin?callback=jQuery112409568846254764496_${new Date().getTime()}&_=${new Date().getTime()}`

  axios.get(url, {
    headers: {
      Referer: "http://www.smzdm.com/qiandao/",
      Cookie: cookie
    }
  }).then(res => {
    const data = res.data
    console.log("data===", data);
    if (data.indexOf('"error_code":0') != -1) {
      console.log(
        `什么值得买 签到成功!!!!`
      );
      sendNotifyFn(`事件: 签到成功!!!!`, cookie)
    } else {
      sendNotifyFn(`事件: 签到失败\n错误内容: ${ascii2native(data)}`, cookie)
    }
  }).catch(error => {
    console.log(error);
    sendNotifyFn(`事件: 签到失败\n错误内容: ${ascii2native(error)}`, cookie)
  })
};

//延迟执行签到
const setTimeSmzdmSign = (cookie: string) => {
  setTimeout(() => {
    //签到
    smzdmSign(cookie);
    console.log("签到！！");
  }, getRandom(10000, 10000000));
};

//评论三次 执行时间自定
const commitSetTimeout = (cookie: string, timeNum = 1) => {
  if (timeNum == 4) {
    return;
  }
  //延迟发评论
  setTimeout(() => {
    //发现频道 最新
    getPostID(
      getCommitUrl(),
      "https://www.smzdm.com/jingxuan/",
      cookie
    );
    setTimeout(() => {
      console.log("cookie==", cookie);
      smzdmCommit(cookie);
      console.log("评论次数", timeNum);
    }, 5000);
  }, getRandom(40000, 1000000));

  setTimeout(() => {
    timeNum++;
    commitSetTimeout(cookie, timeNum);
  }, getRandom(60000, 6000000) * timeNum);
};

// //每天5点10执行 签到和评论
// schedule.scheduleJob(`30 ${getRandom(0, 59)} ${getRandom(8, 21)} * * *`, () => {
//   //发现频道 最新
//   getPostID(getCommitUrl(), "https://www.smzdm.com/jingxuan/");
//   for (let i = 0; i < cookieListValKey.length; i++) {
//     let cookieSess = cookieListValKey[i];
//     //延迟签到
//     setTimeSmzdmSign(cookieSess);
//     //发表三次评论
//     commitSetTimeout(cookieSess);
//   }
// });

//获取最新 待评论的 文章id
getPostID(getCommitUrl(), "https://www.smzdm.com/jingxuan/");

// //TODO 此处测试，可以删掉
// for (let i = 0; i < cookieListValKey.length; i++) {
//   let cookieSess = cookieListValKey[i];
//   //延迟签到
//   setTimeSmzdmSign(cookieSess);
//   //发表三次评论
//   commitSetTimeout(cookieSess);
// }
