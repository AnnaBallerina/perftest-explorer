

# Performance Test Results Viewer

A clean, minimal React app that fetches performance test results from your API and displays them in a browsable list with detail pages.

## Page 1: Test Results List
- Fetch data from `perftest.test.com` on page load
- Display results in a clean list/table with key info (test name, status, duration, etc.)
- Each item is clickable and navigates to a detail page
- Loading and error states for the API call

## Page 2: Test Detail View
- When an item is clicked, navigate to a detail page
- Fetch detailed data from `perftest.test.com/perftest` for the selected item
- Display full test result details (metrics, timestamps, status, etc.)
- Back button to return to the list

## Technical Approach
- React Router for navigation between list and detail pages
- TanStack Query for API data fetching with caching
- Clean card-based layout with minimal styling
- Proper loading spinners and error handling

