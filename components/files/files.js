const log = require('../log/log');
const sftp = require('../sftp/sftp');

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

module.exports = {
	isFileCSV: isFileCSV
}