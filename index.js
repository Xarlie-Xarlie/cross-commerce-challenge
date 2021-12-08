const axios = require('axios');
const { textSpanContainsPosition } = require('typescript');

const api_URL = 'http://challenge.dienekes.com.br/api/numbers';

function fetchWithAutoRetry(fetcher, maxRetryCount) {
  //returns a promise to tryng get data
  return new Promise((resolve, reject) => {
    let retries = 0;
    const caller = () =>
      fetcher()
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          if (retries < maxRetryCount) {
            // console.log('retrying request');
            retries++;
            caller();
          } else {
            console.log('rejected request');
            reject(error);
          }
        });
    retries = 1;
    caller();
  });
}

async function requestData() {
  let requests = [];
  let result = [];

  let hasPages = true;
  let currentPage = 0;
  do {
    requests.push(
      fetchWithAutoRetry(
        () => axios.get(`${api_URL}?page=${++currentPage}`),
        10
      )
    );
    if (currentPage % 400 === 0) {
      // console.log('awaiting promises');
      let response = await Promise.allSettled(requests);
      result.push(response.map(element => element.value.data));
      requests = [];
    }
    // requests.push(response);
  } while (hasPages && currentPage < 1000);
  // result.forEach(response => {
  //   console.log(response.data);
  //   if (!response.data.numbers.length) hasPages = false;
  // });
  let totalReceived = 0;
  result.forEach(element => (totalReceived += element.length));
  console.log(`total of objects received from Data: ${totalReceived}`);

  return requests;
}

async function requestLucas() {
  const responses = [];
  const hasPages = true;
  let currentPage = 0;
  do {
    const response = await fetchWithAutoRetry(
      () => axios.get(`${api_URL}?page=${++currentPage}`),
      10
    );
    if (!response.data.numbers.length) {
      hasPages = false;
    }
    // if (currentPage % 100 === 0) console.log(`At page ${currentPage}`);
    responses.push(response);
  } while (hasPages && currentPage < 1000);
  console.log(`total of objects received from Lucas: ${responses.length}`);
  return responses;
}

async function call() {
  // console.log('StartedData()');
  console.time('StartedData()');
  let a = await requestData();
  console.timeEnd('StartedData()');
  // console.log('StartedLucas()');
  console.time('StartedLucas()');
  let b = await requestLucas();
  console.timeEnd('StartedLucas()');
  return a, b;
}

call();
// const fetchSouravProfile = async () => {
//   console.log('Fetching..');
//   const rawResponse = await fetch('https://api.github.com/users/sourav-singhh');
//   const jsonResponse = await rawResponse.json();
//   console.log(jsonResponse);
//   return jsonResponse;
// };

// fetchWithAutoRetry(fetchSouravProfile, 5);

// function makeApiRequest(url, numRetries) {}
/*
const getNumbers = async () => {
  const requests = [];
  const data = [];
  let quantPages = 1;
  let stop = false;

  do {
    console.log('Getting requests');
    for (
      let pageNumber = quantPages;
      pageNumber < quantPages + 1;
      pageNumber++
    ) {
      requests.push(
        fetchWithAutoRetry(() => axios.get(`${api_URL}?page=${pageNumber}`), 5)
      );
    }
    await Promise.all(requests);

    quantPages += 20;

    try {
      numbers.push(
        result.map(element => {
          // console.log(element.data);
          return JSON.parse(element.data);
        })
      );

      numbers[numbers.length - 1].forEach(obj => {
        if (!obj.numbers.length) stop = true;
      });
    } catch (error) {
      if (error.message === 'Unexpected token o in JSON at position 1')
        console.log(Promise.all(requests));
      console.log('Error:', error.message);
      // console.log('Trying Again the last 10 requests');
      // quantPages -= 10;

      // for (
      //   let pageNumber = quantPages;
      //   pageNumber < quantPages + 10;
      //   pageNumber++
      // ) {
      //   dataBase.push(get(`${api_URL}?page=${pageNumber}`));
      // }

      // quantPages += 10;
    }
  } while (!stop && quantPages < 100);
  console.log(numbers);

  return numbers;
};

//getNumbers();
*/
