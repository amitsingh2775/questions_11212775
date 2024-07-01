const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;
const windowSize = 10;
let window = [];
let authToken = '';

const credentials = {
  companyName: 'buddyTalk',
  clientID: '7d4ac4af-356d-495c-b758-91d3dc34d354',
  clientSecret: 'MYGygQJeazvgcFAA',
  ownerName: 'amit kumar',
  ownerEmail: 'amitsinghbadram@gmail.com',
  rollNo: '11212775'
};

const testServerURL = 'http://20.244.56.144/test';

const authenticateAndGetToken = async () => {
  try {
    const authResponse = await axios.post(`${testServerURL}/auth`, {
      ...credentials
    });
    authToken = authResponse.data.access_token;
    console.log('Authentication successful. Token:', authToken);
  } catch (error) {
    throw new Error(`Error authenticating and getting token: ${error.message}`);
  }
};

const fetchNumbers = async (type) => {
  try {
    const response = await axios.get(`${testServerURL}/${type}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 500
    });

    const numbers = response.data.numbers;
    const uniqueNumbers = Array.from(new Set(numbers));

    uniqueNumbers.forEach((num) => {
      if (!window.includes(num)) {
        if (window.length >= windowSize) {
          window.shift();
        }
        window.push(num);
      }
    });

    const windowPrevState = [...window];
    const windowCurrState = [...window];
    const avg = calculateAverage(windowCurrState);

    return {
      numbers,
      windowPrevState,
      windowCurrState,
      avg
    };
  } catch (error) {
    throw new Error(`Error fetching ${type} numbers: ${error.message}`);
  }
};

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return (sum / numbers.length).toFixed(2);
};

// Endpoint to handle requests
app.get('/numbers/:numberid', async (req, res) => {
  const numberID = req.params.numberid;

  if (!['p', 'f', 'e', 'r'].includes(numberID)) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  const type = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
  }[numberID];

  try {
    const result = await fetchNumbers(type);
    res.json(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch numbers' });
  }
});

// Start the server and authenticate
app.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
  
  try {
    await authenticateAndGetToken();
  } catch (error) {
    console.error('Error authenticating and starting server:', error.message);
    process.exit(1); // Exit the process on critical errors
  }
});
