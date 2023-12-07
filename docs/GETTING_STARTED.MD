# Getting Started with Nest.js Movie App

This guide will help you get started with the Nest.js Movie App, including running the app, executing tests, and importing a collection.json file for testing with Insomnia.

## Prerequisites

Before getting started, ensure you have the following prerequisites installed on your system:

- [Node.js](https://nodejs.org/)
- [Mongo DB](https://nodejs.org/)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/FahadMajed/movie-app
```

Navigate to the project directory:

```bash
cd movies-app
```

install dependencies:

```bash
npm install
```

run the app:

```bash
npm run start:dev
```

running the tests (a total of 34 test cases)

```bash
npm run test
```

## Importing Collection.json for Testing with Insomnia

To simplify API testing, you can import the provided `collection.json` file into [Insomnia](https://insomnia.rest/), a popular REST API client. Follow these steps:

1. Download and install Insomnia.

2. Open Insomnia.

3. Click on "Import/Export" from the top menu.

4. Select "Import Data" and then "From File."

5. Browse and select the `collection.json` file from your project directory.

6. The collection will be imported with all the API endpoints and requests.
