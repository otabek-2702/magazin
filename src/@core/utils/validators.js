import { isEmpty, isEmptyArray, isNullOrUndefined } from './index'

// 👉 Валидатор обязательного поля
export const requiredValidator = value => {
  if (isNullOrUndefined(value) || isEmptyArray(value) || value === false)
    return 'Это поле обязательно для заполнения'
  
  return !!String(value).trim().length || 'Это поле обязательно для заполнения'
}

// 👉 Валидатор электронной почты
export const emailValidator = value => {
  if (isEmpty(value))
    return true
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (Array.isArray(value))
    return value.every(val => re.test(String(val))) || 'Поле Email должно содержать действительный адрес электронной почты'
  
  return re.test(String(value)) || 'Поле Email должно содержать действительный адрес электронной почты'
}

// 👉 Валидатор пароля
export const passwordValidator = password => {
  const regExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/
  const validPassword = regExp.test(password)
  
  return (
    validPassword ||
        'Поле должно содержать как минимум одну заглавную букву, одну строчную букву, один специальный символ и одну цифру, а также быть не менее 8 символов в длину')
}

// 👉 Валидатор подтверждения пароля
export const confirmedValidator = (value, target) => value === target || 'Подтверждение пароля не совпадает'

// 👉 Валидатор диапазона
export const betweenValidator = (value, min, max) => {
  const valueAsNumber = Number(value)
  
  return (Number(min) <= valueAsNumber && Number(max) >= valueAsNumber) || `Введите число между ${min} и ${max}`
}

// 👉 Валидатор целого числа
export const integerValidator = value => {
  if (isEmpty(value))
    return true
  if (Array.isArray(value))
    return value.every(val => /^-?[0-9]+$/.test(String(val))) || 'Это поле должно быть целым числом'
  
  return /^-?[0-9]+$/.test(String(value)) || 'Это поле должно быть целым числом'
}

// 👉 Валидатор регулярного выражения
export const regexValidator = (value, regex) => {
  if (isEmpty(value))
    return true
  let regeX = regex
  if (typeof regeX === 'string')
    regeX = new RegExp(regeX)
  if (Array.isArray(value))
    return value.every(val => regexValidator(val, regeX))
  
  return regeX.test(String(value)) || 'Формат поля Regex недействителен'
}

// 👉 Валидатор только буквенных символов
export const alphaValidator = value => {
  if (isEmpty(value))
    return true
  
  return /^[A-Z]*$/i.test(String(value)) || 'Поле Alpha может содержать только буквенные символы'
}

// 👉 Валидатор URL
export const urlValidator = value => {
  if (isEmpty(value))
    return true
  const re = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/
  
  return re.test(String(value)) || 'URL недействителен'
}

// 👉 Валидатор длины
export const lengthValidator = (value, length) => {
  if (isEmpty(value))
    return true
  
  return String(value).length === length || `Поле должно содержать как минимум ${length} символов`
}

// 👉 Валидатор буквенно-цифровых символов и дефиса
export const alphaDashValidator = value => {
  if (isEmpty(value))
    return true
  const valueAsString = String(value)
  
  return /^[0-9A-Z_-]*$/i.test(valueAsString) || 'Не все символы допустимы'
}