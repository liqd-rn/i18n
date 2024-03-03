import { Platform, NativeModules } from 'react-native';
import { State } from '@liqd-rn/state';

const defaultLocale = () => ( Platform.OS === 'ios' ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0] : NativeModules.I18nManager.localeIdentifier ).replace(/[-_].*$/,'').toLowerCase();
const defaultCountry = () => ( Platform.OS === 'ios' ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0] : NativeModules.I18nManager.localeIdentifier ).match(/^[a-zA-Z]+[-_](?<country>[a-zA-Z]+)$/,'')?.groups?.country?.toUpperCase?.() || '';

type Dictionary = Record<string, string | string []>;
type DictionaryGetter = ( locale: string, country: string ) => Dictionary | Promise<Dictionary>;

export default class I18n
{
    private static current = { locale: defaultLocale(), country: defaultCountry() };
    private static instances = new Map<string, I18n>();

    public static get locale(){ return [ I18n.current.locale, I18n.current.country ].filter( Boolean ).join( '-' )}

    public static set locale( value: string )
    {
        const [ locale, country ] = value.split( /[-_]/ );

        I18n.current.locale = ( locale || defaultLocale()).toLowerCase();
        I18n.current.country = ( country || ( locale ? defaultCountry() : '' )).toUpperCase();

        for( let instance of I18n.instances.values() )
        {
            instance.reload();
        }
    }

    public static init( name: string, getter: DictionaryGetter ): I18n
    {
        if( I18n.instances.has( name )){ throw new Error( `I18n dictionary with name "${ name }" already exists` )}

        const instance = new I18n( getter );

        I18n.instances.set( name, instance );

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
    private state = new State<{ i18n: I18n }>();
    
    private constructor( private getter: DictionaryGetter )
    {
        this.state.set({ i18n: this }, { cache: true, force: true });

        this.reload();
    }

    public use(): I18n
    {
        //@ts-ignore
        return this.state.use()!.i18n;
    }

    public async ready(): Promise<void>
    {
        await this.loading;
    }

    public async reload()
    {
        try
        {
            //@ts-ignore
            if( !( this.getter instanceof AsyncFunction ))
            {
                this.dictionary = this.getter( I18n.current.locale, I18n.current.country ) as Dictionary;
            }

            return;
        }
        catch(e){}
        
        await ( this.loading = new Promise<void>( async( resolve ) => 
        {
            this.dictionary = await this.getter( I18n.current.locale, I18n.current.country );

            this.state.set({ i18n: this }, { cache: true, force: true });

            resolve();
        }));
    }

    public get( ...args: ( string | Record<string, any>)[] ): string
    {
        const keys = args.filter( a => typeof a === 'string' ) as string[];
        //const variables = args.filter( a => typeof a !== 'string' ) as Record<string, any>[];

        let value = this.dictionary[ keys[0] ] || keys[0];

        if( Array.isArray( value ))
        {
            value = value[ 0 ];
        }

        return value;

        //return value.replace( /%(\d+)/g, ( match, index ) => args[ index ] || match );
    }
}