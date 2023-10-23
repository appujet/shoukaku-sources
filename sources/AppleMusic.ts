import { fetch } from "undici";


type Config = {
    token: string;
    countryCode?: string
}

export class AppleMusic {
    public static readonly BASE_URL = "https://api.music.apple.com/v1";
    public static readonly REGEX = /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w-.]+(\/)+[\w-.]+|[^&]+)\/([\w-.]+(\/)+[\w-.]+|[^&]+)/;
    public static readonly REGEX_SONG_ONLY = /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w.-]+(\/)+[\w.-]+|[^&]+)\/([\w.-]+(\/)+[\w.-]+|[^&]+)(\?|&)([^=]+)=([\w.-]+(\/)+[\w.-]+|[^&]+)/;
    private token: string | null;
    public countryCode: string = "us";
    constructor(config: Config) {
        if (!config.token) throw new Error("No apple music token provided");
        if (config.countryCode) this.countryCode = config.countryCode;
        this.token = config.token;
    }
    public setToken(token: string): void {
        this.token = token;
    }
    public async makeRequest(entrypoint: string): Promise<any> {
        const res = await fetch(`${AppleMusic.BASE_URL}${entrypoint}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.token}`,
                "Origin": "https://music.apple.com"
            }
        });
        const data = await res.json();
        return data;
    }

    public async getTrack(url: string): Promise<any> {
        let type;
        let id;
        let is_track = false;
        if (!AppleMusic.REGEX_SONG_ONLY.exec(url) || AppleMusic.REGEX_SONG_ONLY.exec(url) == null) {
            const extract = AppleMusic.REGEX.exec(url) || [];
            id = extract[4];
            type = extract[1];
        } else {
            const extract = AppleMusic.REGEX_SONG_ONLY.exec(url) || [];
            id = extract[8];
            type = extract[1];
            is_track = true;
        }
        if (!type || !id) return null;
        let endpoint: string;
        if (is_track) {
            endpoint = `/catalog/${this.countryCode}/songs/${id}`;
        } else {
            endpoint = `/catalog/${this.countryCode}/${type}s/${id}`;
        }
        const data = await this.makeRequest(endpoint);
        return data;
    }
}
