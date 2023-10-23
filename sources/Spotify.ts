import { fetch, request } from 'undici';

type Config = {
    clientId: string;
    clientSecret: string;
    market?: string;
}

export class Spotify {
    public static readonly REGEX = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album|artist)[\/:]([A-Za-z0-9]+)/;

    public static readonly BASE_URL = "https://api.spotify.com/v1"; 

    private readonly auth: string;

    private readonly market: string;
    private token: string;

    private expires: number;

    constructor(config?: Config) {

        if (config?.clientId && config?.clientSecret) {
            this.auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        } else {
            this.auth = '';
        }
        this.market = config?.market ?? 'US';
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
        const res = await fetch(`${Spotify.BASE_URL}${entrypoint}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.token}`
            }
        });
        const data = await res.json();
        return data;
    }
    public async getTrack(url: string): Promise<any> {
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
