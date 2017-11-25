const request = require('request-promise-native')

request('https://api.developmentseed.org/satellites/?limit=800$satellite_name=landsat')
  .then((data) => {
    data = JSON.parse(data)
    data.results.forEach((image) => {
      image.download_links.aws_s3.forEach((band) => {
        console.log(band)
      })
    }) 
  })