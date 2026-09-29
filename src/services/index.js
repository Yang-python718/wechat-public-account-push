import axios from "axios";
import dayjs from "dayjs";
import { JSDOM } from "jsdom";
import cloneDeep from "lodash/cloneDeep.js";
import config from "../../config/exp-config.js";
import getRuntimeConfig from "../../config/runtime-config.js";
import TEMPLATE_CONFIG from "../../config/template-config.cjs";
import { DEFAULT_OUTPUT, TYPE_LIST, RUN_TIME_STORAGE } from "../store/index.js";
import {
  getConstellation,
  randomNum,
  sortBirthdayTime,
  getColor,
  toLowerLine,
  getWeatherCityInfo,
  sleep,
} from "../utils/index.js";
import { selfDayjs, timeZone } from "../utils/set-def-dayjs.js";

axios.defaults.timeout = getRuntimeConfig().requestTimeoutMs;

const getErrorSummary = (response) => {
  if (typeof response === "string") {
    return response.slice(0, 160) || "未提供错误详情";
  }

  const data = response?.response?.data || response?.data;
  const status = response?.response?.status || response?.status;
  const code = data?.errcode ?? data?.code;
  const message = data?.errmsg || data?.message || data?.msg || response?.message;
  const details = [
    status && `HTTP ${status}`,
    code !== undefined && `code ${code}`,
    typeof message === "string" && message.slice(0, 160),
  ].filter(Boolean);

  return details.join(": ") || "未提供错误详情";
};

// 使用单空行还是双空行
const getLB = () => {
  if (!config.USE_PASSAGE || config.USE_PASSAGE === "wechat-test") {
    return "\n";
  }
  return "\n\n";
};

/**
 * 获取 accessToken
 * @returns accessToken
 */
export const getAccessToken = async () => {
  const { appId: envAppId, appSecret: envAppSecret } = getRuntimeConfig();
  const appId = config.APP_ID || envAppId;
  const appSecret = config.APP_SECRET || envAppSecret;
  // accessToken
  let accessToken = null;

  // 打印日志
  if (!appId) {
    console.error("未填写 appId，请检查配置或 Actions secret 名称。");
    return null;
  }
  if (!appSecret) {
    console.error("未填写 appSecret，请检查配置或 Actions secret 名称。");
    return null;
  }

  const postUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  try {
    const res = await axios.get(postUrl).catch((err) => err);
    if (res.status === 200 && res.data && res.data.access_token) {
      accessToken = res.data.access_token;
      console.log("获取 accessToken 成功");
    } else {
      console.error(`获取 accessToken 失败：${getErrorSummary(res)}`);
    }
  } catch (e) {
    console.error(`获取 accessToken 异常：${getErrorSummary(e)}`);
  }

  return accessToken;
};

/**
 * 获取天气icon
 * @param {*} weather
 * @returns
 */
export const getWeatherIcon = (weather) => {
  let weatherIcon = "🌈";
  const weatherIconList = [
    "☀️",
    "☁️",
    "⛅️",
    "☃️",
    "⛈️",
    "🏜️",
    "🏜️",
    "🌫️",
    "🌫️",
    "🌪️",
    "🌧️",
  ];
  const weatherType = [
    "晴",
    "阴",
    "云",
    "雪",
    "雷",
    "沙",
    "尘",
    "雾",
    "霾",
    "风",
    "雨",
  ];

  weatherType.forEach((item, index) => {
    if (weather.indexOf(item) !== -1) {
      weatherIcon = weatherIconList[index];
    }
  });

  return weatherIcon;
};

/**
 * 获取天气情况
 * @param {*} province 省份
 * @param {*} city 城市
 */
