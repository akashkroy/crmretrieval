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

	sftp.connect(crmConfig).then(() => {
		logEntry('info', `connected to ${config.destination.host}`);
		return sftp.list(ordersUrl);

	}).then((data) => {	
		fileList = [];
		Object.entries(data).forEach(([key, val]) => {
			fileList.push(val['name']);
		});

		// TODO: https://www.sitepoint.com/using-node-mysql-javascript-client/
		// Start here. Let's loop through the array, check to see if file has already been imported
		// If so, drop from array

		//sftp.fastGet(ordersUrl + 'daily.csv', localUrl + 'daily.csv');
		fileList.forEach((file) => {
			if (file.endsWith('.csv')) {
				logEntry('info', `found file ${file}`);
				sftp.fastGet(ordersUrl + file, localUrl + file);
				logEntry('info', `downloaded file ${file}`);

				// INSERT a log entry into the new sales_file_import database
			}
		})

	}).catch((err) => {
		console.log(err, 'catch error');
	});
// });

// cronJob.start();
