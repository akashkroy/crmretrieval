CREATE DATABASE sales_file_import;

USE sales_file_import;
CREATE USER user;
GRANT SELECT, INSERT, DELETE, UPDATE, EXECUTE ON sales_file_import.* to 'user'@'localhost' IDENTIFIED BY 'password';

DROP TABLE IF EXISTS `source`;

CREATE TABLE IF NOT EXISTS `source` (
	source_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	source_name VARCHAR(50) NOT NULL,
	source_descr VARCHAR(255),
	active TINYINT(1) NOT NULL,
	CONSTRAINT uc_source__source_name UNIQUE ( source_name )
);

INSERT INTO source ( source_name, source_descr, active ) VALUES( 'ABC', 'ABC Company (internal)', 1 );
INSERT INTO source ( source_name, source_descr, active ) VALUES( 'CRM', 'Some Name CRM', 1 );

DROP TABLE IF EXISTS `file_type`;

CREATE TABLE IF NOT EXISTS `file_type` (
	file_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	file_type VARCHAR(25),
	CONSTRAINT uc_file__type_file_type UNIQUE ( file_type )
);

INSERT INTO file_type ( file_type ) VALUES( 'csv' );
INSERT INTO file_type ( file_type ) VALUES( 'sql' );
INSERT INTO file_type ( file_type ) VALUES( 'txt' );

DROP TABLE IF EXISTS `file_function`;

CREATE TABLE IF NOT EXISTS `file_function` (
	file_function_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	file_function VARCHAR(25) NOT NULL,
	file_function_descr VARCHAR(255),
	CONSTRAINT uc_file_function__file_function UNIQUE ( file_function )
);

INSERT INTO file_function ( file_function, file_function_descr ) VALUES( 'prerequisite', 'Input for a load file' );
INSERT INTO file_function ( file_function, file_function_descr ) VALUES( 'load file', 'Loaded into sales system' );

DROP TABLE IF EXISTS `source_file`;

CREATE TABLE IF NOT EXISTS `source_file` (
	source_file_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	source_file_name_body VARCHAR(50) NOT NULL,
	source_id INT UNSIGNED NOT NULL,
	file_type_id INT UNSIGNED NOT NULL,
	file_function_id INT UNSIGNED NOT NULL,
	active TINYINT(1) NOT NULL,
	CONSTRAINT fk_source_file__file_type_id FOREIGN KEY (file_type_id) REFERENCES file_type(file_type_id),
	CONSTRAINT fk_source_file__source_id FOREIGN KEY (source_id) REFERENCES source(source_id),
	CONSTRAINT fk_source_file__file_function_id FOREIGN KEY (file_function_id) REFERENCES file_function(file_function_id)
);

SELECT source_id INTO @sourceABC FROM source WHERE source_name = 'ABC';
SELECT source_id INTO @sourceCRM FROM source WHERE source_name = 'CRM';
SELECT file_type_id INTO @fileTypeCSV FROM file_type WHERE file_type = 'csv';
SELECT file_type_id INTO @fileTypeSQL FROM file_type WHERE file_type = 'sql';
SELECT file_type_id INTO @fileTypeTXT FROM file_type WHERE file_type = 'txt';
SELECT file_function_id INTO @fileFunctionPrereq FROM file_function WHERE file_function = 'prerequisite';
SELECT file_function_id INTO @fileFunctionLoad FROM file_function WHERE file_function = 'load file';

INSERT INTO source_file ( source_file_name_body, source_id, file_type_id, file_function_id, active ) 
VALUES( 'InternalFile1 Sales', @sourceABC, @fileTypeTXT, @fileFunctionLoad, 1 );

INSERT INTO source_file ( source_file_name_body, source_id, file_type_id, file_function_id, active ) 
VALUES( '_InternalFile2 Sales', @sourceABC, @fileTypeSQL, @fileFunctionPrereq, 1 );