export const getWeather = async (province, city) => {
  if (config.SWITCH && config.SWITCH.weather === false) {
    return {};
  }

  // 读取缓存
  if (RUN_TIME_STORAGE[`${province}_${city}`]) {
    console.log(`获取了相同的数据，读取缓存 >>> ${province}_${city}`);
    return RUN_TIME_STORAGE[`${province}_${city}`];
  }

  const cityInfo = getWeatherCityInfo(province, city);
  if (!cityInfo) {
    console.error("配置文件中找不到相应的省份或城市");
    return {};
  }
  // const url = `http://t.weather.itboy.net/api/weather/city/${cityInfo.city_code}`
  const { baiduWeatherApiKey } = getRuntimeConfig();
  const url = `https://api.map.baidu.com/weather/v1/?district_id=${cityInfo.city_code}&data_type=all&ak=${baiduWeatherApiKey}`;

  const res = await axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .catch((err) => err);

  if (res.status === 200) {
    //获取今天日期
    const now = dayjs().tz(timeZone()).format("YYYY-MM-DD");

    const commonInfo = res.data.result;
    const todayInfo = commonInfo["forecasts"].filter(
      (item) => item.date == String(now)
    )[0];
    // const info = commonInfo && commonInfo.forecast && commonInfo.forecast[0];
    // if (!info) {
    //   console.error("天气情况: 找不到天气信息, 获取失败");
    //   return {};
    // }
    // return {};
    const result = {
      // 湿度
      shidu: commonInfo.now?.rh,
      // PM2.5
      pm25: commonInfo.pm25,
      // PM1.0
      pm10: commonInfo.pm10,
      // 空气质量
      quality: commonInfo.aqi,
      // 预防感冒提醒
      ganmao: commonInfo.indexes ? commonInfo.indexes[2].detail : "",
      // 日出时间
      sunrise: commonInfo.sunrise,
      // 日落时间
      sunset: commonInfo.sunset,
      // 空气质量指数
      aqi: commonInfo.aqi,
      // 天气情况
      weather: commonInfo.now?.text,
      // 最高温度
      maxTemperature: `${todayInfo?.high || 0}°`,
      // 最低温度
      minTemperature: `${todayInfo?.low || 0}°`,
      // 风向
      windDirection: commonInfo.now?.wind_dir,
      // 风力等级
      windScale: commonInfo.now?.wind_class,
      // 温馨提示
      notice: commonInfo.indexes,
    };

    RUN_TIME_STORAGE[`${province}_${city}`] = cloneDeep(result);

    return result;
  }
  console.error(`天气情况获取失败：${getErrorSummary(res)}`);
  return {};
};

/**
 * 获取下一休息日tts
 * @returns
 */
export const getHolidaytts = async () => {
  if (config.SWITCH && config.SWITCH.holidaytts === false) {
    return null;
  }

  const url = `https://api.jiejiariapi.com/v1/holidays/${new Date().getFullYear()}`;
  const res = await axios.get(url).catch((err) => err);
  let data = DEFAULT_OUTPUT.holidaytts;

  const responseBody = res?.data ?? res;
  let responseData = responseBody;
  if (typeof responseBody === "string") {
    try {
      responseData = JSON.parse(responseBody);
    } catch {
      responseData = null;
    }
  }

  const holidays = responseData && Object.values(responseData);
  const hasValidHolidayData = holidays?.length > 0
    && holidays.every((holiday) => (
      holiday
      && typeof holiday === "object"
      && typeof holiday.date === "string"
      && typeof holiday.isOffDay === "boolean"
    ));

  if (hasValidHolidayData) {
    const today = dayjs().startOf("day");
    const nextHoliday = holidays
      .filter((holiday) => holiday.isOffDay === true && holiday.date)
      .map((holiday) => ({
        ...holiday,
        daysUntil: dayjs(holiday.date).startOf("day").diff(today, "day"),
      }))
      .filter((holiday) => holiday.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)[0];

    if (nextHoliday) {
      const date = dayjs(nextHoliday.date);
      data = `还有${nextHoliday.daysUntil}天就是${date.format("M月D日")}${nextHoliday.name}了`;
    }
  } else {
    console.warn(
      `下一休息日接口暂不可用（${getErrorSummary(res)}），已使用默认文案。`
    );
  }
  const arr = [];
  for (let j = 0, i = 0; j < data.length; j += 20) {
    arr.push({
      name: `wx_holidaytts_${i}`,
      value: data.slice(j, j + 20),
      color: getColor(),
    });
    i++;
  }

  return {
    holidaytts: data,
    wxHolidaytts: arr,
  };
};

/**
 * 每日一言
 * @param {*} type
 * @returns
 */
export const getOneTalk = async (type) => {
  if (config.SWITCH && config.SWITCH.oneTalk === false) {
    return {};
  }

  const filterQuery = TYPE_LIST.filter((item) => item.name === type);
  const query = filterQuery.length
    ? filterQuery[0].type
    : TYPE_LIST[randomNum(0, 7)].type;
  const url = `https://v1.hitokoto.cn/?c=${query}`;

  const res = await axios.get(url).catch((err) => err);

  if (res && res.status === 200) {
    const data = res.data;
    const keys = [
      {
        from: "hitokoto",
        to: "one_talk",
      },
    ];
    keys.forEach((obj) => {
      const value = data[obj.from];
      const arr = [];
      for (let j = 0, i = 0; j < value.length; j += 20) {
        arr.push({
          name: `wx_${obj.to}_${i}`,
          value: value.slice(j, j + 20),
          color: getColor(),
        });
        i++;
      }
      data[`wx_${obj.to}`] = arr;
    });
    return data;
  }

  console.error(`每日一言发生错误：${getErrorSummary(res)}`);
  return {};
};

