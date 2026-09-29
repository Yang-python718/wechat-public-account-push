import schedule from 'node-schedule'
import dayjs from 'dayjs'
import {
  sendMessageReply,
  getAggregatedData,
  getCallbackTemplateParams,
} from './src/services/index.js'
import config from './config/exp-config.js'
import cornTime from './config/server-config.js'
import getRuntimeConfig from './config/runtime-config.js'
import mainForTest from './main-for-test.js'
import { RUN_TIME_STORAGE } from './src/store/index.js'

export default async function mainForProd() {
  console.log(`\n推送任务开始：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`)
  const aggregatedData = await getAggregatedData()
  const {
    needPostNum,
    successPostNum,
    failPostNum,
    successPostIds,
    failPostIds,
  } = await sendMessageReply(aggregatedData, null, null, config.USE_PASSAGE)

  // 获取回执信息
  const callbackTemplateParams = getCallbackTemplateParams({
    needPostNum,
    successPostNum,
    failPostNum,
    successPostIds,
    failPostIds,
  })
  // 发送回执
  if (config.CALLBACK_TEMPLATE_ID) {
    console.log('推送完成，发送回执通知')
    await sendMessageReply(config.CALLBACK_USERS, config.CALLBACK_TEMPLATE_ID, callbackTemplateParams, config.USE_PASSAGE)
  }

  console.log(`推送任务结束：成功 ${successPostNum}/${needPostNum}，失败 ${failPostNum}`)

  // 释放运行时临时存储的数据
  Object.keys(RUN_TIME_STORAGE).forEach((o) => {
    RUN_TIME_STORAGE[o] = null
  })
}

const main = () => {
  const { appMode } = getRuntimeConfig()

  if (appMode === 'params-log') {
    mainForTest()
  } else if (appMode === 'server') {
    console.log(`定时推送服务已启动，计划：${cornTime}`)
    schedule.scheduleJob(cornTime, () => {
      mainForProd()
    })
  } else if (appMode === 'prod') {
    mainForProd()
  }
}

main()
