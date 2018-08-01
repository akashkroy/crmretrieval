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

	   // console.log(results[2][0]['@import_log_id']);
	  }
	)
}

const isFileCSV = (filename) => {
	let result = '';

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


const wasFileImported = (filename) => {		
	// Return a new promise
	return new Promise( (resolve, reject) => {
		// Core function
		con.query(`CALL wasFileImported('${filename}')`, (err, results) => {
			console.log('02 Checking if file was previously imported.');	
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
		return fileList;
	}).then((fileList) => {
		fileList.forEach((file) => {

			isFileCSV(file).then((result) => {
				console.log(`01a File ${file} ends with csv? ${result}`);
				return result.toLowerCase();
			}).then((result) => {
				if (result === 'false') {
					console.log('01b Not csv, log it and skip to next: ', result);
					return;
				} else if (result === 'true') {
					console.log('01b It is csv, go to next: ', result)
				}
			}).then(() => {
				wasFileImported('file').then((result) => {
					console.log('03 checked import, result: ', result);
					return result.toLowerCase();
				}).then((result) => {
					switch(result) {
						case 'false':
							console.log('04a download file and log it');
							break;
						case 'true':
							console.log('04b skip it and log the skip');
							break;
						default:
							console.log('04c unknown error, log the skip');							
					}
					
				})				
			})		
		});
	});

		// fileList.forEach((file) => {

		// 	isFileCSV(file).then((result) => {
		// 		console.log(`01a File ${file} ends with csv? ${result}`);
		// 		return result.toLowerCase();
		// 	}).then((result) => {
		// 		if (result === 'false') {
		// 			console.log('01b Not csv, log it and skip to next: ', result);
		// 			return;
		// 		} else if (result === 'true') {
		// 			console.log('01b It is csv, go to next: ', result)
		// 		}
		// 	}).then(() => {
		// 		wasFileImported('file').then((result) => {
		// 			console.log('03 checked import, result: ', result);
		// 			return result.toLowerCase();
		// 		}).then((result) => {
		// 			switch(result) {
		// 				case 'false':
		// 					console.log('04a download file and log it');
		// 					break;
		// 				case 'true':
		// 					console.log('04b skip it and log the skip');
		// 					break;
		// 				default:
		// 					console.log('04c unknown error, log the skip');							
		// 			}
					
		// 		})				
		// 	})




				// 02 check if file was already imported



				// 05 next
			

				// downloadFile();

				// async function downloadFile() {
				// 	console.log('01 File ends with csv');
				// 	logEntry('info', `found file at CRM FTP site: ${file}`);

				// 	console.log('02 Calling importCheck function with filename ', file);
				// 	var importCheck = await wasFileImported(file);
				// 	console.log('06 importCheck variable: ', importCheck);

				// 	//console.log('importCheck: ', importCheck);
				// 	if ( importCheck === true) {
				// 		logEntry('info', `${file} previously imported. Skipping.`);
				// 	} else {
				// 		sftp.fastGet(ordersUrl + file, localUrl + file);
				// 		logEntry('info', `downloaded file ${file}`);
				// 		logDownload(file);
				// 	};					
				// }

	// 	})

	// }).catch((err) => {
	// 	console.log(err, 'catch error');
	// });
// });

// cronJob.start();