/**
 * 从沙雕APP开放接口中获取数据
 * @param {'chp'} type
 * @returns {Promise<String>}
 */
export const getWordsFromApiShadiao = async (type) => {
  const typeNameMap = {
    chp: "土味情话(彩虹屁)",
  };
  if (type !== "chp") {
    console.error("type参数有误，应为chp");
    return "";
  }
  const url = `https://api.shadiao.pro/${type}`;
  try {
    const res = await axios
      .get(url, {
        responseType: "json",
      })
      .catch((err) => err);
    return (res.data && res.data.data && res.data.data.text) || "";
  } catch (e) {
    console.error(`${typeNameMap[type]}：发生错误：${getErrorSummary(e)}`);
    return "";
  }
};

/**
 * 土味情话（彩虹屁）
 * @returns {Promise<String>} 土味情话(彩虹屁）内容
 */
export const getEarthyLoveWords = async () => {
  if (config.SWITCH && config.SWITCH.earthyLoveWords === false) {
    return "";
  }

  const data =
    (await getWordsFromApiShadiao("chp")) || DEFAULT_OUTPUT.earthyLoveWords;

  const arr = [];
  for (let j = 0, i = 0; j < data.length; j += 20) {
    arr.push({
      name: `wx_earthy_love_words_${i}`,
      value: data.slice(j, j + 20),
      color: getColor(),
    });
    i++;
  }

  return {
    earthyLoveWords: data,
    wxEarthyLoveWords: arr,
  };
};

/**
 * 星座运势请求
 * @param {string} date
 * @param {string} dateType
 * @returns
 */
export const getConstellationFortune = async (date, dateType) => {
  if (config.SWITCH && config.SWITCH.horoscope === false) {
    return [];
  }

  const res = [];
  if (!date) {
    return res;
  }

  const periods = ["今日", "明日", "本周", "本月", "今年"];
  const defaultType = [
    {
      name: "综合运势",
      key: "comprehensiveHoroscope",
    },
    {
      name: "爱情运势",
      key: "loveHoroscope",
    },
    {
      name: "事业学业",
      key: "careerHoroscope",
    },
    {
      name: "财富运势",
      key: "wealthHoroscope",
    },
    {
      name: "健康运势",
      key: "healthyHoroscope",
    },
  ];

  // 未填写时段，则取今日
  if (!dateType) {
    dateType = "今日";
  }

  const dateTypeIndex = periods.indexOf(dateType);
  if (dateTypeIndex === -1) {
    console.error("星座日期类型horoscopeDateType错误, 请确认是否按要求填写!");
    return res;
  }

  // 获取星座id
  const { en: constellation } = getConstellation(date);

  // 读取缓存
  if (RUN_TIME_STORAGE[`${constellation}_${dateTypeIndex}`]) {
    console.log(
      `获取了相同的数据，读取缓存 >>> ${constellation}_${dateTypeIndex}`
    );
    return RUN_TIME_STORAGE[`${constellation}_${dateTypeIndex}`];
  }

  const url = `https://www.xzw.com/fortune/${constellation}/${dateTypeIndex}.html`;
  try {
    const { data } = await axios.get(url).catch((err) => err);
    if (data) {
      const jsdom = new JSDOM(data);
      defaultType.forEach((item, index) => {
        let value = jsdom.window.document
          .querySelector(`.c_cont p strong.p${index + 1}`)
          .nextElementSibling.innerHTML.replace(/<small.*/, "");
        if (!value) {
          value = DEFAULT_OUTPUT.constellationFortune;
          console.error(`${item.name}获取失败`);
        }
        res.push({
          name: toLowerLine(item.key),
          value: `${dateType}${item.name}: ${value}`,
          color: getColor(),
        });
      });
    } else {
      // 拿不到数据则拼假数据, 保证运行
      defaultType.forEach((item) => {
        const value = DEFAULT_OUTPUT.constellationFortune;
        res.push({
          name: toLowerLine(item.key),
          value: `${dateType}${item.name}: ${value}`,
          color: getColor(),
        });
      });
    }

    RUN_TIME_STORAGE[`${constellation}_${dateTypeIndex}`] = cloneDeep(res);

    return res;
  } catch (e) {
    console.error(`星座运势发生错误：${getErrorSummary(e)}`);
    return res;
  }
};

