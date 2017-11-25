var request = require('request-promise-native');
const fs = require('fs')

const urls = fs.readFileSync('urls.txt').toString().split("\n");
urls.pop()
getContentLength( )

function getContentLength() {
  const uri = urls.pop();
  request.head(uri)
  .then((head) => {
    console.log(head['content-length'] + ';' + uri)
    getContentLength()
  })
}

for(let i = 0; i < 10; i++) {
  getContentLength()
}
