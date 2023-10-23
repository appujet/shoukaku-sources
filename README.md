## shoukaku-sources

this is a list of sources that can be used with [shoukaku](https://github.com/Deivu/Shoukaku) to play music.¨

### installing

```bash
npm i shoukaku-sources
```

### Example

- without token
```js
const { Spotify, AppleMusic } = require('shoukaku-sources');

        if (track.info.sourceName === 'youtube') {
            track.info.thumbnail = `https://img.youtube.com/vi/${track.info.identifier}/hqdefault.jpg`;
        } else if (track.info.sourceName === 'spotify') {
                new Spotify().getTrack(track.info.uri).then((res) => {
                    this.info.thumbnail = res.album && res.album.images ? res.album.images[0] ? res.album.images[0].url : null : null;
            });
        } else if (track.info.sourceName === 'applemusic') {
                new AppleMusic().getTrack(track.info.uri).then((res) => {
                    this.info.thumbnail = res.data[0].attributes.artwork.url.replace("{w}x{h}", "512x512");
            });
        }

```

- with token

```js
const SpotifyToken = [
    {
        clientId: 'spotify client id',
        clientSecret: 'spotify client secret',
    }
]

const AppleMusicToken = {
    token: 'apple music developer token',
    countryCode: 'country code', // optional
}
const { Spotify, AppleMusic } = require('shoukaku-sources');

        if (track.info.sourceName === 'youtube') {
            track.info.thumbnail = `https://img.youtube.com/vi/${track.info.identifier}/hqdefault.jpg`;
        } else if (track.info.sourceName === 'spotify') {
                new Spotify(SpotifyToken).getTrack(track.info.uri, token).then((res) => {
                    this.info.thumbnail = res.album && res.album.images ? res.album.images[0] ? res.album.images[0].url : null : null;
            });
        } else if (track.info.sourceName === 'applemusic') {
                new AppleMusic(AppleMusicToken).getTrack(track.info.uri, token).then((res) => {
                    this.info.thumbnail = res.data[0].attributes.artwork.url.replace("{w}x{h}", "512x512");
            });
        }

```

