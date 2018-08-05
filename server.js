const appconfig = require('./config/appconfig.json');
const cron = require('node-cron');
const fs = require ('fs');
const log = require('./components/log/log');
const sftp = require('./components/sftp/sftp');

const appName = appconfig.app.appName;

log.logEntry('info', `${appName} started`);

// Schedule the job

// const cronJob = cron.schedule('* * * * *', function() {
// console.log('Running task every minute');

console.log('Application started.');

// cronJob.start();
sftp.connectAndRetrieve();

// Parse CSV with Node

// Create stored procedure to load data

// Load all CSV data from array into SQL, log result

// Call sproc to load file; log result

// Create staging table mimicking load file file format

// Write sproc to load data to staging table; delete from import

// Call sproc to load data to staging table; log the load

// Insert record into another table that indicates this prerequisite is loaded and ready; not yet merged into final load file

// Compare results to manually-generated file (have to create a copy of legacy FileCheck.py without other loads and all of anon's transforms)

