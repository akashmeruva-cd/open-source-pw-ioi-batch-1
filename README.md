# open-source-pw-ioi-batch-1

## dfgfdg
# Binary Search

## What is Binary Search?

Binary Search is an efficient searching algorithm used to find an element in a **sorted array**.

Instead of checking every element one by one, Binary Search repeatedly divides the search space into half.

## How Does It Work?

Suppose we have:

`[10, 20, 30, 40, 50, 60, 70]`

If we want to find `50`:

1. Find the middle element → `40`
2. Since `50 > 40`, ignore the left half.
3. Search in `[50, 60, 70]`
4. The middle element is `60`.
5. Since `50 < 60`, search the left half.
6. We find `50`.

## C++ Implementation

```cpp
#include <iostream>
using namespace std;

int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == target)
            return mid;

        if (arr[mid] < target)
            low = mid + 1;
        else
            high = mid - 1;
    }

    return -1;
}

int main() {
    int arr[] = {10, 20, 30, 40, 50, 60, 70};
    int n = 7;

    int target = 50;

    int result = binarySearch(arr, n, target);

    if (result != -1)
        cout << "Element found at index " << result;
    else
        cout << "Element not found";

    return 0;
}
```

## Time Complexity

* **Best Case:** `O(1)`
* **Average Case:** `O(log n)`
* **Worst Case:** `O(log n)`

## Space Complexity

* **O(1)** for the iterative implementation.

## Important Point

Binary Search works only when the data is **sorted**.

It is much faster than Linear Search for large sorted datasets because it eliminates half of the remaining elements after every comparison.