/**
 * 获取重要节日信息
 * @param {Array<object>} festivals
 * @return
 */
export const getBirthdayMessage = (festivals) => {
  if (config.SWITCH && config.SWITCH.birthdayMessage === false) {
    return "";
  }

  if (
    Object.prototype.toString.call(festivals) !== "[object Array]" ||
    festivals.length === 0
  ) {
    festivals = null;
  }

  // 计算重要节日倒数
  const birthdayList = sortBirthdayTime(
    festivals || config.FESTIVALS || []
  ).map((it) => {
    if (!it.useLunar) {
      return it;
    }
    const date = selfDayjs().add(it.diffDay, "day");
    return {
      ...it,
      soarYear: date.format("YYYY"),
      solarDate: date.format("MM-DD"),
    };
  });
  let resMessage = "";
  const wechatTestBirthdayMessage = [];

  birthdayList.forEach((item, index) => {
    if (
      !config.FESTIVALS_LIMIT ||
      (config.FESTIVALS_LIMIT && index < config.FESTIVALS_LIMIT)
    ) {
      let message = null;

      // 生日相关
      if (item.type === "生日") {
        // 获取周岁
        let age;
        if (!item.useLunar) {
          age = selfDayjs().diff(`${item.year}-${item.date}`, "year");
        } else {
          age = selfDayjs().year() - item.year - 1;
        }

        if (item.diffDay === 0) {
          message = `今天是 「${item.name}」 的${
            age && item.isShowAge ? `${(item.useLunar ? 1 : 0) + age}岁` : ""
          }${item.useLunar ? "阴历" : "公历"}生日哦，祝${item.name}生日快乐！`;
        } else {
          message = `距离 「${item.name}」 的${
            age && item.isShowAge ? `${age + 1}岁` : ""
          }${item.useLunar ? "阴历" : "公历"}生日还有${item.diffDay}天`;
        }
      }

      // 节日相关
      if (item.type === "节日") {
        if (item.diffDay === 0) {
          message = `今天是 「${item.name}」 哦，要开心！`;
        } else {
          message = `距离 「${item.name}」 还有${item.diffDay}天`;
        }
      }

      // 存储数据
      if (message) {
        resMessage += `${message} ${getLB()}`;
        wechatTestBirthdayMessage.push({
          name: toLowerLine(`wxBirthday_${index}`),
          value: message,
          color: getColor(),
        });
      }
    }
  });

  return { resMessage, wechatTestBirthdayMessage };
};

/**
 * 计算每个重要日子的日期差
 * @params {*} customizedDateList
 * @returns
 */
export const getDateDiffList = (customizedDateList) => {
  if (
    Object.prototype.toString.call(customizedDateList) !== "[object Array]" &&
    Object.prototype.toString.call(config.CUSTOMIZED_DATE_LIST) !==
      "[object Array]"
  ) {
    return [];
  }
  const dateList = customizedDateList || config.CUSTOMIZED_DATE_LIST;

  dateList.forEach((item) => {
    item.diffDay = Math.ceil(
      selfDayjs().diff(selfDayjs(item.date), "day", true)
    );
    if (item.diffDay <= 0) {
      item.diffDay = Math.abs(
        Math.floor(selfDayjs().diff(selfDayjs(item.date), "day", true))
      );
    }
  });

  return dateList;
};

/**
 * 自定义插槽信息
 * @returns
 */
export const getSlotList = async () => {
  if (Object.prototype.toString.call(config.SLOT_LIST) !== "[object Array]") {
    return [];
  }
  return Promise.all(
    config.SLOT_LIST.map(async (item) => {
      let contents = Array.isArray(item.contents)
        ? [...item.contents]
        : typeof item.contents === "string"
          ? [item.contents]
          : [];

      if (item.contentsUrl) {
        try {
          const { data } = await axios.get(item.contentsUrl);
          if (typeof data === "string" && data.trim()) {
            contents.push(data.trim());
          } else {
            console.error(`自定义内容接口返回格式无效：${item.contentsUrl}`);
          }
        } catch (error) {
          console.error(
            `读取自定义内容接口失败：${item.contentsUrl}：${getErrorSummary(error)}`
          );
        }
      }

      const checkout = contents.length
        ? contents[Math.floor(Math.random() * contents.length)]
        : "";
      return {
        ...item,
        contents: Array.isArray(item.contents) || item.contentsUrl
          ? contents
          : item.contents,
        checkout,
      };
    })
  );
};

