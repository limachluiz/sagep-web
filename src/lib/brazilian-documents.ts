export function cnpjDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 14)
}

export function formatCnpj(value: string | null | undefined) {
  const digits = cnpjDigits(value)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\/\d{4})(\d)/, "$1-$2")
}
