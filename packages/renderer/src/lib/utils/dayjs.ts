import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isBetween from 'dayjs/plugin/isBetween'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// 注册所需插件
dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)
dayjs.extend(weekOfYear)

// 设置全局语言
dayjs.locale('zh-cn')

// 导出配置好的 dayjs
export default dayjs

// 可选：导出一些常用的格式化函数
export const formatDate = (date: dayjs.ConfigType, format = 'YYYY年MM月DD日') => {
    return dayjs(date).format(format)
}

export const formatDateTime = (date: dayjs.ConfigType) => {
    return dayjs(date).format('YYYY年MM月DD日 HH:mm:ss')
}

export const formatRelativeTime = (date: dayjs.ConfigType) => {
    return dayjs(date).fromNow()
}

export const getWeekday = (date: dayjs.ConfigType) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return weekdays[dayjs(date).day()]
}