/**
 * Utilitários de formatação, normalização (RN02) e cálculos monetários em centavos (Seção 7)
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brlCompactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/**
 * Converte valor inteiro em centavos para moeda BRL (R$ 12.750,00)
 */
export function formatCentsToBRL(cents: number, compact = false): string {
  const value = (cents || 0) / 100;
  return compact ? brlCompactFormatter.format(value) : brlFormatter.format(value);
}

/**
 * Converte string digitada pelo usuário (ex: "850.000,00" ou "850000") para centavos inteiros
 */
export function parseBRLToCents(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  const clean = input.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * RN02: Normaliza telefone mantendo apenas dígitos numéricos (ex: "(73) 99912-3456" -> "73999123456")
 */
export function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Formata telefone para exibição amigável (ex: "(73) 99912-3456")
 */
export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return phone;
}

/**
 * RN02: Normaliza e-mail (lowercase + trim)
 */
export function normalizeEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Formata data ISO para exibição em pt-BR
 */
export function formatDateTimeBR(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatDateBR(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'OPERATOR') return 'Operador';
  if (role === 'BROKER') return 'Corretor';
  return role;
}

/**
 * Aplica máscara de CNPJ padrão: 00.000.000/0000-00
 * Limita a 14 dígitos e formata progressivamente conforme a digitação
 */
export function formatCNPJ(value?: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Formata números inteiros com separador de milhar pt-BR (ponto a cada três dígitos):
 * Ex: "500000" -> "500.000", "1250000" -> "1.250.000"
 */
export function formatThousands(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const cleanDigits = digits.replace(/^0+(?=\d)/, '');
  return cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

