const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');

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

app.post('/api/sync', async (req, res) => {
  const formState = req.body;
  
  console.log('\n=== Form State Sync ===');
  console.log('Timestamp:', formState.timestamp);
  console.log('Compartment:', formState.compartment);
  console.log('Selected Users:', formState.selectedUsers?.length || 0);
  console.log('User Details:', JSON.stringify(formState.selectedUsers, null, 2));
  
  const externalApiUrl = process.env.EXTERNAL_API_URL;
  
  if (externalApiUrl) {
    console.log(`Forwarding to external API: ${externalApiUrl}`);
    
    try {
      const url = new URL(externalApiUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      const postData = JSON.stringify(formState);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const forwardRequest = new Promise((resolve, reject) => {
        const proxyReq = protocol.request(options, (proxyRes) => {
          let data = '';
          proxyRes.on('data', chunk => data += chunk);
          proxyRes.on('end', () => {
            if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
              resolve({ success: true, statusCode: proxyRes.statusCode, data });
            } else {
              reject(new Error(`External API returned status ${proxyRes.statusCode}`));
            }
          });
        });
        
        proxyReq.on('error', reject);
        proxyReq.write(postData);
        proxyReq.end();
      });
      
      await forwardRequest;
      console.log('Successfully forwarded to external API');
      console.log('======================\n');
      
      res.json({ 
        success: true, 
        message: 'Form state synced successfully to external API',
        receivedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error forwarding to external API:', error.message);
      console.log('======================\n');
      
      res.status(500).json({
        success: false,
        message: 'Failed to sync with external API',
        error: error.message
      });
    }
  } else {
    console.log('No EXTERNAL_API_URL configured, logging only');
    console.log('======================\n');
    
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Form state logged successfully (no external API configured)',
        receivedAt: new Date().toISOString()
      });
    }, 200);
  }
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
