import { IntlOptions } from '../types';

export type CurrencyOptions = IntlOptions &
{
    currency    : string
    precision?  : number
}

export function currency( value: number, options: CurrencyOptions )
{
    const { currency, precision } = options;

    let formatted = new Intl.NumberFormat( options.locale, { style: 'currency', currency, minimumFractionDigits: precision ?? 2, maximumFractionDigits: precision ?? 2 }).format( value );

    ( precision === undefined ) && ( formatted = formatted.replace( /([,.]00)([^0-9]*)$/, '$2' ));

    return formatted;
}