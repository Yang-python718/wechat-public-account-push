import { getAggregatedData } from './src/services/index.js'

/**
 * 参数测试函数
 */
export default async function mainForTest() {
  const aggregatedData = await getAggregatedData()
  const fields = new Set()
  aggregatedData.forEach(({ wxTemplateParams }) => {
    Object.keys(wxTemplateParams || {}).forEach((field) => fields.add(field))
  })
  console.log(`共生成 ${aggregatedData.length} 组参数，字段：${[...fields].join(', ')}`)
}
