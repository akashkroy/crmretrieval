// BASE SETUP
// =====================================================
const client = require('ssh2-sftp-client');
const config = require('./config/config.json');
const cron = require('node-cron');
const express = require('express');
const fs = require ('fs');
const mysql = require('mysql');
const winston = require('winston'),
	expressWinston = require('express-winston');
// =====================================================

const appName = config.app.appName;
const app = express();
const router = express.Router();

// Logging
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: config.app.logFileError, level: 'error' }),
		new winston.transports.File({ filename: config.app.logFileInfo })
	]
});

const currentDateTime = () => {
	return new Date().toISOString();
}

const logEntry = (level, message) => {
	logger.log({
		level: level,	
		message: currentDateTime() + ' ' + message 
	})	
}

logEntry('info', `${appName} started`);

// SQL
const con = mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database,
	multipleStatements: true
});

con.connect((err) => {
	if (err) {
		logEntry('error', `Error attempting to connnect to database: ${err}`);
		return;
	}
	logEntry('info', 'Connected to database');
});

const logDownload = (filename) => {
	con.query(
	  `SET @import_log_id = 0; CALL logFileImport('${filename}', 2, 1, 1, @import_log_id ); SELECT @import_log_id`,
	  (err, results) => {
		if (err) {
			logEntry('error', `Error logging download in database: ${err}`);
			return;
		}
	  }
	)
}

const isFileCSV = (filename) => {
	return new Promise( (resolve, reject) => {
		if (filename.endsWith('.csv')) {
			result = 'true';
			resolve(result);
		} else {
			result = 'false';
			resolve(result);
		}
	});
}

const wasFilePreviouslyImported = (filename) => {		
	// Return a new promise
	return new Promise( (resolve, reject) => {
		// Core function
		con.query(`CALL wasFileImported('${filename}')`, (err, results) => {			
			if (err) {
				logEntry('error', `Error searching database: ${err}`);
				reject(Error('false'));
			} else {
				result = results[0][0]['importCheck'];
				resolve(result);
			}
		})
	});
}

const importFile = (file) => {
	logEntry('info', `Found remote file ${file}`);	
	
	return isFileCSV(file).then((result) => {		
		result = result.toLowerCase();
		return result;
	}).then((result) => {
		if (result === 'false') {			
			logEntry('info', `${file} is not a CSV file. Skipping file.`);			
		} else if (result === 'true') {	
			logEntry('info', `${file} is a CSV file.`);		
			return wasFilePreviouslyImported(file).then((result) => {
				return result.toLowerCase();
			}).then((result) => {
				switch(result) {
					case 'false':
						sftp.fastGet(ordersUrl + file, localUrl + file);
						logDownload(file);
						break;
					case 'true':
						logEntry('info', `${file} has already been imported. Skipping file.`);
						break;
					default:
						logEntry('info', `Unknown error checking database for record of previous import of ${file} .`);	
				}			
			})	
			// First, let's move some stuff (logging) into separate files

			// Create load table for file

			// Write stored procedure to import file to table

			// Call sproc to load file; log result

			// Create staging table mimicking load file file format

			// Write sproc to load data to staging table; delete from import

			// Call sproc to load data to staging table; log the load

			// Insert record into another table that indicates this prerequisite is loaded and ready; not yet merged into final load file

			// Compare results to manually-generated file (have to create a copy of legacy FileCheck.py without other loads and all of anon's transforms)

			//
		}
				
	})				
}

// Set up SFTP variables and config
let sftp = new client();

const crmConfig = {
	host: config.destination.host,
	port: config.destination.port,
	username: config.destination.username,
	password: config.destination.password
};

const ordersUrl = config.destination.ordersdir;
const localUrl = config.local.downloadDestination;

// Schedule the job

// const cronJob = cron.schedule('* * * * *', function() {
// 	console.log('Running task every minute');

	// Connect and retrieve
logEntry('info', `attempting to connnect to ${config.destination.host}`);
console.log('Application started.');

sftp.connect(crmConfig).then(() => {	
	logEntry('info', `connected to ${config.destination.host}`);
	return sftp.list(ordersUrl);
}).then((data) => {
	fileList = [];
	Object.entries(data).forEach(([key, val]) => {
		fileList.push(val['name']);
	});
	return fileList;
}).then((fileList) => {
	let promiseChain = Promise.resolve()

	fileList.forEach((file) => {
		promiseChain = promiseChain.then(() => {
			return importFile(file)
		})
	})
});


// cronJob.start();
