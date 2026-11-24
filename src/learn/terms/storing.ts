import type { Term } from '../glossary';

/** Words the storing lessons explain. */
export const storingTerms: Term[] = [
	{
		id: 'relational-database',
		term: 'Relational database',
		meaning:
			'Another name for an SQL database: one that keeps data in tables, linked to each other by keys.',
		forms: ['relational database', 'relational databases'],
	},
	{
		id: 'table',
		term: 'Table',
		meaning:
			'In an SQL database, a set of rows that all have the same columns, like one sheet of a spreadsheet: one table for orders, another for products.',
		like: 'One sheet in a spreadsheet.',
		forms: ['table', 'tables'],
	},
	{
		id: 'row',
		term: 'Row',
		meaning: 'One entry in a table, like one order, with a value in each column.',
		forms: ['row', 'rows'],
	},
	{
		id: 'column',
		term: 'Column',
		meaning:
			'One fact that every row in a table has, like a price or a date. Each column has a type: a number, some text, a date.',
		forms: ['column', 'columns'],
	},
	{
		id: 'primary-key',
		term: 'Primary key',
		meaning:
			'The column, or columns, that pick out one row in a table, like the order number. No two rows can share it.',
		like: 'A car’s number plate.',
		forms: ['primary key', 'primary keys'],
	},
	{
		id: 'foreign-key',
		term: 'Foreign key',
		meaning:
			'A column that points at a row in another table by its primary key, like an order saying “shopper 1042”. The database can refuse one that points at nothing.',
		forms: ['foreign key', 'foreign keys'],
	},
	{
		id: 'schema',
		term: 'Schema',
		meaning:
			'The declared shape of the data: what it holds, the type of each part, and the rules it must follow. In an SQL database, that’s its tables and their columns.',
		like: 'The printed boxes on a form: every answer has its place.',
		forms: ['schema', 'schemas'],
	},
	{
		id: 'constraint',
		term: 'Constraint',
		meaning:
			'A rule in the schema that the database enforces, like “a price can’t be empty” or “stock can’t go below zero”. Changes that break it are refused.',
		forms: ['constraint', 'constraints'],
	},
	{
		id: 'schema-migration',
		term: 'Migration',
		meaning:
			'A small script that changes the shape of a database, like adding a column, run once, as part of releasing the code that needs it.',
		forms: ['migration', 'migrations'],
	},
	{
		id: 'acid',
		term: 'ACID',
		meaning:
			'What a database transaction promises: atomic (all or nothing), consistent (the rules still hold), isolated (kept apart from others) and durable (never lost once saved).',
		forms: ['acid'],
	},
	{
		id: 'normalised',
		term: 'Normalised',
		meaning:
			'Data kept so that each fact is stored once, in one place, and everything else points to it. Changing a fact means changing one row.',
		forms: ['normalised', 'normalise', 'normalising', 'normalisation', 'normalized'],
	},
	{
		id: 'denormalised',
		term: 'Denormalised',
		meaning:
			'Data with facts copied to where they’re read, so reading needs no joins. Quicker to read, but every copy has to change when the fact does.',
		like: 'Writing your address on every page of a form, instead of “see page 1”.',
		forms: ['denormalised', 'denormalise', 'denormalising', 'denormalisation', 'denormalized'],
	},
	{
		id: 'distributed-sql',
		term: 'Distributed SQL',
		meaning:
			'An SQL database that spreads its tables over many machines by itself, and keeps transactions working across them, like CockroachDB or Google Spanner.',
		forms: ['distributed sql'],
	},
	{
		id: 'key-value-store',
		term: 'Key-value store',
		meaning:
			'The simplest kind of database: each value is saved, found and deleted by its key, like a cart under cart:1042. Very fast, but it can’t search.',
		like: 'A coat check: hand over your ticket, get your coat.',
		forms: ['key-value store', 'key-value stores', 'key-value'],
	},
	{
		id: 'wide-column-store',
		term: 'Wide-column store',
		meaning:
			'A NoSQL database that keeps rows in partitions, each on one of many machines, with the rows inside kept sorted, like Cassandra. Built for huge numbers of writes, read by key.',
		forms: ['wide-column store', 'wide-column stores', 'wide-column'],
	},
	{
		id: 'graph-database',
		term: 'Graph database',
		meaning:
			'A database that keeps things as nodes and the links between them as edges, so following links many steps deep is quick, like Neo4j.',
		like: 'A map of who knows whom, with a line between each pair.',
		forms: ['graph database', 'graph databases'],
	},
	{
		id: 'search-engine',
		term: 'Search engine',
		meaning:
			'A store built for searching text: it finds words quickly, copes with typos, and puts the best matches first, like Elasticsearch.',
		forms: ['search engine', 'search engines'],
	},
	{
		id: 'inverted-index',
		term: 'Inverted index',
		meaning:
			'A list of every word, and the rows or documents it appears in. It’s how full-text search finds words without reading everything.',
		like: 'The index at the back of a book.',
		forms: ['inverted index', 'inverted indexes', 'full-text index', 'full-text indexes'],
	},
	{
		id: 'time-series-database',
		term: 'Time-series database',
		meaning:
			'A database for readings that arrive over time, like speeds or temperatures: kept in time order, packed tightly, and often thinned out as they age.',
		forms: ['time-series database', 'time-series databases', 'time-series', 'time series'],
	},
	{
		id: 'polyglot-persistence',
		term: 'Polyglot persistence',
		meaning: 'Using several kinds of database in one app, each for the data it suits best.',
		forms: ['polyglot persistence'],
	},
	{
		id: 'full-table-scan',
		term: 'Full table scan',
		meaning: 'Reading every row of a table to answer a question, because no index can help.',
		like: 'Reading a whole book to find one word.',
		forms: ['full table scan', 'full table scans'],
	},
	{
		id: 'composite-index',
		term: 'Composite index',
		meaning:
			'An index on two or more columns, sorted by the first, then the next. It helps questions that name its first columns.',
		like: 'A phone book, sorted by surname, then by first name.',
		forms: ['composite index', 'composite indexes'],
	},
	{
		id: 'leftmost-columns',
		term: 'Leftmost columns',
		meaning:
			'The first columns of a composite index. A question can only go straight to its rows if it names them.',
		forms: ['leftmost columns', 'leftmost prefix'],
	},
	{
		id: 'covering-index',
		term: 'Covering index',
		meaning:
			'An index that holds every column a question needs, so the database answers from the index alone, without reading the table.',
		forms: ['covering index', 'covering indexes', 'index-only scan'],
	},
	{
		id: 'clustered-index',
		term: 'Clustered index',
		meaning:
			'A table kept as a B-tree sorted by one key, usually its primary key, so a read by that key finds the whole row at once. MySQL’s InnoDB keeps every table this way.',
		forms: ['clustered index', 'clustered indexes'],
	},
	{
		id: 'query-plan',
		term: 'Query plan',
		meaning:
			'The steps a database chooses to answer a question: which indexes it uses, and in what order. EXPLAIN shows it.',
		forms: ['query plan', 'query plans'],
	},
	{
		id: 'hash-index',
		term: 'Hash index',
		meaning:
			'An index that turns each value into a number saying exactly where it is. One step for an exact match, but no ranges and no order.',
		forms: ['hash index', 'hash indexes'],
	},
	{
		id: 'storage-engine',
		term: 'Storage engine',
		meaning:
			'The part of a database that lays the data out on disk and finds it again, like InnoDB inside MySQL.',
		forms: ['storage engine', 'storage engines'],
	},
	{
		id: 'update-in-place',
		term: 'Update in place',
		meaning:
			'Changing data where it already sits on disk, instead of writing a new copy somewhere else.',
		forms: ['update in place', 'updates in place'],
	},
	{
		id: 'write-ahead-log',
		term: 'Write-ahead log',
		meaning:
			'A log on disk where a database writes down every change before making it. After a crash, it replays the log, so nothing committed is lost.',
		like: 'A shopkeeper writing each sale in a book before touching the till.',
		forms: ['write-ahead log', 'wal', 'redo log'],
	},
	{
		id: 'lsm-tree',
		term: 'LSM tree',
		meaning:
			'A storage engine that never changes data in place: writes go into memory, then into sorted files that are merged in the background. Quick to write, slower to read.',
		forms: ['lsm tree', 'lsm trees', 'log-structured merge tree'],
	},
	{
		id: 'memtable',
		term: 'Memtable',
		meaning:
			'The sorted table in memory where an LSM tree puts new writes, until it’s full and written to disk as a file.',
		forms: ['memtable'],
	},
	{
		id: 'sstable',
		term: 'SSTable',
		meaning:
			'A sorted string table: one of an LSM tree’s files on disk, its rows sorted by key, written once and never changed.',
		forms: ['sstable', 'sstables'],
	},
	{
		id: 'compaction',
		term: 'Compaction',
		meaning:
			'Merging an LSM tree’s files in the background, keeping only the newest version of each row and dropping deleted ones.',
		forms: ['compaction'],
	},
	{
		id: 'bloom-filter',
		term: 'Bloom filter',
		meaning:
			'A small summary of what a file holds. It can say “definitely not here” for sure, or “maybe here”, so most files can be skipped.',
		forms: ['bloom filter', 'bloom filters'],
	},
	{
		id: 'tombstone',
		term: 'Tombstone',
		meaning:
			'A marker saying a row was deleted, written instead of removing it, until compaction clears it away.',
		forms: ['tombstone', 'tombstones'],
	},
	{
		id: 'row-store',
		term: 'Row store',
		meaning:
			'A database that keeps each row’s columns together. Quick for reading or changing a few whole rows.',
		forms: ['row store', 'row stores'],
	},
	{
		id: 'column-store',
		term: 'Column store',
		meaning:
			'A database that keeps each column together. Quick for adding up a few columns over millions of rows, slow for changing one row.',
		forms: ['column store', 'column stores'],
	},
	{
		id: 'pessimistic-locking',
		term: 'Pessimistic locking',
		meaning: 'Locking a row before using it, so anyone else who wants it waits.',
		forms: ['pessimistic locking'],
	},
	{
		id: 'optimistic-locking',
		term: 'Optimistic locking',
		meaning:
			'Not locking, but checking at the end that nobody changed the row meanwhile, usually with a version number. If someone did, try again.',
		forms: ['optimistic locking'],
	},
	{
		id: 'lost-update',
		term: 'Lost update',
		meaning:
			'Two changes that each read a value and write it back, so the second wipes out the first.',
		forms: ['lost update', 'lost updates'],
	},
	{
		id: 'hot-row',
		term: 'Hot row',
		meaning:
			'One row that a great many requests change at once, like a sale item’s stock count. They queue for its lock.',
		forms: ['hot row', 'hot rows'],
	},
	{
		id: 'serializable',
		term: 'Serializable',
		meaning:
			'The strongest isolation: transactions that overlap give the same result as if they’d run one after another.',
		forms: ['serializable'],
	},
	{
		id: 'dirty-read',
		term: 'Dirty read',
		meaning:
			'Seeing another transaction’s change before it commits, when it may yet be undone.',
		forms: ['dirty read', 'dirty reads'],
	},
	{
		id: 'non-repeatable-read',
		term: 'Non-repeatable read',
		meaning:
			'Reading the same row twice in one transaction and getting different answers, because someone changed it in between.',
		forms: ['non-repeatable read', 'non-repeatable reads'],
	},
	{
		id: 'phantom',
		term: 'Phantom',
		meaning:
			'A row that appears or disappears between two reads of the same set of rows in one transaction, because someone added or removed it.',
		forms: ['phantom', 'phantoms', 'phantom read', 'phantom reads'],
	},
	{
		id: 'write-skew',
		term: 'Write skew',
		meaning:
			'Two transactions read the same rows, decide something, and write to different rows, together breaking a rule neither broke alone.',
		like: 'Two shop assistants each going on a break, each sure the other is staying.',
		forms: ['write skew'],
	},
	{
		id: 'mvcc',
		term: 'MVCC',
		meaning:
			'Multi-version concurrency control: keeping old versions of each row for a while, so each transaction can read from its own snapshot without waiting.',
		forms: ['mvcc', 'multi-version concurrency control'],
	},
	{
		id: 'snapshot-isolation',
		term: 'Snapshot isolation',
		meaning:
			'Each transaction reads the data as it was when it started, ignoring changes committed since.',
		like: 'Reading from a photo of the shelves, not the shelves themselves.',
		forms: ['snapshot isolation'],
	},
	{
		id: 'serializable-snapshot-isolation',
		term: 'Serializable snapshot isolation',
		meaning:
			'Serializable isolation done on snapshots: nobody waits, but transactions that might clash are cancelled at commit, to be tried again.',
		forms: ['serializable snapshot isolation'],
	},
	{
		id: 'read-committed',
		term: 'Read committed',
		meaning:
			'An isolation level: each statement sees only committed data, but two reads in one transaction can differ.',
		forms: ['read committed'],
	},
	{
		id: 'repeatable-read',
		term: 'Repeatable read',
		meaning:
			'An isolation level: a row read once reads the same for the rest of the transaction.',
		forms: ['repeatable read'],
	},
	{
		id: 'read-uncommitted',
		term: 'Read uncommitted',
		meaning:
			'The weakest isolation level: a transaction can see others’ changes before they commit.',
		forms: ['read uncommitted'],
	},
	{
		id: 'two-phase-locking',
		term: 'Two-phase locking',
		meaning:
			'A way to make transactions serializable: reads and writes both take locks, held until the end, so readers and writers wait for each other. Not the same as two-phase commit.',
		forms: ['two-phase locking'],
	},
	{
		id: 'blob',
		term: 'Blob',
		meaning:
			'A column of raw bytes in a database, like a whole photo. It works, but makes the database big and slow to copy.',
		forms: ['blob', 'blobs'],
	},
	{
		id: 'object-storage',
		term: 'Object storage',
		meaning:
			'Storage for files of any size, each kept whole under a key in a bucket, like Amazon S3. Cheap, and built so files are very hard to lose.',
		forms: ['object storage'],
	},
	{
		id: 'metadata',
		term: 'Metadata',
		meaning:
			'Facts about a file, rather than the file itself: its key, its size, who uploaded it, and what it’s a photo of.',
		forms: ['metadata'],
	},
	{
		id: 'pre-signed-url',
		term: 'Pre-signed URL',
		meaning:
			'A link, signed by the server, that lets whoever has it upload or download one file straight to or from storage, for a few minutes.',
		like: 'A visitor’s pass that opens one door, today only.',
		forms: ['pre-signed url', 'pre-signed urls', 'presigned url', 'presigned urls'],
	},
	{
		id: 'multipart-upload',
		term: 'Multipart upload',
		meaning:
			'Sending a big file in parts, several at once, which storage joins at the end. A part that fails is sent again on its own.',
		forms: ['multipart upload', 'multipart uploads'],
	},
	{
		id: 'transcoding',
		term: 'Transcoding',
		meaning:
			'Turning a video from one format or size into others, so every screen and connection gets a version that fits.',
		forms: ['transcode', 'transcoded', 'transcoding'],
	},
	{
		id: 'storage-class',
		term: 'Storage class',
		meaning:
			'A price tier in object storage. Colder classes cost less to keep files in, but more, or longer, to get them back.',
		forms: ['storage class', 'storage classes'],
	},
	{
		id: 'lifecycle-rule',
		term: 'Lifecycle rule',
		meaning:
			'A rule that moves or deletes stored files by their age, by itself, like “move invoices to the archive after a year”.',
		forms: ['lifecycle rule', 'lifecycle rules'],
	},
	{
		id: 'durability',
		term: 'Durability',
		meaning:
			'How sure you can be that saved data stays saved, through crashes, power cuts and broken disks.',
		forms: ['durability', 'durable'],
	},
	{
		id: 'oltp',
		term: 'OLTP',
		meaning:
			'Online transaction processing: the everyday work of an app, many small reads and writes of a few rows each, like placing an order.',
		forms: ['oltp'],
	},
	{
		id: 'olap',
		term: 'OLAP',
		meaning:
			'Online analytical processing: big questions over millions of rows at once, like sales by city by month. Column stores are built for it.',
		forms: ['olap'],
	},
	{
		id: 'data-warehouse',
		term: 'Data warehouse',
		meaning:
			'A database kept apart for reports and analysis, filled with copies of data from the app’s own databases, often a column store like BigQuery, Redshift or Snowflake.',
		forms: ['data warehouse', 'data warehouses'],
	},
];
