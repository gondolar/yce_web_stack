async function fetch_records_json(user, endpoint, queryString = '') {
	const final_url	= '/' + user + '/' + endpoint + (queryString.length ? '?' + queryString : '');
	const res 		= await fetch(final_url);
	return await res.json();
}
async function fetch_json_carers(user = 'guest') { let records = fetch_records_json(user, 'carers'); return records; }
async function fetch_json_places(user = 'guest') { let records = fetch_records_json(user, 'places'); return records; }
async function fetch_json_relays(user = 'guest') { let records = fetch_records_json(user, 'relays'); return records; }
async function fetch_json_senses(user = 'guest') { let records = fetch_records_json(user, 'senses'); return records; }
async function fetch_json_assign(user = 'guest') { let records = fetch_records_json(user, 'assign'); return records; }

const DATABASE_FORMAT = 
	{ places: 
		[	{ nick				: ''
			, address			: ''
			, location			: [0.0, 0.0]
			}
		]
	, carers: 
		[	{ name				: ''
			, phones			: []
			}
		]
	, relays:
		[	{ vmac				: ''
			, name				: ''
			, battery			: 0
			}
		]
	, senses:
		[	{ code				: ''
			, name				: ''
			, value				: 0.0
			, history			: [{timestamp:0, value:0.0}]
			}
		]
	, assign:
		[	{ sense_code		: ''
			, relay_vmac		: ''
			, carer_name		: ''
			, place_nick		: ''
			}
		]
	};
