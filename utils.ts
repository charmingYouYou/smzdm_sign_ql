const IS_TEST = true;
//取随机数 min = 最小值 ； max = 最大值
export const getRandom = (min: number, max: number) => {
  return IS_TEST
    ? 5000
    : parseInt(String(Math.random() * (max - min + 1) + min));
};

export const getProcessEnv = (key: string) => {
  let res: string[] = [];
  const env = process.env[key];
  if (env) {
    if (env.indexOf("&") > -1) {
      res = env?.split("&");
    } else if (env.indexOf("\n") > -1) {
      res = env.split("\n");
    } else {
      res = [env];
    }
  }
  return res;
};

//转码ascii 转 native
export const ascii2native = (str: string) => {
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
