export const isValidEmail = (value: string) =>
  /^\S+@\S+\.\S+$/.test(value.trim().toLowerCase());

export const sanitizeCurrencyInput = (value: string) => value.replace(/[^\d,.-]/g, '').replace(',', '.');

export const parseCurrencyToNumber = (value: string) => {
  const sanitized = sanitizeCurrencyInput(value);
  const parsed = Number.parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const maskCurrency = (value: string | number) => {
  const numericValue =
    typeof value === 'number' ? value : Number.parseInt(value.replace(/\D/g, ''), 10) || 0;
  const formatted = (numericValue / 100).toFixed(2).replace('.', ',');
  return `R$ ${formatted}`;
};
