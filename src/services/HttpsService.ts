import * as https from 'node:https';

const HttpsService = {
  get: (url: string) => new Promise<string | never>((resolve, reject) => {
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
  }),

  post: (
    { hostname, path, headers }: https.RequestOptions,
    body: unknown,
  ) => new Promise<string | never>((resolve, reject) => {
    const request = https.request({
      method: 'POST',
      hostname,
      path,
      headers,
    }, res => {
      const data = [];

      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', () => {
        const resData = Buffer.concat(data).toString();
        const response = res.headers['content-type'] === 'application/json'
          ? JSON.parse(resData)
          : resData;

        resolve(response);
      });
    }).on('error', err => {
      reject(err);
    });

    request.write(typeof body === 'string' ? body : JSON.stringify(body));

    request.end();
  }),
};

export default HttpsService;
