import { request } from 'undici';

type Config = {
    clientId: string;
    clientSecret: string;
}


export class Spotify {
    public static readonly REGEX = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album|artist)[\/:]([A-Za-z0-9]+)/;

    public static readonly BASE_URL = "https://api.spotify.com/v1"; 

    private readonly auth: string;

    public readonly market: string;
    private token: string;

    private expires: number;

    constructor(config?: Config[], market?: string) {

        if (config) {
            if (!Array.isArray(config)) throw new TypeError('config must be an array');
            if (!config.length) throw new Error('config must not be empty');
            if (!config.every(c => c.clientId && c.clientSecret)) throw new Error('config must have clientId and clientSecret');
            const random = Math.floor(Math.random() * config.length);
            this.auth = Buffer.from(`${config[random].clientId}:${config[random].clientSecret}`).toString('base64');
        } else {
            this.auth = '';
        }
        this.market = market || 'US';
        this.token = '';
        this.expires = 0;
    }
    private async renewToken() {
        if (this.auth) {
            await this.getToken();
        } else {
            await this.getAnonymousToken();
        }
    }
    public async makeRequest(entrypoint: string): Promise<any> {
        if (!this.token || this.expires === 0 || Date.now() > this.expires) await this.renewToken();
        const res = await request(`${Spotify.BASE_URL}${entrypoint}`, {
            headers: {
                "Authorization": this.token
            }
        }).then(r => r.body.json()) as any;
        if (res.error) {
            throw new Error(res.error.message);
        }
        return res;
    }
    public async getTrack(url: string): Promise<any> {
        if (!url) throw new Error('spotify url is undefined');
        const [, type, id] = Spotify.REGEX.exec(url) as RegExpExecArray;
        const match = url.match(Spotify.REGEX);
        if (match) {
            const data = await this.makeRequest(`/${type}s/${id}`);
            return data;
        } else {
            return null;
        }
    }

    private async getAnonymousToken() {
        const { accessToken, accessTokenExpirationTimestampMs } = await request('https://open.spotify.com/get_access_token?reason=transport&productType=embed', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36'
            }
        }).then(r => r.body.json() as Promise<any>);

        if (!accessToken) throw new Error('Failed to get anonymous token on Spotify.');

        this.token = `Bearer ${accessToken}`;
        this.expires = accessTokenExpirationTimestampMs - 5000;
    }

    private async getToken() {
        const {
            token_type,
            access_token,
            expires_in
        } = await request('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${this.auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(r => r.body.json() as Promise<any>);
        this.token = `${token_type} ${access_token}`;
        this.expires = Date.now() + expires_in * 1000;
    }
}
