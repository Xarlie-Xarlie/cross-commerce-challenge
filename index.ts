import { requestData } from './extract';
import { quickSort } from './transform';
import load from './load';
import { cpus } from 'os';
import process from 'process';
import cluster from 'cluster';

export const api_URL = 'http://challenge.dienekes.com.br/api/numbers';
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
  var finishedRequest = 0; // track how many process are ended

  // Fork workers.
  var worker;
  var lastPage = -1; // save the last page request in order to make more requests
  for (let i = 0; i < numCPUs; i++) {
    if (i === numCPUs - 1) lastPage = 1000 + i * 1000;
    //create a new worker
    worker = cluster.fork();

    // send a message to workers make the request with 1000 pages
    worker.send({
      message: 'get data from api',
      fromPage: 1000 * i + 1,
      toPage: 1000 + i * 1000,
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
      // create a new worker to make more requests
      worker = cluster.fork();
      worker.send({
        message: 'get data from api',
        fromPage: lastPage + 1,
        toPage: lastPage + 1000,
      });

      // update the last page requested
      semaphoreLastPage.take(() => {
        lastPage += 1000;
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

    // ended all requests
    if (code === 0) {
      finishedRequest++;

      // if all process have finished, we compute the sort
      if (finishedRequest === numCPUs) {
        const sortedData = quickSort(requests);

        load.locals.sortedData = sortedData;

        // Start Server at port 3333
        load.listen(3333, () => {
          console.log('💻Backend started at port 3333');
        });
      }
    }
  });
} else {
  // workers execution
  process.on('message', async (data: dataProcess) => {
    if (data.message === 'get data from api') {
      // request data in child process
      var { result, hasPages } = await requestData(
        api_URL,
        data.fromPage,
        data.toPage
      );
      // send the results with an message to Primary process
      if (result[0].length > 0) {
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
