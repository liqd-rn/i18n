import { IntlOptions } from '../types';

type CurrencyOptions = IntlOptions &
{
    currency    : string
    precision?  : number
}


export function currency( value: number, options: CurrencyOptions )
{
    const { currency, precision = 0 } = options;

    return new Intl.NumberFormat( options.locale, { style: 'currency', currency, minimumFractionDigits: precision }).format( value );
}