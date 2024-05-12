require('dotenv/config');
const { SQS } = require('aws-sdk');
const express = require('express');

(async () => {
  const app = express();
  const { httpPort, awsEndpoint } = getConfig();

  await waitWhileLocalStackReady(awsEndpoint);

  const queue = new SQS({ endpoint: awsEndpoint, region: 'us-east-1' });
  const queues = await queue.listQueues().promise();
  console.log(queues);

  app.get('/', (req, res, next) => res.json({ result: 'okay '}));

  app.listen(httpPort, () => console.log(`http-server started with port: ${httpPort}`));
})();

function waitWhileLocalStackReady(awsEndpoint) {
  return new Promise((resolve, reject) => {
    setInterval(async () => {
      try {
        const sqs = new SQS({
          endpoint: awsEndpoint,
          region: 'us-east-1',
        });
        clearInterval(this);
        await sqs.createQueue({ QueueName: 'Test-Queue' }).promise();
        resolve();
      
      } catch (err) {
        console.log(`sqs is not ready, err: ${err.message}`);
      }
    }, 1000);
  });
}

function getConfig() {
  const getOrReject = (source, key) => {
    const got = source[key];
    if (!got) throw new Error(`env-variables not found: ${key}`);
    return got;
  };
  return {
    httpPort: getOrReject(process.env, 'HTTP_PORT'),
    awsEndpoint: getOrReject(process.env, 'AWS_ENDPOINT'),
  };
}