/**
 * 天行统一调用接口
 * @param apiType
 * @param params
 * @returns {Promise<T[]|*[]>}
 */
export const buildTianApi = async (apiType, params = null) => {
  const typeMap = {
    zaoan: "morningGreeting",
    wanan: "eveningGreeting",
    tianqi: "weather",
  };
  if (!(config.TIAN_API && config.TIAN_API[typeMap[apiType]])) {
    return [];
  }
  let count = config.TIAN_API[typeMap[apiType]];
  if (typeof count !== "number") {
    count = 1;
  }
  if (!(config.TIAN_API && config.TIAN_API.key)) {
    console.error("配置中config.TIAN_API.key 未填写，无法请求TIAN_API");
    return [];
  }

  if (RUN_TIME_STORAGE[`${apiType}_${JSON.stringify(params)}_${count}`]) {
    console.log(
      `获取了相同的数据，读取缓存 >>> ${apiType}_${JSON.stringify(
        params
      )}_${count}`
    );
    return RUN_TIME_STORAGE[`${apiType}_${JSON.stringify(params)}_${count}`];
  }

  const url = `http://api.tianapi.com/${apiType}/index`;
  const res = await axios
    .get(url, {
      params: { key: config.TIAN_API.key, ...params },
    })
    .catch((err) => err);

  if (res && res.data && res.data.code === 200) {
    const result = (res.data.newslist || []).slice(0, count);

    RUN_TIME_STORAGE[`${apiType}_${JSON.stringify(params)}_${count}`] =
      cloneDeep(result);

    return result;
  }

  console.error(`获取天行 API 接口 ${apiType} 发生错误：${getErrorSummary(res)}`);
  return [];
};

/**
 * 天行-早安心语
 * @returns {Promise<T>}
 */
export const getTianApiMorningGreeting = () =>
  buildTianApi("zaoan").then((res) => res[0] && res[0].content);

/**
 * 天行-晚安心语
 * @returns {Promise<T>}
 */
export const getTianApiEveningGreeting = () =>
  buildTianApi("wanan").then((res) => res[0] && res[0].content);

/**
 * 天行-天气（付费）
 * @param user
 * @returns {Promise<[]>|Promise<never>|Promise<AxiosResponse<any>>}
 */
export const getTianApiWeather = async (user) =>
  buildTianApi("tianqi", { city: user.city || config.CITY });

/**
 * 获取全部处理好的用户数据
 * @returns
 */
