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

const logDownload = (filename) => {
	con.query(
	  `SET @import_log_id = 0; CALL logFileImport('${filename}', 2, 1, 1, @import_log_id ); SELECT @import_log_id`,
	  (err, results) => {
		if (err) {
			log.logEntry('error', `Error logging download in database: ${err}`);
			return;
		}
	  }
	)
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
	logDownload: logDownload,
	wasFilePreviouslyImported: wasFilePreviouslyImported
}