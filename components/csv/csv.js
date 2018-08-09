const csvconfig = require('./csvconfig.json');
const db = require('../db/db');
const fs = require('fs');
const url = require('url');

const importCSV = (importLogId, file) => {	
	let crmHeaderRowJson = csvconfig.crmcsvheader;
	const crmHeaderRow = Object.keys(crmHeaderRowJson).map(function(k) { return crmHeaderRowJson[k] });
	console.log('csv.importCSV importLogId: ', importLogId);
	try {
		fs.readFile(file, (error, data) => {
			if (error) {
				return console.log(error);
			}

			let arr = [];			
			let bufferString;
			let jsonObj = [];

			bufferString = data.toString();
			
			// Store info for each row as a string in an object
			arr = bufferString.split('\n');

			for (i=0; i < arr.length; i++) {
				var dataFromArray = arr[i].split(',');
				var obj = {};

				for (j = 0; j < dataFromArray.length; j++) {
					obj[crmHeaderRow[j].trim()] = dataFromArray[j].trim();
				}
				jsonObj.push(obj);
			}

			//db.crmRecordImport(1, jsonObj[0]);


			// for (i=0; i < jsonObj.length; i++) {
			// 	//CALL crmCSVHeaderRow(8)	
			// }
			
		})

		// Next loop through and call sproc to insert each row into database

		return('true');	
	} catch (error) {
		console.log(error);
		return('false');
	}
};

module.exports = {
	importCSV: importCSV
}