// istanbul ignore next
export const getAggregatedData = async () => {
  const weekList = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  if (Object.prototype.toString.call(config.USERS) !== "[object Array]") {
    console.error("配置文件中找不到USERS数组");
    throw new Error("配置文件中找不到USERS数组");
  }

  const users = config.USERS;
  const [
    holidayData,
    oneTalkData,
    earthyLoveWordsData,
    morningGreeting,
    eveningGreeting,
    slotList,
  ] = await Promise.all([
    getHolidaytts(),
    getOneTalk(config.LITERARY_PREFERENCE),
    getEarthyLoveWords(),
    getTianApiMorningGreeting(),
    getTianApiEveningGreeting(),
    getSlotList(),
  ]);

  const { holidaytts, wxHolidaytts } = holidayData;
  const {
    hitokoto: oneTalk = DEFAULT_OUTPUT.oneTalk,
    wx_one_talk: wxOneTalk = "",
    from: talkFrom = DEFAULT_OUTPUT.talkFrom,
  } = oneTalkData;
  const { earthyLoveWords, wxEarthyLoveWords } = earthyLoveWordsData;

  const slotParams = slotList.map((item) => ({
    name: item.keyword,
    value: item.checkout,
    color: getColor(),
  }));

  for (const user of users) {
    const useProvince = user.province || config.PROVINCE;
    const useCity = user.city || config.CITY;
    const [weatherInfo, constellationFortune, tianApiWeatherData] =
      await Promise.all([
        getWeather(useProvince, useCity),
        getConstellationFortune(user.horoscopeDate, user.horoscopeDateType),
        getTianApiWeather(user),
      ]);
    const weatherMessage = Object.keys(weatherInfo).map((item) => ({
      name: toLowerLine(item),
      value: weatherInfo[item] || "获取失败",
      color: getColor(),
    }));

    const dateDiffParams = getDateDiffList(user.customizedDateList).map(
      (item) => ({
        name: item.keyword,
        value: item.diffDay,
        color: getColor(),
      })
    );

    const { resMessage: birthdayMessage, wechatTestBirthdayMessage } =
      getBirthdayMessage(user.festivals);

    const tianApiGreeting = [
      {
        name: toLowerLine("tianApiMorningGreeting"),
        value: morningGreeting,
        color: getColor(),
      },
      {
        name: toLowerLine("tianApiEveningGreeting"),
        value: eveningGreeting,
        color: getColor(),
      },
    ].filter((it) => it.value);

    const tianApiWeather = (tianApiWeatherData || [])
      .map((it, index) =>
        Object.keys(it)
          .filter(
            (weatherKey) =>
              ["province", "area", "weatherimg"].indexOf(weatherKey) === -1
          )
          .map((key) => ({
            name: toLowerLine(`tianApiWeather_${key}_${index}`),
            value: it[key],
            color: getColor(),
          }))
      )
      .flat();

    // 集成所需信息
    const wxTemplateParams = [
      { name: toLowerLine("toName"), value: user.name, color: getColor() },
      {
        name: toLowerLine("date"),
        value: `${selfDayjs().format("YYYY-MM-DD")} ${
          weekList[selfDayjs().format("d")]
        }`,
        color: getColor(),
      },
      {
        name: toLowerLine("province"),
        value: user.province || config.PROVINCE,
        color: getColor(),
      },
      {
        name: toLowerLine("city"),
        value: user.city || config.CITY,
        color: getColor(),
      },
      {
        name: toLowerLine("birthdayMessage"),
        value: birthdayMessage,
        color: getColor(),
      },
      { name: toLowerLine("holidaytts"), value: holidaytts, color: getColor() },
      { name: toLowerLine("oneTalk"), value: oneTalk, color: getColor() },
      { name: toLowerLine("talkFrom"), value: talkFrom, color: getColor() },
      {
        name: toLowerLine("earthyLoveWords"),
        value: earthyLoveWords,
        color: getColor(),
      },
    ]
      .concat(weatherMessage)
      .concat(constellationFortune)
      .concat(dateDiffParams)
      .concat(slotParams)
      .concat(tianApiGreeting)
      .concat(tianApiWeather)
      .concat(wechatTestBirthdayMessage)
      .concat(wxOneTalk)
      .concat(wxEarthyLoveWords)
      .concat(wxHolidaytts);

    user.wxTemplateParams = wxTemplateParams;
  }

  return users;
};

/**
 * 本地模板拼装
 * @param templateId
 * @param wxTemplateData
 * @param urlencode
 * @param turnToOA \n转换成 %0A
 * @returns {{title: string, desc: string}|null}
 */
export const model2Data = (
  templateId,
  wxTemplateData,
  urlencode = false,
  turnToOA = false
) => {
  if (!templateId || !wxTemplateData) {
    console.error("发生错误：templateId 或 wxTemplateData 不能为空。");
    return null;
  }
  let targetValue = null;
  // 获取模板
  const model = TEMPLATE_CONFIG.find((o) => o.id === templateId);

  if (!model) {
    console.log(`TEMPLATE_CONFIG中找不到模板id为 ${templateId} 的模板`);
    return null;
  }

  // 替换模板
  targetValue = model.desc.replace(/\{{2}(.*?)\.DATA}{2}/gm, (paramText) => {
    // 提取变量
    const param = paramText.match(/\{{2}(.*?)\.DATA}{2}/);
    const replaceText = wxTemplateData[param[1]];
    return replaceText && (replaceText.value || replaceText.value === 0)
      ? replaceText.value
      : "";
  });
  // 清除每行前的空格
  targetValue = targetValue.replace(/(?<=\\n|^) +/gm, "");

  // urlencode
  if (urlencode) {
    // json序列化
    targetValue = JSON.stringify(targetValue);
    // 去除前后双引号
    targetValue = targetValue.substring(1, targetValue.length - 1);
    // urlencode
    model.title = encodeURI(model.title);
    targetValue = encodeURI(targetValue);
  }

  // \n转换成 %0A
  if (turnToOA) {
    targetValue = targetValue.replace(/%5Cn+/g, "%0A%0A");
  }

  return {
    title: model.title,
    desc: targetValue,
  };
};

/**
 * 获取处理好的回执消息
 * @param {*} messageReply
 * @returns
 */
