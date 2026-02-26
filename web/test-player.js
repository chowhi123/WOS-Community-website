const crypto = require('crypto');

const API_SECRET = 'tB87#kPtkxqOS2';
const API_URL = 'https://wos-giftcode-api.centurygame.com/api/player';
const id = '396309863';

async function fetchPlayer() {
    const currentTime = Date.now();
    const formArgs = `fid=${id}&time=${currentTime}`;
    const sign = crypto.createHash('md5').update(formArgs + API_SECRET).digest('hex');
    const bodyPayload = `sign=${sign}&${formArgs}`;

    console.log("Fetching WOS API for ID:", id);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://wos-giftcode.centurygame.com'
            },
            body: bodyPayload
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

fetchPlayer();
