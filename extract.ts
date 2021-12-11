import axios from 'axios';
import process from 'process';

export const api_URL = 'http://challenge.dienekes.com.br/api/numbers';

export async function retryRequest<T>(
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

export async function requestData(
  url: string,
  startPage: number,
  endPage: number
) {
  let requests = [];
  let result = [];
  let hasPages = true;
  let currentPage = startPage;

  do {
    requests.push(
      retryRequest(() => axios.get(`${url}?page=${currentPage}`), 10)
    );
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
    `Worker ${
      process.pid
    } received from Api: ${totalReceived}, pages requesteds=${
      endPage - startPage + 1
    }`
  );
  return { result, hasPages };
}
