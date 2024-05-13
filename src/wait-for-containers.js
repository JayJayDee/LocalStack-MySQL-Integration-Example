require('dotenv/config');
const { SQS } = require('aws-sdk');
const mysql = require('mysql2/promise');

const MAX_ATTEMPTS = 25;

(async () => {
  const { awsEndpoint, mysql } = getConfig();
  await waitWhileLocalStackReady(awsEndpoint, MAX_ATTEMPTS);
  console.log('* LocalStack Ready');
  await waitWhileMySQLReady(mysql, MAX_ATTEMPTS);
  console.log('* MySQL Ready');
  process.exit(0);
})();

function waitLittle(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function waitWhileLocalStackReady(awsEndpoint, maxAttempts) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      new SQS({ endpoint: awsEndpoint, region: 'us-east-1' });
      break;
    } catch (err) {
      console.log(`SQS is not ready, err: ${err.message}`);
    }
    await waitLittle(1000);
  }
}

async function waitWhileMySQLReady(mysqlConfig, maxAttempts) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeMySQLConnection(mysqlConfig);
      break;
    } catch (err) {
      console.log(`MySQL is not ready, err: ${err.message}`);
    }
    await waitLittle(1000);
  }
}

function getConfig() {
  const getOrReject = (source, key) => {
    const got = source[key];
    if (!got) throw new Error(`env-variables not found: ${key}`);
    return got;
  };
  return {
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
