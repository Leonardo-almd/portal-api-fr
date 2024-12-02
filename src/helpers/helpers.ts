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
  }
  