INSERT INTO source_file ( source_file_name_body, source_id, file_type_id, file_function_id, active ) 
VALUES( 'daily', @sourceCRM, @fileTypeCSV, @fileFunctionPrereq, 1 );

DROP TABLE IF EXISTS `source_file_prerequisite`;

CREATE TABLE IF NOT EXISTS `source_file_prerequisite` (
	source_file_prerequisite_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	source_file_load_id INT UNSIGNED NOT NULL,
	source_file_prereq_id INT UNSIGNED NOT NULL,	
	active TINYINT(1) NOT NULL,
	CONSTRAINT fk_source_file_prequisite__source_file_load_id FOREIGN KEY (source_file_load_id) REFERENCES source_file(source_file_id),
	CONSTRAINT fk_source_file_prequisite__source_file_prereq_id FOREIGN KEY (source_file_prereq_id) REFERENCES source_file(source_file_id)
);

SELECT source_file_id INTO @fileInternalFile1 FROM source_file WHERE source_file_name_body = 'InternalFile1 Sales';
SELECT source_file_id INTO @fileInternalFile2 FROM source_file WHERE source_file_name_body = '_InternalFile2 Sales';
SELECT source_file_id INTO @fileCRM FROM source_file WHERE source_file_name_body = 'daily';

INSERT INTO source_file_prerequisite ( source_file_load_id, source_file_prereq_id, active ) VALUES ( @fileInternalFile1, @fileInternalFile2, 1 );
INSERT INTO source_file_prerequisite ( source_file_load_id, source_file_prereq_id, active ) VALUES ( @fileInternalFile1, @fileCRM, 1 );

DROP TABLE IF EXISTS `day_of_week`;

CREATE TABLE IF NOT EXISTS `day_of_week` (
	day_of_week_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	day_abbrev VARCHAR(3) NOT NULL,
	day_name VARCHAR(9) NOT NULL,
	sort_order INT NOT NULL,
	CONSTRAINT uc_dayAbbrev UNIQUE ( day_abbrev ),
	CONSTRAINT uc_dayName UNIQUE ( day_name )
);

INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Sun', 'Sunday', 1 );
INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Mon', 'Monday', 2 );
INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Tue', 'Tuesday', 3 );
INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Wed', 'Wednesday', 4 );
INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Thu', 'Thursday', 5 );
INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Fri', 'Friday', 6 );
INSERT INTO day_of_week ( day_abbrev, day_name, sort_order ) VALUES( 'Sat', 'Saturday', 7 );

DROP TABLE IF EXISTS `source_file_day`;

CREATE TABLE IF NOT EXISTS `source_file_day` (
	source_file_day_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	source_file_id INT UNSIGNED NOT NULL,
	day_of_week_id INT UNSIGNED NOT NULL,
	active TINYINT(1),
	CONSTRAINT fk_source_file_day__source_file_id FOREIGN KEY (source_file_id) REFERENCES source_file(source_file_id),
	CONSTRAINT fk_source_file_day__day_of_week_id FOREIGN KEY (day_of_week_id) REFERENCES day_of_week(day_of_week_id),
	UNIQUE ucSourceFileIdDayOfWeekId ( source_file_id, day_of_week_id )	
);

INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 1, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 2, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 3, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 4, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 5, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 6, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile1, 7, 1 );

INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 1, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 2, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 3, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 4, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 5, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 6, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileInternalFile2, 7, 1 );

INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 1, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 2, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 3, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 4, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 5, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 6, 1 );
INSERT INTO source_file_day ( source_file_id, day_of_week_id, active ) VALUES( @fileCRM, 7, 1 );

