import * as https from 'node:https';

export const fetchPage = (url: string) => new Promise<string | never>((resolve, reject) => {
  https.get(url, (res) => {
    const data = [];

    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      const resData = Buffer.concat(data).toString();
      resolve(resData);
    });
  }).on('error', err => {
    reject(err);
  });
});
