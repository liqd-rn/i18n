import { IntlPublicOptions } from '../types';
import { currency, CurrencyOptions } from './currency';
import { duration, countdown, DurationOptions } from './time';

export default class Format
{
    public readonly currency: ( value: number, options: IntlPublicOptions<CurrencyOptions> ) => string;
    public readonly duration: ( date: Date, options: IntlPublicOptions<DurationOptions> ) => string;
    public readonly countdown: ( date: Date, options: IntlPublicOptions<DurationOptions> ) => string;

    constructor( locale: string, country: string )
    {
        this.currency = ( value, options ) => currency( value, { locale, country, ...options });
        this.duration = ( value, options ) => duration( value, { locale, country, ...options });
        this.countdown = ( value, options ) => countdown( value, { locale, country, ...options });
    }
}