/* VERIFY */
/*
SELECT
	s.source_name
	, dow.day_abbrev
	, sf.source_file_name_body
	, ff.file_function
	, sf2.source_file_name_body AS prerequisite	
FROM source_file AS sf
LEFT JOIN source_file_day AS sfd 
	ON sf.source_file_id = sfd.source_file_id
LEFT JOIN day_of_week AS dow
	ON sfd.day_of_week_id = dow.day_of_week_id
LEFT JOIN source AS s
	ON sf.source_id = s.source_id
LEFT JOIN source_file_prerequisite AS sfp
	ON sf.source_file_id = sfp.source_file_load_id
LEFT JOIN source_file AS sf2 
	ON sfp.source_file_prereq_id = sf2.source_file_id
LEFT JOIN file_function AS ff
	ON sf.file_function_id = ff.file_function_id
ORDER BY
	s.source_name
	, sf.source_file_name_body
	, dow.sort_order
	, sf2.source_file_name_body
*/

DROP TABLE IF EXISTS `CRM_product`;

CREATE TABLE IF NOT EXISTS `CRM_product` (
	CRM_product_id INT(3) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	product_id INT NOT NULL,
	product_name VARCHAR(25) NOT NULL,
	active TINYINT(1) NOT NULL,
	CONSTRAINT uc_CRM_product__product_id UNIQUE ( product_id )
);

INSERT INTO CRM_product ( product_id, product_name, active ) VALUES( 3, 'CRM Product 1', 1 );
INSERT INTO CRM_product ( product_id, product_name, active ) VALUES( 9, 'CRM Product 2', 1 );

DROP TABLE IF EXISTS `import_status`;

CREATE TABLE IF NOT EXISTS `import_status` (
	import_status_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	status_name VARCHAR(25) NOT NULL,
	status_descr VARCHAR(50),
	sort_order INT NOT NULL
);

INSERT INTO import_status ( status_name, status_descr, sort_order ) VALUES( 'downloaded', 'Downloaded from source', 1);
INSERT INTO import_status ( status_name, status_descr, sort_order ) VALUES( 'import success', 'Imported successfully', 2);
INSERT INTO import_status ( status_name, status_descr, sort_order ) VALUES( 'import failed', 'WARNING: Import failed', 3);

DROP TABLE IF EXISTS `import_log`;

CREATE TABLE IF NOT EXISTS `import_log` (
	import_log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	import_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	file_name VARCHAR(255),
	source_id INT UNSIGNED NOT NULL,
	file_type_id INT UNSIGNED NOT NULL,
	import_status_id INT UNSIGNED NOT NULL,
	CONSTRAINT fk_import_log__file_type_id FOREIGN KEY (file_type_id) REFERENCES file_type(file_type_id),
	CONSTRAINT fk_import_log__source_id FOREIGN KEY (source_id) REFERENCES source(source_id),
	CONSTRAINT fk_import_log__import_status_id FOREIGN KEY (import_status_id) REFERENCES import_status(import_status_id)
);

DELIMITER $$
DROP PROCEDURE IF EXISTS `wasFileImported`$$

CREATE PROCEDURE `wasFileImported`(
	IN fileName VARCHAR(255))
/* TEST: CALL wasFileImported('daily072418')  */
BEGIN

	SELECT CASE WHEN COUNT(import_log_id) > 0
		THEN 'TRUE'
		ELSE 'FALSE'
		END AS importCheck
	FROM
		import_log
	WHERE	
		file_name IN(fileName);

END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `logFileImport`$$

CREATE PROCEDURE `logFileImport`(
	IN fileName VARCHAR(255),
	IN sourceID INT,
	IN fileTypeID INT,
	IN importStatusID INT,
	OUT import_log_id INT
)
/* TEST: SET @import_log_id = 0; CALL logFileImport('daily072418', 2, 1, 1, @import_log_id ); SELECT @import_log_id  */
BEGIN

	INSERT INTO import_log ( file_name, source_id, file_type_id, import_status_id )
	VALUES ( fileName, sourceID, fileTypeID, importStatusID );
	SET import_log_id = LAST_INSERT_ID();

END$$
DELIMITER ;


