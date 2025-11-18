const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const compartmentsData = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance'
];

const usersData = {
  'Engineering': [
    { id: 1, name: 'John Doe', email: 'john.doe@company.com' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com' },
    { id: 3, name: 'Bob Wilson', email: 'bob.wilson@company.com' },
    { id: 4, name: 'Alice Johnson', email: 'alice.johnson@company.com' }
  ],
  'Marketing': [
    { id: 5, name: 'Sarah Brown', email: 'sarah.brown@company.com' },
    { id: 6, name: 'Michael Davis', email: 'michael.davis@company.com' },
    { id: 7, name: 'Emma Taylor', email: 'emma.taylor@company.com' }
  ],
  'Sales': [
    { id: 8, name: 'David Lee', email: 'david.lee@company.com' },
    { id: 9, name: 'Laura Martinez', email: 'laura.martinez@company.com' },
    { id: 10, name: 'Chris Anderson', email: 'chris.anderson@company.com' },
    { id: 11, name: 'Sophie White', email: 'sophie.white@company.com' }
  ],
  'Human Resources': [
    { id: 12, name: 'Rachel Green', email: 'rachel.green@company.com' },
    { id: 13, name: 'Tom Harris', email: 'tom.harris@company.com' }
  ],
  'Finance': [
    { id: 14, name: 'Kevin Miller', email: 'kevin.miller@company.com' },
    { id: 15, name: 'Lisa Thompson', email: 'lisa.thompson@company.com' },
    { id: 16, name: 'Mark Wilson', email: 'mark.wilson@company.com' }
  ]
};

app.get('/api/compartments', (req, res) => {
  setTimeout(() => {
    res.json(compartmentsData);
  }, 300);
});

app.get('/api/users', (req, res) => {
  const compartment = req.query.compartment;
  
  if (!compartment) {
    return res.status(400).json({ error: 'Compartment parameter is required' });
  }
  
  const users = usersData[compartment] || [];
  
  setTimeout(() => {
    res.json(users);
  }, 500);
});

const angularDistPath = path.join(__dirname, 'compartment-users-app', 'dist', 'compartment-users-app', 'browser');

app.use(express.static(angularDistPath));

app.use((req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Serving Angular app from:', angularDistPath);
  console.log('API endpoints:');
  console.log(`  GET /api/compartments`);
  console.log(`  GET /api/users?compartment=<compartment_name>`);
});
