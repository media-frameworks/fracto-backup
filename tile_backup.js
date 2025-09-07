import fs from "fs";
import https from "https";
import network from "./common/config/network.json" with {type: "json"};
import FractoIndexedTiles from "./fracto/FractoIndexedTiles.js";

const tiles_dir = "./tiles";
if (!fs.existsSync(tiles_dir)) {
   fs.mkdirSync(tiles_dir)
}

const backup_short_codes = (short_codes, cb) => {
   if (!short_codes.length) {
      console.log('complete')
      cb()
      return;
   }
   const remaining = short_codes.length
   if (remaining % 100 === 0) {
      console.log(`${remaining} remain`)
   }
   const short_code = short_codes.pop()
   const level = short_code.length
   const naught = level < 10 ? '0' : ''
   const level_dirname = `L${naught}${level}`
   const tiles_dir = "./tiles";
   const level_dir = `${tiles_dir}/${level_dirname}`
   if (!fs.existsSync(level_dir)) {
      fs.mkdirSync(level_dir)
   }
   const filename = `${level_dirname}/${short_code}.gz`
   const localSavePath = `${tiles_dir}/${filename}`; // Path to save the .gz file locally
   if (fs.existsSync(localSavePath)) {
      backup_short_codes(short_codes, cb)
      return;
   }
   const fileStream = fs.createWriteStream(localSavePath);
   const remoteGzUrl = `${network["fracto-prod"]}/${filename}`
   https.get(remoteGzUrl, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
         fileStream.close();
         backup_short_codes(short_codes, cb)
      });
      fileStream.on('error', (err) => {
         console.error('Error writing to file:', err);
         exit(1)
      });
   }).on('error', (err) => {
      console.error('Error downloading file:', err);
      exit(1)
   });
}

const backup_level_short_codes = (level_short_codes) => {
   if (!level_short_codes.length) {
      console.log('complete')
      exit(1)
   }
   const short_codes = level_short_codes.pop()
   const level = short_codes[0].length
   console.log(`backing up level ${level} (${short_codes.length} tiles)`)
   backup_short_codes(short_codes, () => {
      backup_level_short_codes(level_short_codes)
   })
}

FractoIndexedTiles.load_short_codes('indexed', short_codes => {
   const level_short_codes = []
   for (let level = 30; level > 2; level--) {
      const short_codes_for_level = short_codes.filter(short_code => short_code.length === level)
      level_short_codes.push(short_codes_for_level)
   }
   backup_level_short_codes(level_short_codes)
})