import cluster from 'cluster';
import { cpus } from 'os';
import { requestData, api_URL } from './extract';
import { quickSort } from './transform';
import process from 'process';

const numCPUs = cpus().length;

interface dataProcess {
  message: string;
  fromPage: number;
  toPage: number;
}

if (cluster.isPrimary) {
  //log Main Thread process
  console.log(`Primary ${process.pid} is running`);

  var semaphoreRequests = require('semaphore')(1); // semaphore to deal with shared memory
  var semaphoreLastPage = require('semaphore')(1); // semaphore to deal with shared memory
  const requests = []; // array to save requests
  var finishedRequest = 0; // variable to track how many process are ended

  // Fork workers.
  var worker;
  var lastPage = -1; // save the last page request in order to make more requests
  for (let i = 0; i < numCPUs; i++) {
    if (i === numCPUs - 1) lastPage = 250 + i * 250;
    //create a new worker
    worker = cluster.fork();

    // send a message to workers make the request with 250 pages
    worker.send({
      message: 'get data from api',
      fromPage: 250 * i + 1,
      toPage: 250 + i * 250,
    });

    //if a worker fisished it's request, it will save data received
    worker.on('message', data => {
      if (data.result) {
        semaphoreRequests.take(() => {
          data.result.forEach(element => {
            element.forEach(item => requests.push(item));
          });
        });
        semaphoreRequests.leave();
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

    // if code is 1 it means that we don't get an empty array from requests
    if (code === 1) {
      // then create a new worker to make more requests
      worker = cluster.fork();

      worker.send({
        message: 'get data from api',
        fromPage: lastPage + 1,
        toPage: lastPage + 250,
      });

      // update the last page requested
      semaphoreLastPage.take(() => {
        lastPage += 250;
        semaphoreLastPage.leave();
      });

      worker.on('message', data => {
        if (data.result) {
          semaphoreRequests.take(() => {
            data.result.forEach(element => {
              element.forEach(item => requests.push(item));
            });
            semaphoreRequests.leave();
          });
        }
      });
    }
    // ended all requests receiving an empty array
    if (code === 0) {
      finishedRequest++;
      console.log(`requests.length: ${requests.length}`);
      // if all process have finished, we compute the sort
      if (finishedRequest === numCPUs) console.log(quickSort(requests));
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

      // send the results with an message to Primary process
      if (result.length > 0) {
        result = result[0].map(element => element.value.data.numbers);
        process.send({ result });
      }

      // if still have pages the process will restart
      if (hasPages) process.exit(1);

      // if has no page more, it ends the process
      process.exit(0);
    }
  });
}
