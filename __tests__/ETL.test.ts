import { requestData } from '../extract';
import { quickSort } from '../transform';
import { api_URL } from '../index';
import load from '../load';
import requeest from 'supertest';

describe('Extract', () => {
  it('Should be able to request 250 pages without errors', async () => {
    const { result } = await requestData(api_URL, 1, 250);
    expect(result[0]).toHaveLength(250);
  }, 60000);

  it('Should be able to successfully request pages, even if some of them have errors', async () => {
    const { result } = await requestData(api_URL, 1, 250, 1);
    expect(result[0].length).toBeLessThanOrEqual(250);
  }, 60000);

  it('Should be able to stop request from api when receive an empty array', async () => {
    var { hasPages } = await requestData(api_URL, 9990, 10010);
    expect(hasPages).toBeFalsy();
  }, 60000);

  it(`Should be able to request more data from api when don't receive an empty array`, async () => {
    var { hasPages } = await requestData(api_URL, 9970, 9990);
    expect(hasPages).toBeTruthy();
  }, 60000);
});

describe('Transform', () => {
  it('Should be able to sort any array of numbers', () => {
    const ordenedArray = quickSort([
      1, 2, 56, 7, 78, 543, 32.57, 87.345, 0.85, 94, 10, 23, 5, 6, 12, 13, 2021,
    ]);
    expect(ordenedArray).toEqual([
      0.85, 1, 2, 5, 6, 7, 10, 12, 13, 23, 32.57, 56, 78, 87.345, 94, 543, 2021,
    ]);
  });
});

describe('Load', () => {
  it('Should be able to get the sorted array from API', async () => {
    load.locals.sortedData = [
      0.85, 1, 2, 5, 6, 7, 10, 12, 13, 23, 32.57, 56, 78, 87.345, 94, 543, 2021,
    ];
    const sort = await requeest(load).get('/transform');
    expect(JSON.parse(sort.text)).toEqual({
      SortedData: [
        0.85, 1, 2, 5, 6, 7, 10, 12, 13, 23, 32.57, 56, 78, 87.345, 94, 543,
        2021,
      ],
    });
    expect(sort.statusCode).toEqual(200);
  });
});