// istanbul ignore next
export const getCallbackTemplateParams = (messageReply) => {
  const postTimeZone = timeZone();
  const postTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  return [
    {
      name: toLowerLine("postTimeZone"),
      value: postTimeZone,
      color: getColor(),
    },
    { name: toLowerLine("postTime"), value: postTime, color: getColor() },
    {
      name: toLowerLine("needPostNum"),
      value: messageReply.needPostNum,
      color: getColor(),
    },
    {
      name: toLowerLine("successPostNum"),
      value: messageReply.successPostNum,
      color: getColor(),
    },
    {
      name: toLowerLine("failPostNum"),
      value: messageReply.failPostNum,
      color: getColor(),
    },
    {
      name: toLowerLine("successPostIds"),
      value: messageReply.successPostIds,
      color: getColor(),
    },
    {
      name: toLowerLine("failPostIds"),
      value: messageReply.failPostIds,
      color: getColor(),
    },
  ];
};

// 组装openUrl
const assembleOpenUrl = () => "";

/**
 * 使用pushDeer
 * @param user
 * @param templateId
 * @param wxTemplateData
 * @returns {Promise<{success: boolean, name}>}
 */
const sendMessageByPushDeer = async (user, templateId, wxTemplateData) => {
  // 模板拼装
  const modelData = model2Data(templateId, wxTemplateData, false, false);
  if (!modelData) {
    return {
      name: user.name,
      success: false,
    };
  }

  const url = "https://api2.pushdeer.com/message/push";

  // 发送消息
  const res = await axios
    .post(
      url,
      {
        pushkey: user.id,
        text: modelData.title,
        desp: modelData.desc,
        type: "markdown",
      },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
        },
      }
    )
    .catch((err) => err);

  if (res.data && res.data.code === 0) {
    console.log(`${user.name}: 推送消息成功`);
    return {
      name: user.name,
      success: true,
    };
  }
  console.error(`${user.name}: 推送消息失败：${getErrorSummary(res)}`);
  return {
    name: user.name,
    success: false,
  };
};

/**
 * 使用pushplus
 * @param user
 * @param templateId
 * @param wxTemplateData
 * @returns {Promise<{success: boolean, name}>}
 */
const sendMessageByPushPlus = async (user, templateId, wxTemplateData) => {
  // 模板拼装
  const modelData = model2Data(templateId, wxTemplateData, false, false);
  if (!modelData) {
    return {
      name: user.name,
      success: false,
    };
  }

  const url = "http://www.pushplus.plus/send";
  // 发送消息
  const res = await axios
    .post(
      url,
      {
        token: user.id,
        title: modelData.title,
        content: modelData.desc,
        template: "markdown",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .catch((err) => err);

  if (res.data && res.data.code === 200) {
    console.log(`${user.name}: 推送消息成功`);
    return {
      name: user.name,
      success: true,
    };
  }
  console.error(`${user.name}: 推送消息失败：${getErrorSummary(res)}`);
  return {
    name: user.name,
    success: false,
  };
};

/**
 * 使用server-chan
 * @param user
 * @param templateId
 * @param wxTemplateData
 * @returns {Promise<{success: boolean, name}>}
 */
const sendMessageByServerChan = async (user, templateId, wxTemplateData) => {
  // 模板拼装
  const modelData = model2Data(templateId, wxTemplateData, false, false);
  if (!modelData) {
    return {
      name: user.name,
      success: false,
    };
  }

  const url = `https://sctapi.ftqq.com/${user.id}.send`;
  // 发送消息
  const res = await axios
    .post(url, {
      title: modelData.title,
      desp: modelData.desc,
    })
    .catch((err) => err);

  if (res.data && res.data.code === 0) {
    console.log(`${user.name}: 推送消息成功`);
    return {
      name: user.name,
      success: true,
    };
  }
  console.error(`${user.name}: 推送消息失败：${getErrorSummary(res)}`);
  return {
    name: user.name,
    success: false,
  };
};

/**
 * 使用wechat-test
 * @param user
 * @param templateId
 * @param wxTemplateData
 * @returns {Promise<{success: boolean, name}>}
 */
const sendMessageByWeChatTest = async (user, templateId, wxTemplateData) => {
  let accessToken = null;

  if (RUN_TIME_STORAGE.accessToken) {
    console.log("获取了相同的数据，读取缓存 >>> accessToken");
    accessToken = RUN_TIME_STORAGE.accessToken;
  } else {
    accessToken = await getAccessToken();
    RUN_TIME_STORAGE.accessToken = accessToken;
  }

  if (!accessToken) {
    return {
      name: user.name,
      success: false,
    };
  }

  const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
  const data = {
    touser: user.id,
    template_id: templateId,
    url: assembleOpenUrl(),
    topcolor: "#FF0000",
    data: wxTemplateData,
  };

  // 发送消息
  const res = await axios
    .post(url, data, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      },
    })
    .catch((err) => err);

  if (res.data && res.data.errcode === 0) {
    console.log(`${user.name}: 推送消息成功`);
    return {
      name: user.name,
      success: true,
    };
  }

  if (res.data && res.data.errcode === 40003) {
    console.error(
      `${user.name}: 推送消息失败! id填写不正确！应该填用户扫码后生成的id！要么就是填错了！请检查配置文件！`
    );
  } else if (res.data && res.data.errcode === 40036) {
    console.error(
      `${user.name}: 推送消息失败! 模板id填写不正确！应该填模板id！要么就是填错了！请检查配置文件！`
    );
  } else {
    console.error(`${user.name}: 推送消息失败：${getErrorSummary(res)}`);
  }

  return {
    name: user.name,
    success: false,
  };
};

