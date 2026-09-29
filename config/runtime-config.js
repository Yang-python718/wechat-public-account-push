const DEFAULT_BAIDU_WEATHER_API_KEY = 'xisYeWC0RKYZtRKwdLrHYkqK9nyxIEPn'

const getRuntimeConfig = () => ({
  appMode: process.env.APP_MODE,
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET,
  baiduWeatherApiKey: process.env.BAIDU_WEATHER_API_KEY || DEFAULT_BAIDU_WEATHER_API_KEY,
  requestTimeoutMs: 10000,
})

export default getRuntimeConfig
