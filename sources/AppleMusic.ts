import { request } from "undici";


type Config = {
    token: string;
    countryCode?: string
}

export class AppleMusic {
    public static readonly APPLE_MUSIC_REGEX = /^(?:https?:\/\/|)?(?:music\.)?apple\.com\/(?<storefront>[a-z]{2})\/(?<type>album|playlist|artist|music-video)(?:\/[^/]+)?\/(?<id>[^/?]+)(?:\?i=(?<albumtrackid>\d+))?/;
    private static readonly RENEW_URL = 'https://music.apple.com';
    private static readonly SCRIPTS_REGEX = /<script type="module" .+ src="(?<endpoint>\/assets\/index.+\.js)">/g;
    private static readonly TOKEN_REGEX = /const \w{2}="(?<token>ey[\w.-]+)"/;

    private static readonly USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36';

    private token: string | null;
    public countryCode: string = "us";
    private renewDate: number = 0;
    constructor(config: Config) {
        if (config.token) {
            this.token = config.token;
        } else {
            this.token = null;
        }
        if (config.countryCode) this.countryCode = config.countryCode;
    }

    private async makeRequest<T>(endpoint: string, storefront: string): Promise<any> {
        if (!this.token || this.renewDate === 0 || Date.now() > this.renewDate) await this.getAnonymousToken();

        const res = await request(`https://api.music.apple.com/v1/catalog/${storefront}/${endpoint}`, {
            headers: {
                'User-Agent': AppleMusic.USER_AGENT,
                Authorization: `Bearer ${this.token}`,
                'Origin': 'getAnonymousToken'
            }
        });
        if (res.statusCode === 200) {
            return res.body.json() as T;
        } else {
            return new Error(`Apple Music API returned ${await res.body.json()}`);
        }
    }
    private async getAnonymousToken() {
        const html: string = await request(AppleMusic.RENEW_URL + '/us/browse', {
            headers: {
                'User-Agent': AppleMusic.USER_AGENT
            },
        }).then(r => r.body.text());

        const scriptsMatch = [...html.matchAll(AppleMusic.SCRIPTS_REGEX)];

        if (!scriptsMatch.length) {
            throw new Error('Could not get Apple Music token scripts!');
        }
        for (const scriptMatch of scriptsMatch) {
            const script = await request(`${AppleMusic.RENEW_URL}${scriptMatch[1]}`, {
                headers: {
                    'User-Agent': AppleMusic.USER_AGENT
                }
            }).then(r => r.body.text());
            const tokenMatch = script.match(AppleMusic.TOKEN_REGEX);
            if (tokenMatch) {
                this.token = tokenMatch.groups?.['token'] ?? null;
                break;
            }
        }
        if (!this.token) {
            throw new Error('Could not get Apple Music token!');
        }
        this.renewDate = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString()).exp * 1000;
    }
    public async getTrack(url: string): Promise<any> {
        const appleMusicMatch = url.match(AppleMusic.APPLE_MUSIC_REGEX);
        if (!appleMusicMatch || !appleMusicMatch.groups) return null;
        const storefront = appleMusicMatch.groups['storefront'];
        switch (appleMusicMatch.groups['type']) {
            case 'music-video':
                return this.makeRequest<any>(`music-videos/${appleMusicMatch.groups['id']}`, storefront);
            case 'album':
                return this.makeRequest<any>(`albums/${appleMusicMatch.groups['id']}`, storefront);
            case 'playlist':
                return this.makeRequest<any>(`playlists/${appleMusicMatch.groups['id']}`, storefront);
            case 'artist':
                return this.makeRequest<any>(`artists/${appleMusicMatch.groups['id']}`, storefront);
            default:
                return null;
        }
    }
}
