import { IntlOptions } from '../types';

export type NumberOptions = IntlOptions &
{
    precision?  : number
}

export function number( value: number, options: NumberOptions ): string
{
    return new Intl.NumberFormat( options.locale, { minimumFractionDigits: options.precision, maximumFractionDigits: options.precision }).format( value );
}

export function ordinal( value: number, options: NumberOptions ): string
{
    if([ 'en' ].includes( options.locale ))
    {
        return `${value}${ value % 100 >= 11 && value % 100 <= 13 ? 'th' : ([ 'th', 'st', 'nd', 'rd' ][ value % 10 ] || 'th')}`;
    }
    else if([ 'sk', 'cs' ].includes( options.locale ))
    {
        return `${value}.`;
    }

    return `${value}`;
}