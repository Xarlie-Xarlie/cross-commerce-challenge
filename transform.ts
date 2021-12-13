function swap(array: number[], leftIndex: number, rightIndex: number) {
  var temp = array[leftIndex];
  array[leftIndex] = array[rightIndex];
  array[rightIndex] = temp;
}

function partition(array: number[], left: number, right: number) {
  var pivot = array[Math.floor((right + left) / 2)], //middle element
    leftPointer = left,
    rightPointer = right;
  while (leftPointer <= rightPointer) {
    while (array[leftPointer] < pivot) {
      leftPointer++;
    }
    while (array[rightPointer] > pivot) {
      rightPointer--;
    }
    if (leftPointer <= rightPointer) {
      swap(array, leftPointer, rightPointer); //sawpping two elements
      leftPointer++;
      rightPointer--;
    }
  }
  return leftPointer;
}

export function quickSort(array: number[], left = 0, right = array.length - 1) {
  if (array.length > 1) {
    var index = partition(array, left, right); //index returned from partition
    if (left < index - 1) {
      //more elements on the left side of the pivot
      quickSort(array, left, index - 1);
    }
    if (index < right) {
      //more elements on the right side of the pivot
      quickSort(array, index, right);
    }
  }
  return array;
}