/**
 * 执行发送消息
 * @param templateId
 * @param user
 * @param params
 * @param usePassage
 * @returns {Promise<{success: boolean, name}>}
 */
export const sendMessage = async (templateId, user, params, usePassage) => {
  const wxTemplateData = {};
  if (Object.prototype.toString.call(params) === "[object Array]") {
    params.forEach((item) => {
      if (item && item.name) {
        wxTemplateData[item.name] = {
          value: item.value,
          color: item.color,
        };
      }
    });
  }

  if (usePassage === "push-deer") {
    console.log("使用push-deer推送");
    return sendMessageByPushDeer(user, templateId, wxTemplateData);
  }
  if (usePassage === "server-chan") {
    console.log("使用server-chan推送");
    return sendMessageByServerChan(user, templateId, wxTemplateData);
  }
  if (usePassage === "push-plus") {
    console.log("使用push-plus推送");
    return sendMessageByPushPlus(user, templateId, wxTemplateData);
  }

  console.log("使用微信测试号推送");
  return sendMessageByWeChatTest(user, templateId, wxTemplateData);
};

/**
 * 推送消息, 进行成功失败统计
 * @param users
 * @param templateId
 * @param params
 * @param usePassage
 * @returns {Promise<{failPostIds: (string|string), failPostNum: number, successPostIds: (string|string), needPostNum: *, successPostNum: number}>}
 */
export const sendMessageReply = async (
  users,
  templateId = null,
  params = null,
  usePassage = null
) => {
  const needPostNum = users.length;
  let successPostNum = 0;
  let failPostNum = 0;
  const successPostIds = [];
  const failPostIds = [];

  const maxPushOneMinute =
    typeof config.MAX_PUSH_ONE_MINUTE === "number" &&
    config.MAX_PUSH_ONE_MINUTE > 0
      ? config.MAX_PUSH_ONE_MINUTE
      : 5;
  for (const user of users) {
    if (RUN_TIME_STORAGE.pushNum >= maxPushOneMinute) {
      RUN_TIME_STORAGE.pushNum = 0;
      // 请求超过N个则等待60秒再发送
      console.log(
        `单次脚本已发送 ${maxPushOneMinute} 条消息，为避免推送服务器识别为恶意推送，脚本将休眠 ${
          config.SLEEP_TIME ? config.SLEEP_TIME / 1000 : 65
        } 秒。休眠结束后将自动推送剩下的消息。`
      );
      await sleep(config.SLEEP_TIME || 65000);
    }
    const result = await sendMessage(
      templateId || user.useTemplateId,
      user,
      params || user.wxTemplateParams,
      usePassage
    );
    if (RUN_TIME_STORAGE.pushNum) {
      RUN_TIME_STORAGE.pushNum += 1;
    } else {
      RUN_TIME_STORAGE.pushNum = 1;
    }

    if (result.success) {
      successPostNum += 1;
      successPostIds.push(result.name);
    } else {
      failPostNum += 1;
      failPostIds.push(result.name);
    }
  }

  return {
    needPostNum,
    successPostNum,
    failPostNum,
    successPostIds: successPostIds.length ? successPostIds.join(",") : "无",
    failPostIds: failPostIds.length ? failPostIds.join(",") : "无",
  };
};
