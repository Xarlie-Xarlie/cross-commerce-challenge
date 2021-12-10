import axios from 'axios';
import cluster from 'cluster';
import { cpus } from 'os';
import process from 'process';

export const api_URL = 'http://challenge.dienekes.com.br/api/numbers';
const numCPUs = cpus().length;

async function retry<T>(
  fetchData: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  let lastError: any;
  for (let index = 0; index < maxRetries; index++) {
    try {
      return await fetchData();
    } catch (e) {
      lastError = e;
    }
  }
  // console.log('Error during fetch, max tries reached');
  throw lastError;
}

async function requestData(url: string, startPage: number, endPage: number) {
  let requests = [];
  let result = [];
  let hasPages = true;
  let currentPage = startPage;

  do {
    requests.push(retry(() => axios.get(`${url}?page=${currentPage}`), 10));
    if (currentPage % 10000 === 0 || currentPage === endPage) {
      console.log(
        `Worker ${process.pid} is awaiting pages of ${startPage} to ${endPage}`
      );
      let response = await Promise.allSettled(requests);
      // response.forEach(element => {});
      result.push(
        response.filter(element => {
          if (
            element.status === 'fulfilled' &&
            element.value.data.numbers.length !== 0
          )
            return element.value.data;
          else if (
            element.status === 'fulfilled' &&
            element.value.data.numbers.length === 0 &&
            hasPages
          ) {
            hasPages = false;
            return false;
          } else if (element.status === 'rejected') {
            // console.log('Promise Rejected!');
            // console.log(element);
            return false;
          }
        })
      );
      requests = [];
    }
    currentPage++;
  } while (hasPages && currentPage <= endPage);

  let totalReceived = 0;
  result.forEach(element => (totalReceived += element.length));
  console.log(
    `total of objects received from Data: ${totalReceived}, pages requesteds=${
      endPage - startPage + 1
    }`
  );
  return { result, hasPages };
}

interface dataWorker {
  result: [];
  hasPages: boolean;
  currentPage: number;
}

if (cluster.isPrimary) {
  const resultFinal = [];
  console.log(`Primary ${process.pid} is running`);

  let newWorker;
  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  // Fork workers.
  let lastPage = -1;
  for (let i = 0; i < numCPUs; i++) {
    if (i === numCPUs - 1) lastPage = 2500 + i * 2500;
    let worker = cluster.fork();
    worker.send({
      message: 'get data from api',
      fromPage: 2500 * i + 1,
      toPage: 2500 + i * 2500,
      lastPage: lastPage,
    });
  }

  cluster.on('exit', function (worker, code, signal) {
    console.log(
      'Worker ' +
        worker.process.pid +
        ' died with code: ' +
        code +
        ', and signal: ' +
        signal
    );
    if (code === 2) {
      console.log('Starting a new worker');
      newWorker = cluster.fork();
      newWorker.send({
        message: 'still have data to request',
        fromPage: lastPage,
        toPage: lastPage + 2500,
        lastPage: lastPage + 2500,
      });
    }
  });

  cluster.on('message', (data: dataWorker) => {
    resultFinal.push(data.result);
  });
} else {
  // console.log(`Worker ${process.pid} started ${cluster.worker.id}`);
  interface dataProcess {
    message: string;
    fromPage: number;
    toPage: number;
    lastPage: number;
  }

  process.on('message', async (data: dataProcess) => {
    // console.log(`Worker ${process.pid} started to fetch data.`);
    if (data.message === 'get data from api') {
      let { result, hasPages } = await requestData(
        api_URL,
        data.fromPage,
        data.toPage
      );
      result = result[0].map(element => element.value.data);
      process.send({ result, hasPages, currentPage: data.toPage });
      if (hasPages && data.toPage === data.lastPage) process.exit(2);
      process.exit(0);
    } else if (data.message === 'still have data to request') {
      let { result, hasPages } = await requestData(
        api_URL,
        data.fromPage,
        data.toPage
      );
      result = result[0].map(element => element.value.data);
      process.send({ result, hasPages, currentPage: data.toPage });
      if (hasPages && data.toPage === data.lastPage) process.exit(2);
      process.exit(0);
    }
  });
}
/*

async function requestLucas() {
  const responses = [];
  let hasPages = true;
  let currentPage = 1;
  do {
    const response = await retry(
      () => axios.get(`${api_URL}?page=${currentPage}`),
      10
    );
    if (!response.data.numbers.length) {
      hasPages = false;
    }
    // if (currentPage % 100 === 0) console.log(`At page ${currentPage}`);
    responses.push(response.data);
    currentPage++;
  } while (hasPages);
  // console.log(responses);
  // responses.forEach(Element => {
  //   console.log(Element);
  // });
  console.log(`responses.length: ${responses.length}`);
  console.log(
    `total of objects received from Lucas: ${
      responses.length
    }, requests made: ${currentPage - 1}`
  );
  return responses;
}
  switch (cluster.worker.id) {
    case 1:
      // console.log(`started main ${cluster.worker.id}`);
      main(1, 2500)
        .then(() => process.exit(0))
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
      break;

    case 2:
      // console.log(`started main ${cluster.worker.id}`);
      main(2501, 5000)
        .then(() => process.exit(0))
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
      break;
    case 3:
      // console.log(`started main ${cluster.worker.id}`);
      main(5001, 7500)
        .then(() => process.exit(0))
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
      break;

    case 4:
      // console.log(`started main ${cluster.worker.id}`);
      main(7501, 10000)
        .then(() => process.exit(0))
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
      break;
  }*/
