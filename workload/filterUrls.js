const fs = require('fs')

const urls = fs.readFileSync('urls_with_content_size.txt').toString().split("\n");

const lowerLimit = 45;
const upperLimit = 55;

uris = urls
    .filter((url) => {
        const [size, uri] = url.split(';')
        if(size > lowerLimit * 1000000 && size < upperLimit * 1000000) {
            return true;
        }
        return false;
    })
    .map((url) => {
        const [size, uri] = url.split(';')
        return uri;
    })

fs.writeFileSync(`${lowerLimit}-${upperLimit}-urls.txt`, uris.join('\n'))