import { IntlOptions } from '../types';

export type DurationOptions = IntlOptions &
{
    precision?  : number
    resolution? : 'd' | 'h' | 'm' | 's' | 'ms',
    origin?     : Date
}

function formatDuration( duration: number, options: DurationOptions )
{
    //@ts-ignore
    const { precision = 2, resolution = 's' } = options; duration = Math.max( 0, duration );

    const [ d, h, m, s, ms ] =
    [
        Math.floor( duration / 1000 / 60 / 60 / 24 ),
        Math.floor(( duration / 1000 / 60 / 60 ) % 24 ),
        Math.floor(( duration / 1000 / 60 ) % 60 ),
        Math.floor(( duration / 1000 ) % 60 ),
        Math.floor( duration % 1000 )
    ];

    switch( resolution )
    {
        case 'd': return `${d}`;
        case 'h': return `${d}:${h}`;
        case 'm': return `${d}:${h}:${m}`;
        case 's': return `${d}:${h}:${m}:${s}`;
        case 'ms': return `${d}:${h}:${m}:${s}.${ms}`;
    }
}

export function duration( date: Date, options: DurationOptions )
{
    return formatDuration(( options.origin?.getTime() ?? Date.now() ) - date.getTime(), options );
}

export function countdown( date: Date, options: DurationOptions )
{
    return formatDuration( date.getTime() - ( options.origin?.getTime() ?? Date.now() ), options );
}