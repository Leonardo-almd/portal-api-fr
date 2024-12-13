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

  export function formatDate(dateInput: string | Date): string {
    let year: string, month: string, day: string;
  
    if (dateInput instanceof Date) {
      year = dateInput.getFullYear().toString();
      month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
      day = dateInput.getDate().toString().padStart(2, '0');
    } else {
      [year, month, day] = dateInput.split('-');
    }
  
    return `${day}/${month}/${year}`;
  }

  export function formatCNPJ(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  export function formatPhoneNumber(phone: string): string {
    const regex = /^55(\d{2})(\d{5})(\d{4})$/;
  
    if (!regex.test(phone)) {
      return 'Número inválido';
    }
  
    return phone.replace(regex, '+55 ($1) $2-$3');
  }

  export function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
  