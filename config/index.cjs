/* eslint-disable */

/**
 * 此项目配置为方便新人使用，已缩减至最简配置。
 * 如若想使用更多功能，请查考文档中的 【3. config参数说明】 
 * 自行添加属性，以支持更多个性化功能
 */
const USER_CONFIG = {

  // 使用微信测试号：公众号APP_ID
  APP_ID: 'wx62776fa7cd7821c7',

  // 使用微信测试号：公众号APP_SECRET
  APP_SECRET: '30c98140187372a7d9ee9170a4f703bb',

  PROVINCE: '北京',
  CITY: '北京',
SWITCH: {
    /** 每日天气 */
    // 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    weather: true,

    /** 节假日 */
    // 下一休息日综合提醒, 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    holidaytts: true,

    /** 每日N句 */
    // 金山每日一句, 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    CIBA: true,
    
    // 每日一言, 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    oneTalk: true,
    
    // 土味情话(彩虹屁), 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    earthyLoveWords: true,
    
    // 朋友圈文案, 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    momentCopyrighting: true,
    
    // 毒鸡汤, 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    poisonChickenSoup: true,
    
    // 古诗古文, 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    poetry: false,

    /** 星座运势 */
    // 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    horoscope: true,
  
    /** 生日消息和节日消息 */
    // 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    birthdayMessage: true,
  
    /** 学生课表 */
    // 填 false 则不使用，按需关闭不使用的功能可以提高运行速度
    courseSchedule: false,
  },
  /** 是否给文字设置多彩颜色, 和emoji不兼容 */
  // 如果您使用了微信测试号的模板中含有emoji表情，请填 false
  IS_SHOW_COLOR: false,
  USERS: [
    {
      // 想要发送的人的名字
      name: '🎗小花宝宝',
      // 使用微信测试号：扫码关注你的微信测试号后生成的一段字符串，在测试号后台能看到
      id: 'ohVwP60wV2FxuMvDeNYHTZLKXXww',
      // 使用微信测试号：你想对他发送的模板消息的模板ID
      // useTemplateId: 'xw44zxCr0ou-BiPrPp8LfimrjPNtlvV1IaR2IRlwYwE',
      useTemplateId: 'pmIX26Ny9rHdiEDeI4C3ugAdq7GT4MvsFfxccOxv1ww',
      // 新历生日, 仅用作获取星座运势, 格式必须为MM-DD
      horoscopeDate: '10-11',
      // 获取什么时候的星座运势，可选：['今日', '明日', '本周', '本月', '今年'], 留空则随机
      horoscopeDateType: '今日',
      festivals: [
        // 注意：此条配置日期为阴历日期，因为`type`中 “生日” 之前有 * 符号
        {
          type: '*生日', name: '宝宝', year: '1996', date: '09-03',
        },
        // // 注意：此条配置日期为阳历日期，因为`type`中 “生日” 之前没有 * 符号
        // {
        //   type: '生日', name: '宝宝', year: '1996', date: '10-11',
        // },
        {
          type: '节日', name: '恋爱纪念日', year: '2024', date: '01-01',
        },
        {
          type:'节日',name:'领证纪念日',year:'2025',date:'10-25',
        }
      ],
      // 我们在一起已经有xxxx天了的配置
      customizedDateList: [
        // 在一起的日子
        { keyword: 'love_day', date: '2024-01-01' },
      ],
    },
     {
      // 想要发送的人的名字
      name: '快乐lamb',
      // 使用微信测试号：扫码关注你的微信测试号后生成的一段字符串，在测试号后台能看到
      id: 'ohVwP6yA-1kg0nUvKYVx-uHCRqdc',
      // 使用微信测试号：你想对他发送的模板消息的模板ID
      useTemplateId: 'pmIX26Ny9rHdiEDeI4C3ugAdq7GT4MvsFfxccOxv1ww',
      // 新历生日, 仅用作获取星座运势, 格式必须为MM-DD
      horoscopeDate: '07-18',
      // 获取什么时候的星座运势，可选：['今日', '明日', '本周', '本月', '今年'], 留空则随机
      horoscopeDateType: '今日',
      festivals: [
        // 注意：此条配置日期为阴历日期，因为`type`中 “生日” 之前有 * 符号
        {
          type: '*生日', name: '宝宝', year: '1996', date: '09-03',
        },
        // // 注意：此条配置日期为阳历日期，因为`type`中 “生日” 之前没有 * 符号
        // {
        //   type: '生日', name: '宝宝', year: '1996', date: '10-11',
        // },
        {
          type: '节日', name: '恋爱纪念日', year: '2024', date: '01-01',
        },
        {
          type:'节日',name:'领证纪念日',year:'2025',date:'10-25',
        }
      ],
      // 我们在一起已经有xxxx天了的配置
      customizedDateList: [
        // 在一起的日子
        { keyword: 'love_day', date: '2024-01-01' },
      ],
    },
  ],


  // 【推送完成提醒】模板id, 用来看自己有没有发送成功的那个模板
  CALLBACK_TEMPLATE_ID: 'TBHOWxjHFuLZifF3blFp4jId0WO-Fw7oO-gh0dUpolA',

  CALLBACK_USERS: [
    {
      name: '自己',
      // 使用微信测试号：自己的微信id，扫码关注你的微信测试号后生成的一段字符串，在测试号后台能看到
      id: 'ohVwP6yA-1kg0nUvKYVx-uHCRqdc',
    }
  ],

    /** 你可以在这里写超多的你想显示的内容了！
   * keyword是指暴露给测试号的模板字段，填什么就暴露什么, 请注意不要和README的出参表中的字段重复。
   * 比如：keyword: "lover_prattle" ，在测试号中就是 {{ lover_prattle.DATA }}
   * */
  SLOT_LIST: [
    // 这样配置的话，就会每次发送这句话
   // { keyword: 'encourage_oneself', contents: '你主要的问题在于读书太少而想得太多' },
    // 这样配置的话，就会每次随机选一句话发送
    {
      keyword: 'lover_prattle',
      contents: [
        '因为太喜欢你，所以看谁都像是情敌。',
        '申请成为你爱里的永久居民。',
        '遇见你，就好像捡到了100斤的运气',
        '听老婆的话，会发达！',
        '每天要充满Passion！！！',
        '不要凶小羊奥',
        '哈哈哈哈哈哈哈哈哈',
        '爱你到永远',
        '今日亲亲了没呀',
        '不要皱眉！',
        '上班就是牛马，下班才是生活'
      ],
    }
    // 你可以不断按格式往下增加
    // ...
  ],
}

module.exports = USER_CONFIG

