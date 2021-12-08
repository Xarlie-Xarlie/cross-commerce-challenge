import fetch from 'node-fetch';

const api_URL = 'http://challenge.dienekes.com.br/api/numbers';

function fetchWithAutoRetry(fetcher, maxRetryCount: number) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const caller = () =>
      fetcher()
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          if (retries < maxRetryCount) {
            console.log('retrying request');
            retries++;
            caller();
          } else {
            reject(error);
          }
        });
    retries = 1;
    caller();
  });
}

// const fetchSouravProfile = async () => {
//   console.log('Fetching..');
//   const rawResponse = await fetch('https://api.github.com/users/sourav-singhh');
//   const jsonResponse = await rawResponse.json();
//   console.log(jsonResponse);
//   return jsonResponse;
// };

// fetchWithAutoRetry(fetchSouravProfile, 5);

// function makeApiRequest(url, numRetries) {}

const getNumbers = async () => {
  const dataBase = [];
  const numbers = [];
  let quantPages = 1;
  let stop = false;

  do {
    console.log('Getting more 20 requests');

    for (
      let pageNumber = quantPages;
      pageNumber < quantPages + 20;
      pageNumber++
    ) {
      dataBase.push(
        fetchWithAutoRetry(() => fetch(`${api_URL}?page=${pageNumber}`), 5)
      );
    }

    quantPages += 20;

    try {
      let result = await Promise.all(dataBase);

      numbers.push(
        result.map(element => {
          console.log(element);
          return JSON.parse(element);
        })
      );

      numbers[numbers.length - 1].forEach(obj => {
        if (!obj.numbers.length) stop = true;
      });
    } catch (error) {
      console.log('Error: ', error.message);
      break;
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

getNumbers();

//get(`${api_URL}?page=${1}`).then(data => console.log(data));
