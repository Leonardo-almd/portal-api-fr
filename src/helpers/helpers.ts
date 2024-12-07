/**
 * Função que aplica trim() em todas as propriedades string de um objeto.
 * @param obj - O objeto a ser processado
 * @returns Um novo objeto com todas as strings sem espaços extras
 */
export function trimObjectStrings<T>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
      ])
    ) as T;
  };

  export function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  export function formatCNPJ(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  export function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
  