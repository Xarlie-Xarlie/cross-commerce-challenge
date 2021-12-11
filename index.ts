import cluster from 'cluster';
import { cpus } from 'os';
import { requestData, api_URL } from './extract';
import { mergeSortTopDown } from './transform';
import process from 'process';
const numCPUs = cpus().length;

interface dataProcess {
  message: string;
  fromPage: number;
  toPage: number;
  lastPage: number;
}

// let teste = [
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
// ];

// var newArray = [];
// teste.forEach(element => {
//   element.forEach(item => newArray.push(item));
// });
// teste = [...newArray];

if (cluster.isPrimary) {
  //log Main Thread process
  console.log(`Primary ${process.pid} is running`);

  const requests = []; // array to save requests

  // Fork workers.
  var worker;
  var lastPage = -1;
  for (let i = 0; i < numCPUs; i++) {
    if (i === numCPUs - 1) lastPage = 2500 + i * 2500;
    // send a message to workers make the request with 2500 pages
    worker = cluster.fork();

    worker.send({
      // since my cpu has 4 cores, i use 10000/numcpus = 2500 pages per core
      message: 'get data from api',
      fromPage: 2500 * i + 1,
      toPage: 2500 + i * 2500,
      lastPage: lastPage,
    });

    worker.on('message', data => {
      if (data.result) {
        data.result.forEach(element => {
          element.forEach(item => requests.push(item));
        });
      }
    });
  }

  cluster.on('exit', function (worker, code, signal) {
    if (signal) {
      console.log(
        'Worker ' +
          worker.process.pid +
          ' died with code: ' +
          code +
          ', and signal: ' +
          signal
      );
    }

    if (code === 2) {
      // if code is 2 it means that we don't get an empty array from requests
      cluster.fork().send({
        message: 'still have data to request',
        fromPage: lastPage,
        toPage: lastPage + 2500,
        lastPage: lastPage + 2500,
      });
      lastPage += 2500;
    }
    if (code === 3) {
      console.log(`requests.length: ${requests.length}`);
      console.time('Time to sort items with MergeSort');
      var sortedrequests = mergeSortTopDown(requests);
      console.timeEnd('Time to sort items with MergeSort');
      console.log(sortedrequests);
    }
  });
} else {
  process.on('message', async (data: dataProcess) => {
    if (data.message === 'get data from api') {
      // request data in child process
      var { result, hasPages } = await requestData(
        api_URL,
        data.fromPage,
        data.toPage
      );

      if (result.length > 0) {
        result = result[0].map(element => element.value.data.numbers);
        process.send({ result });
      }

      // if still have pages the process will restart
      if (hasPages) process.exit(2);
      // if doesn't have, it will just log the receive data
      else if (!hasPages && result.length > 0) {
        process.exit(0);
      }
      // it has no data remaining
      else process.exit(3);
    } else if (data.message === 'still have data to request') {
      // request data in process
      let { result, hasPages } = await requestData(
        api_URL,
        data.fromPage,
        data.toPage
      );

      if (result.length > 0) {
        result = result[0].map(element => element.value.data.numbers);
        process.send({ result });
      }

      // if still have pages to request the process will restart
      if (hasPages) process.exit(2);
      // if doesn't, it will just log the receive data
      else if (!hasPages && result.length > 0) {
        // console.log(resultFinal);
        process.exit(3);
      } else process.exit(0); // it has no data remaining
    }
  });
}
