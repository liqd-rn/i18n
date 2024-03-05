import { State } from '@liqd-rn/state';
import { Platform, NativeModules } from 'react-native';

const systemLocale = () => Platform.OS === 'ios' ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0] : NativeModules.I18nManager.localeIdentifier;
const defaultLocale = () => systemLocale().replace(/[-_].*$/,'').toLowerCase();
const defaultCountry = () => systemLocale().match(/^[a-zA-Z]+[-_](?<country>[a-zA-Z]+)$/,'')?.groups?.country?.toUpperCase?.() || '';

type Dictionary = Record<string, string | string []>;
type DictionaryGetter = ( locale: string, country: string ) => Dictionary | Promise<Dictionary>;

//@ts-ignore
const getPath = ( obj, path ) =>
{
    if( path )
    {
        for( let key of path.split(/\./g) )
        {
            if(( obj = obj[key] ) === undefined ){ break; }
        }
    }

	return obj;
}

//@ts-ignore
const resolveVariables = ( str, scopes, transformation ) =>
{
	//@ts-ignore
	let missing = new Set(), resolved = new Set(), value = str.replace(/\{([^%]+)(%([^}]+)){0,1}\}/g, ( match, path, _, modifiers ) =>
	{
		let value;

		for( let scope of scopes )
		{
			if(( value = getPath( scope, path )) !== undefined )
			{
				resolved.add( path );

				return transformation ? transformation( value, modifiers ) : value;
			}
		}

		missing.add( path );

		return path;
	});

	return { missing: missing.size, resolved: resolved.size, value };
}

export default class I18n
{
    private static current = { locale: defaultLocale(), country: defaultCountry() };
    private static instances = new Map<string, I18n>();

    public static get locale(){ return [ I18n.current.locale, I18n.current.country ].filter( Boolean ).join( '-' )}

    public static set locale( value: string )
    {
        const [ locale, country ] = value.split( /[-_]/ );

        I18n.current.locale = ( locale || defaultLocale()).toLowerCase();
        I18n.current.country = ( country || defaultCountry()).toUpperCase();

        for( let instance of I18n.instances.values() )
        {
            instance.reload();
        }
    }

    public static init( name: string, getter: DictionaryGetter ): I18n
    {
        let instance = I18n.instances.get( name );

        if( instance )
        {
            if( instance.getter !== getter )
            {
                console.warn( `I18n dictionary with name "${ name }" already exists` );

                instance.getter = getter;
                instance.reload();
            }
        }
        else
        {
            I18n.instances.set( name, instance = new I18n( getter ) );
        }

        return instance;
    }

    public static use( name: string ): I18n
    {
        return I18n.$( name ).use();
    }

    public static $( name: string ): I18n
    {
        let instance = I18n.instances.get( name );

        if( !instance )
        {
            I18n.instances.set( name, instance = new I18n(() => ({})));
        }

        return instance;
    }

    public static ready()
    {
        return Promise.all( Array.from( I18n.instances.values(), instance => instance.ready()));
    }

    private dictionary: Dictionary = {};
    private loading: Promise<void> | undefined;
    private state = new State<I18n>();
    
    private constructor( private getter: DictionaryGetter )
    {
        this.state.set( this, { cache: true, force: true });

        this.reload();
    }

    public use(): I18n
    {
        return this.state.use()!;
    }

    public async ready(): Promise<void>
    {
        await this.loading;
    }

    public async reload()
    {
        const { locale, country } = I18n.current;

        /*try
        {
            //@ts-ignore
            if( !( this.getter instanceof AsyncFunction ))
            {
                this.dictionary = this.getter( locale, country ) as Dictionary;
            }

            return;
        }
        catch(e){}*/
        
        await ( this.loading = new Promise<void>( async( resolve ) => 
        {
            const dictionary = await this.getter( locale, country );

            if( locale === I18n.current.locale && country === I18n.current.country )
            {
                this.dictionary = dictionary;
                this.state.set( this, { cache: true, force: true });
            }

            resolve();
        }));
    }

    public get( ...args: ( string | Record<string, any>)[] ): string
    {
        const keys = ( args.length === 1 ? [ args[0]] : args.filter( a => typeof a === 'string' )) as string[];
        const variables = ( args.length === 1 ? [] : args.filter( a => typeof a !== 'string' )) as Record<string, any>[];

        let value = this.dictionary[ keys[0] ];

        if( Array.isArray( value ))
        {
            value = value[ 0 ];
        }

        if( value && variables.length )
        {
            value = resolveVariables( value, variables, undefined ).value as string;
        }

        return value || keys[0];

        //return value.replace( /%(\d+)/g, ( match, index ) => args[ index ] || match );
    }
}