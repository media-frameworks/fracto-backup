import FileServer from 'file-server';
import http from 'http';

const fileServer = new FileServer((error, request, response) => {
   response.statusCode = error?.code || 500;
   response.end(error);
});

const serveTilesDirectory = fileServer.serveDirectory('./tiles', {
   '.gz': 'application/gzip'
});

console.log("tile server listening on port 80")

http
   .createServer(serveTilesDirectory)
   .listen(80)
   .on('close', () => {
      fileServer.close(() => {
         console.log('We have closed all file server connections');
      });
   });