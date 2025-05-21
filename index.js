const express = require("express")
const axios = require('axios')
const cors = require('cors')
const Redis = require('redis')

const redisClient = Redis.createClient()
const DEFAULT_EXPIRATION = 3600  // 1 hour

const app = express();
app.use(cors())

function getOrSetCache(key, callBack) {
    return new Promise((resolve, reject) => {
        redisClient.get('photos', async (error, data) => {
            if(error) return reject(error);
            if(data != null) {
                console.log("Cache hit");
                return resolve(JSON.parse(data));
            }
            console.log('Cache miss')
            const freshData = await callBack();   //if there is no data in the redis cache then getting from the db
            redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));  // set data on redis as there is no cache of that data
            resolve(freshData);
            console.log("Cache saved");
        })
    })
}

app.get('/photos', async (req, res) => {
    const photos = await getOrSetCache('photos', async () => {
        const {data} = await axios.get('https://jsonplaceholder.typicode/photos');
        return data;
    })

    res.json(photos);
})

const PORT = process.env.PORT || 3000;

try {
  app.listen(PORT, () => {
    console.log(`✅ Server successfully running on port ${PORT}`);
  });
} catch (serverError) {
  console.error("❌ Failed to start server:", serverError);
  process.exit(1);
}
