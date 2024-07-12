import { ElNotification } from 'element-plus'

export const success = (title,msg) => {
  ElNotification({
    title: title,
    message: msg,
    type: 'success',
  })
}

export const warning = (title,msg) => {
  ElNotification({
    title: title,
    message: msg,
    type: 'warning',
  })
}

export const info = (title,msg) => {
  ElNotification({
    title: title,
    message: msg,
    type: 'info',
  })
}

export const error = (title,msg) => {
  ElNotification({
    title: title,
    message: msg,
    type: 'error',
  })
}