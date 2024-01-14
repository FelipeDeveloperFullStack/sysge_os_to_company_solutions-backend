export default function (value) {
  return value ? String(value).replace(/[^0-9]/g, '') : ''
}
