export type IntlOptions =
{
    locale  : string
    country?: string
}

export type IntlPublicOptions<T> = Omit<T, 'locale'> & { locale?: string }