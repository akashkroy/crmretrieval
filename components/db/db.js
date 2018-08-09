const mysql = require('mysql');
const dbconfig = require('./dbconfig.json');
const log = require('../log/log');
const sftp = require('../sftp/sftp');

const con = mysql.createConnection({
	host: dbconfig.importdb.host,
	user: dbconfig.importdb.user,
	password: dbconfig.importdb.password,
	database: dbconfig.importdb.database,
	multipleStatements: true
});

con.connect((err) => {
	if (err) {
		log.logEntry('error', `Error attempting to connnect to database: ${err}`);
		return;
	}
	log.logEntry('info', 'Connected to database');
});

const crmRecordImport = (importLogId, sourceFileId, recordArray) => {	
	return new Promise( (resolve, reject) => {
		// This is pretty ugly. Refactor
		con.query(
			`SET @crmDataImportId = 0; CALL crmFileImport(
				'${recordArray['order_num']}' 
				, '''${recordArray['first_name']}'''
				, '''${recordArray['last_name']}'''
				, '''${recordArray['address_1']}'''
				, '''${recordArray['address_2']}'''
				, '''${recordArray['city']}'''
				, '''${recordArray['state']}'''
				, '''${recordArray['zip']}'''
				, '${recordArray['date_of_birth']}'
				, '''${recordArray['home_phone']}'''
				, '''${recordArray['email']}'''
				, '${recordArray['cc_first_six']}'
				, '''${recordArray['cc_last_four']}'''
				, '${recordArray['exp_date'].replace('/','')}'
				, '${recordArray['sale_date']}'
				, '''${recordArray['sales_person']}'''
				, '''${recordArray['closer']}'''
				, ${recordArray['product_id']}
				, ${importLogId}
				, @crmDataImportId
				); SELECT @crmDataImportId`,
			(err, results) => {
				if (err) {
					console.log('error', err);
				} else {
					console.log('success', results);
				}
			})
	});
}
const logDownload = (filename) => {
	const sourceFileId = dbconfig.sourcefileid.crmdaily;

	return new Promise( (resolve, reject) => {
		con.query(
		  `SET @import_log_id = 0; CALL logFileImport('${filename}', ${sourceFileId}, 1, @import_log_id ); SELECT @import_log_id`,
		  (err, results) => {
			if (err) {
				log.logEntry('error', `Error logging download in database: ${err}`);
				reject(Error('false'));
			} else {
				log.logEntry('info', `Downloaded file ${filename}.`);
				result = results[2][0]['@import_log_id'];
				resolve(result);
			}
	  	})		
	});
}

const wasFilePreviouslyImported = (filename) => {		
	// Return a new promise
	return new Promise( (resolve, reject) => {
		// Core function
		con.query(`CALL wasFileImported('${filename}')`, (err, results) => {			
			if (err) {
				log.logEntry('error', `Error searching database: ${err}`);
				reject(Error('false'));
			} else {
				result = results[0][0]['importCheck'];
				resolve(result);
			}
		})
	});
}

module.exports = {
	con: con,
	crmRecordImport: crmRecordImport,
	// getCRMHeaderRow: getCRMHeaderRow,
	logDownload: logDownload,
	wasFilePreviouslyImported: wasFilePreviouslyImported
}