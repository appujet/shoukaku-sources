import { fetch } from 'undici';


export class SoundCloud {

    constructor() {
    }

    async getTrack(trackUrl: string): Promise<any> {
        try {
            const res = await fetch(`https://soundcloud.com/oembed?format=json&url=${trackUrl}`);
            const json: any = await res.json();
            const thumbnailUrl = json.thumbnail_url;

            return thumbnailUrl;
        } catch (error) {
            return null;
        }
    }
}