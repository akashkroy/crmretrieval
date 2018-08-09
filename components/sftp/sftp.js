const client = require('ssh2-sftp-client');
const csv = require('../csv/csv');
const db = require('../db/db');
const files = require('../files/files');
const log = require('../log/log');
const sftpconfig = require('./sftpconfig.json');

// Set up SFTP variables and config
let sftpcrm = new client();

const crmSftp = {
	host: sftpconfig.crm.host,
	port: sftpconfig.crm.port,
	username: sftpconfig.crm.username,
	password: sftpconfig.crm.password
};

const ordersUrl = sftpconfig.crm.ordersdir;
const localUrl = sftpconfig.local.downloadDestination;

// Connect and retrieve
const connectAndRetrieve = () => {
	log.logEntry('info', `attempting to connnect to ${sftpconfig.crm.host}`);

	sftpcrm.connect(crmSftp).then(() => {	
		log.logEntry('info', `connected to ${sftpconfig.crm.host}`);
		return sftpcrm.list(ordersUrl);
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
	})
}

const importFile = (file) => {
	log.logEntry('info', `Found remote file ${file}`);	
	
	return files.isFileCSV(file).then((result) => {		
		result = result.toLowerCase();
		return result;
	}).then((result) => {
		if (result === 'false') {			
			log.logEntry('info', `${file} is not a CSV file. Skipping file.`);			
		} else if (result === 'true') {	
			importLogId = 0;
			log.logEntry('info', `${file} is a CSV file.`);		
			return db.wasFilePreviouslyImported(file)
				.then((result) => {
					return result.toLowerCase();
			}).then((result) => {												
				switch(result) {										
					case 'false':
						return sftpcrm.fastGet(ordersUrl + file, localUrl + file)
							.then((result) => {
								return db.logDownload(file);
							}).then((result) => {
								importLogId = result;
								return importLogId;
							})
						break;
					case 'true':
						log.logEntry('info', `${file} has already been imported. Skipping file.`);
						break;
					default:
						log.logEntry('info', `Unknown error checking database for record of previous import of ${file} .`);
				}
				return importLogId;			
			}).then((result) => {
				if ( result != 0 ) {					
					log.logEntry('info', `Begin database import of ${file}.`);
					let importResult = csv.importCSV(result, localUrl + file);
					// TODO
					//console.log(importResult); // Returns true or false
					// Log import result
					// If successful, update database record for this file
				}				
			})
		}				
	})				
}

module.exports = {
	connectAndRetrieve: connectAndRetrieve,
	importFile: importFile
}