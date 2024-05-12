require('dotenv/config');
const { SQS } = require('aws-sdk');
const express = require('express');
const mysql = require('mysql2/promise');

(async () => {
  const app = express();
  const { httpPort, awsEndpoint, mysql } = getConfig();

  await waitWhileLocalStackReady(awsEndpoint);

  const queue = new SQS({ endpoint: awsEndpoint, region: 'us-east-1' });

  await queue.createQueue({ QueueName: 'TestQueue' }).promise();
  const queues = await queue.listQueues().promise();
  console.log(queues);
  console.log('* SQS READY');

  await waitWhileMySQLReady(mysql);
  console.log(`* MYSQL READY: ${mysql.host}`);

  const conn = await makeMySQLConnection(mysql);
  await conn.query('CREATE DATABASE IF NOT EXISTS becon_local CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
  await conn.query('USE becon_local');
  console.log(await conn.query('SHOW TABLES'));

  app.get('/', (req, res, next) => res.json({ result: 'okay '}));
  app.listen(httpPort, () => console.log(`* http-server started with port: ${httpPort}`));
})();

async function makeMySQLConnection(mysqlConfig, dbname) {
  return await mysql.createConnection({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    ...dbname ? {
      database: dbname
    } : {},
  });
}

function waitWhileLocalStackReady(awsEndpoint) {
  return new Promise((resolve) => {
    setInterval(async () => {
      try {
        new SQS({ endpoint: awsEndpoint, region: 'us-east-1' });
        clearInterval(this);
        resolve();
      
      } catch (err) {
        console.log(`sqs is not ready, err: ${err.message}`);
      }
    }, 2000);
  });
}

function waitWhileMySQLReady(mysqlConfig) {
  return new Promise((resolve) => {
    setInterval(async () => {
      try {
        await makeMySQLConnection(mysqlConfig);
        clearInterval(this);
        resolve();

      } catch (err) {
        console.log(`MySQL is not ready, err: ${err.message}`);
      }
    }, 2000);
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
    mysql: {
      host: getOrReject(process.env, 'MYSQL_HOST'),
      port: getOrReject(process.env, 'MYSQL_PORT'),
      database: getOrReject(process.env, 'MYSQL_DATABASE'),
      user: getOrReject(process.env, 'MYSQL_USER'),
      password: getOrReject(process.env, 'MYSQL_PASSWORD'),
    }
  };
}