import fs from "fs";
import https from "https";
import network from "./common/config/network.json" with {type: "json"};
import FractoIndexedTiles from "./fracto/FractoIndexedTiles.js";

const tiles_dir = "./tiles";
if (!fs.existsSync(tiles_dir)) {
   fs.mkdirSync(tiles_dir)
}

const level = parseInt(process.argv[2])
if (!level) {
   console.log('usage: title_backup [level]\n', JSON.stringify(process.argv))
   exit(1)
}

const backup_short_codes = (short_codes) => {
   if (!short_codes.length) {
      console.log('complete')
      return;
   }
   const short_code = short_codes.pop()
   const start = performance.now()
   const level = short_code.length
   const naught = level < 10 ? '0' : ''
   const level_dirname = `L${naught}${level}`
   const tiles_dir = "./tiles";
   const level_dir = `${tiles_dir}/${level_dirname}`
   if (!fs.existsSync(level_dir)) {
      fs.mkdirSync(level_dir)
   }
   const filename = `${level_dirname}/${short_code}.gz`
   const remoteGzUrl = `${network["fracto-prod"]}/${filename}`
   const localSavePath = `${tiles_dir}/${filename}`; // Path to save the .gz file locally
   const fileStream = fs.createWriteStream(localSavePath);
   https.get(remoteGzUrl, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
         fileStream.close();
         const finish = performance.now()
         console.log(`${short_code} in ${Math.round(finish - start) / 1000}s`)
         backup_short_codes(short_codes)
      });
      fileStream.on('error', (err) => {
         console.error('Error writing to file:', err);
      });
   }).on('error', (err) => {
      console.error('Error downloading file:', err);
   });
}

FractoIndexedTiles.load_short_codes('indexed', short_codes => {
   console.log('load_short_codes', short_codes)
   const level_short_codes = short_codes.filter(short_code => short_code.length === level)
   console.log(`level ${level} short codes to backup: ${level_short_codes.length}`)
   backup_short_codes(level_short_codes)
})