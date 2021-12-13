import axios from 'axios';
import process from 'process';

// retry requests based on maxRetries
async function requestWithRetry<T>(
  fetchData: () => Promise<T>,
  maxOfTries: number
): Promise<T> {
  let lastError: any;
  for (let numberOfTries = 0; numberOfTries < maxOfTries; numberOfTries++) {
    try {
      return await fetchData();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

// request data from start page to end page
export async function requestData(
  url: string,
  startPage: number,
  endPage: number,
  numberOfTries = 5
) {
  let requests = []; // save requests made
  let result = []; // results from Promises requests
  let hasPages = true; // still has pages to request
  let currentPage = startPage;

  do {
    // save requests on array
    requests.push(
      requestWithRetry(
        () => axios.get(`${url}?page=${currentPage}`),
        numberOfTries
      )
    );
    // await 10000 or the number of requests
    if (currentPage % 10000 === 0 || currentPage === endPage) {
      console.log(
        `Worker ${process.pid} is awaiting data from page ${startPage} to page ${endPage} `
      );
      // await to finish requests
      let response = await Promise.allSettled(requests);

      // save finished requests
      result.push(
        // filter the sucessfully results
        response.filter(element => {
          if (
            element.status === 'fulfilled' &&
            element.value.data.numbers.length !== 0
          ) {
            return element.value.data;
          } else if (
            element.status === 'fulfilled' &&
            element.value.data.numbers.length === 0 &&
            hasPages
          ) {
            hasPages = false;
            return false;
          } else return false;
        })
      );
      requests = []; // clear requests done
    }
    currentPage++;
  } while (hasPages && currentPage <= endPage);
  return { result, hasPages };
}
