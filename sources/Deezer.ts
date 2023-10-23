import { request } from 'undici';


export class Deezer {
    public static readonly DEEZER_REGEX = /^(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(?<type>track|album|playlist)\/(?<id>\d+)/;

    constructor() {
    }

    public async getTrack(url: string): Promise<any> {
        const [, type, id] = Deezer.DEEZER_REGEX.exec(url) as RegExpExecArray;
        if (type === "track") {
            const data = await this.makeRequest(`/track/${id}`);
            return data as IDeezerTrack;
        } else if (type === "album") {
            const data = await this.makeRequest(`/album/${id}`);
            return data  as IDeezerList;
        } else if (type === "playlist") {
            const data = await this.makeRequest(`/playlist/${id}`);
            return data as IDeezerList;
        } else if (type === "artist") {
            const data = await this.makeRequest(`/artist/${id}`);
            return data as IDeezerList;
        }
    }

    private async makeRequest<T>(endpoint: string): Promise<T | DeezerError> {
        const res = await request(`https://api.deezer.com/${endpoint}`).then(r => r.body.json()) as IDeezerResponse;

        if (res.error) {
            return new DeezerError(res.error.type, res.error.message);
        }
        return res as T;
    }
}

class DeezerError implements IDeezerError {
    readonly type: string;
    readonly message: string;

    constructor(type: string, message: string) {
        this.type = type;
        this.message = message;
    }

    toString(): string {
        return `DeezerError: ${this.type}: ${this.message}`;
    }
}

interface IDeezerResponse {
    error?: IDeezerError;
}

interface IDeezerError {
    type: string;
    message: string;
}

interface IDeezerTrack {
    title: string;
    artist: {
        name: string;
    };
    isrc: string;
    link: string;
    duration: number;
}

interface IDeezerList {
    title: string;
    tracks: {
        data: IDeezerTrack[];
    };
}