# ETL _Extract Transform Load_

ETL is the process by which data is extracted from data sources (that are not optimized for analytics), and moved to a central host (which is). The exact steps in that process might differ from one ETL tool to the next, but the end result is the same.

## Cross Commerce Challenge

---

- ### Extract
  - Make calls in our REST API to extract a set of numbers from our database.
  - [http://challenge.dienekes.com.br/api/numbers?page=1](http://challenge.dienekes.com.br/api/numbers)
  - You must request to API an object like **` {"numbers": [ 0.4971795774527892, 0.7311238428477732, 0.004048275097350857 ]}`** from each page, `?page=1,2,3...` and keep requesting until you receive an empty array **`{"numbers": []}`**.

---

- ### Transform
  - The transformation step consists of sorting all the numbers extracted in the previous step.
  - **IMPORTANT** sorting must be done with the final set containing all numbers extracted from all pages.
  - **IMPORTANT** You must implement the sorting algorithm. It is not allowed to use no language resource that does all the sorting for you.

---

- ### Load
  - The application must expose an API that provides the final set of ordered numbers from the transform step. Feel free to choose the API type (rest, soap, graphql etc),modeling of methods and data format.

---

## Solution

Running the command below will start the app. it references to `index.ts` file.

```
 yarn tsc
```

The app starts to fetch data from the API instantly, after receive, sort it, and then start a server express to allow send data with an API REST.

### How do I _Extract_ the data?

- I use `cluster` module from node, to create a main process and 4 more child process to run in separeted threads in paralel. Each child process requests a number of 1000 pages and then saves the requested data to main process (`Primary`).
- If the child didn't receive an empty array, it means that there are still more pages to be requested. The child tells `Primary` alocate a new child process to request remaining data.
- All the communications are done via messages from the `cluster` modules. which are available in the `NodeJS` documentation.
- To handle with shared resources, each child process saves received data in the same array. I've use semaphores, to prevent the same resource from being accessed by two differents process.

### How do I _Transform_ the data?

- To sort the data i used the Quick Sort Algorithm, which is found in the literature. Sorting algorithm are very famous and have anothers with other characteristics, but Quick Sort was a good choice to solve this challenge.
- I chose Quick Sort because it has a time complexity of $n*log(n)$ on average and best case, and the memory comsumption of $log(n)$, Where n is the number of elements.

### How do I _Load_ the data?

- To load the transformed data, i just start a server with `ExpressJS`, and a **GET** method can be used to get the data.
- **`/transform`** is the route to get the sorted data.

## Units Tests

- **`Should be able to request 250 pages without errors`**: The application must request 250 pages and receive 250 responses. Preventing failure for any reason.

- **`Should be able to successfully request pages, even if some of them have errors`**: The app must request 250 pages and receive 250 or fewer responses. If something fails, it will still receive requests successfully, avoiding the interruption of the application and other child processes.

- **`Should be able to stop request from api when receive an empty array`**: The application needs to be able to signal to stop making more requests, there is no more data to requested.

- **`Should be able to request more data from api when don't receive an empty array`**: The app needs to signal to make more requests, there is still data to be requested.

- **`Should be able to sort any array of numbers`**: Given an array, the application needs to perform a sort operation and return the sorted array.

- **`Should be able to get the sorted array from API`**: The API must be able to send with the get method a local variable that stores the transformation step array.
