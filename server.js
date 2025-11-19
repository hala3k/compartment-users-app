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
    { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com', isGroup: false, organisationName: 'Tech Corp', organisationId: 'org-1' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@company.com', isGroup: false, organisationName: 'Tech Corp', organisationId: 'org-1' },
    { id: 'group-1', name: 'Dev Team', email: 'dev-team@company.com', isGroup: true, organisationName: 'Tech Corp', organisationId: 'org-1' },
    { id: 'user-3', name: 'Bob Wilson', email: 'bob.wilson@company.com', isGroup: false, organisationName: 'Tech Corp', organisationId: 'org-1' },
    { id: 'user-4', name: 'Alice Johnson', email: 'alice.johnson@company.com', isGroup: false, organisationName: 'Tech Corp', organisationId: 'org-1' }
  ],
  'Marketing': [
    { id: 'user-5', name: 'Sarah Brown', email: 'sarah.brown@company.com', isGroup: false, organisationName: 'Marketing Inc', organisationId: 'org-2' },
    { id: 'user-6', name: 'Michael Davis', email: 'michael.davis@company.com', isGroup: false, organisationName: 'Marketing Inc', organisationId: 'org-2' },
    { id: 'group-2', name: 'Marketing Team', email: 'marketing-team@company.com', isGroup: true, organisationName: 'Marketing Inc', organisationId: 'org-2' },
    { id: 'user-7', name: 'Emma Taylor', email: 'emma.taylor@company.com', isGroup: false, organisationName: 'Marketing Inc', organisationId: 'org-2' }
  ],
  'Sales': [
    { id: 'user-8', name: 'David Lee', email: 'david.lee@company.com', isGroup: false, organisationName: 'Sales Pro', organisationId: 'org-3' },
    { id: 'user-9', name: 'Laura Martinez', email: 'laura.martinez@company.com', isGroup: false, organisationName: 'Sales Pro', organisationId: 'org-3' },
    { id: 'user-10', name: 'Chris Anderson', email: 'chris.anderson@company.com', isGroup: false, organisationName: 'Sales Pro', organisationId: 'org-3' },
    { id: 'user-11', name: 'Sophie White', email: 'sophie.white@company.com', isGroup: false, organisationName: 'Sales Pro', organisationId: 'org-3' }
  ],
  'Human Resources': [
    { id: 'user-12', name: 'Rachel Green', email: 'rachel.green@company.com', isGroup: false, organisationName: 'HR Solutions', organisationId: 'org-4' },
    { id: 'user-13', name: 'Tom Harris', email: 'tom.harris@company.com', isGroup: false, organisationName: 'HR Solutions', organisationId: 'org-4' }
  ],
  'Finance': [
    { id: 'user-14', name: 'Kevin Miller', email: 'kevin.miller@company.com', isGroup: false, organisationName: 'Finance Group', organisationId: 'org-5' },
    { id: 'user-15', name: 'Lisa Thompson', email: 'lisa.thompson@company.com', isGroup: false, organisationName: 'Finance Group', organisationId: 'org-5' },
    { id: 'user-16', name: 'Mark Wilson', email: 'mark.wilson@company.com', isGroup: false, organisationName: 'Finance Group', organisationId: 'org-5' }
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
