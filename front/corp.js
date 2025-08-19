async function fetch_records_json(user, endpoint, queryString = '') {
	const final_url	= '/' + user + '/' + endpoint + (queryString.length ? '?' + queryString : '');
	const res 		= await fetch(final_url);
	return await res.json();
}
async function fetch_json_stores(user = 'guest') { let records = fetch_records_json(user, 'stores'); return records; }
async function fetch_json_relays(user = 'guest') { let records = fetch_records_json(user, 'relays'); return records; }
async function fetch_json_refris(user = 'guest') { let records = fetch_records_json(user, 'refris'); return records; }


const TABLE_FORMAT = 
	{ stores: 
		{ address			: ''
		, name 				: ''
		, alert_recipients	: []
		, nodes				: []
		, sensors			: []
		}
	, relays:
		{ id				: ''
		, name				: ''
		, sensors			: []
		, battery			: 0
		}
	, refris: 
		{ id				: ''
		, name				: ''
		, temperature		: ''
		, history			: ''
		}
	};