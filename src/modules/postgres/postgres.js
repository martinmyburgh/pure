import jsonop from 'jsonop';
import winston from 'winston';
import Counter from '../../lib/counter';
import * as pg from '../../lib/pg';
import { TABLES, TYPES } from '../../lib/schema';
import queryHandler from './query';
import entityHandler from './entity';
import { bus, cache, config } from '../../core-server';
import * as Types from './../../models/models';
import './cache-updater';
const channel = 'heyneighbor';


const TYPE_SEGMENT = `case \
when tableoid = 'notes'::regclass then 'note' \
when tableoid = 'privs'::regclass then 'privs' \
when tableoid = 'roomrelations'::regclass then 'roomrels' \
when tableoid = 'rooms'::regclass then 'room' \
when tableoid = 'textrelations'::regclass then 'textrel' \
when tableoid = 'texts'::regclass then 'text' \
when tableoid = 'threadrelations'::regclass then 'threadrel' \
when tableoid = 'threads'::regclass then 'thread' \
when tableoid = 'topicrelations'::regclass then 'topicrel' \
when tableoid = 'topics'::regclass then 'topic' \
when tableoid = 'users'::regclass then 'user' \
end as type`;

function broadcast (entity) {
	pg.notify(config.connStr, channel, entity);
}

cache.onChange((changes) => {
	winston.info(changes);
	const cb = (key, range, err, results) => {
		if (err) {
			winston.error(err);
			return;
		}
		bus.emit('change', {
			knowledge: { [key]: [ range ] },
			indexes: { [key]: results },
			source: 'postgres'
		});
	};

	if (changes.queries) {
		for (const key in changes.queries) {
			if (key === 'entities') {
				const ids = Object.keys(changes.queries.entities),
					typeToEntities = {
						item: [],
						user: []
					};

				ids.forEach((id) => {
					const _split = id.split('_');
					let type;

					if (_split.length === 3) return;
					else if (_split.length === 2) return;
					else if (id.length >= 36) type = 'item';
					else type = 'user';
					typeToEntities[type].push(id);
				});

				for (const i in typeToEntities) {
					if (!typeToEntities[i].length) continue;

					pg.read(config.connStr, {
						$: `select *, ${TYPE_SEGMENT} from "${TABLES[TYPES[i]]}" where id in (&(ids))`,
						ids: typeToEntities[i]
					}, (err, r) => {
						if (err) {
							winston.error(err.message);
							return;
						}

						console.log(r);
						const state = {
							entities: {},
							source: 'postgres'
						};

						r.map((entity) => {
							state.entities[entity.id] = new Types[entity.type](entity);
						});

						const missingIds = r.map(item => item.id).filter(itemID => typeToEntities[i].indexOf(itemID) > -1);

						missingIds.forEach(id => {
							state.entities[id] = null;
						});
						winston.info(JSON.stringify(state));
						bus.emit('change', state);
					});
				}
			} else {
				for (const range of changes.queries[key]) {
					pg.read(
						config.connStr,
						queryHandler(cache.keyToSlice(key), range),
						cb.bind(null, key, range)
					);
				}
			}
		}
	}
});

pg.listen(config.connStr, channel, (payload) => {
	bus.emit('postchange', payload);
});

bus.on('change', (changes, next) => {
	const counter = new Counter();

	winston.info(changes);
	if (changes.source === 'postgres') {
		next();
		return;
	}

	if (changes.entities) {
		const sql = [];

		winston.info('Got few entities to update');
		for (const id in changes.entities) {
			sql.push(entityHandler(changes.entities[id]));
		}

		winston.info('sql', sql);
		counter.inc();
		pg.write(config.connStr, sql, (err, results) => {
			if (err) {
				counter.err(err);
				return;
			}

			winston.info('PgWrite Results', results[0].rows);
			results.forEach((result) => broadcast(result.rows[0]));
			counter.dec();
		});
	}

	if (changes.queries) {
		const response = changes.response = {},
			cb = (key, err, results) => {
				if (err) { jsonop(response, { state: { error: err } }); }
				jsonop(response, { indexes: { [key]: results } });
				counter.dec();
			},
			entityCallback = (err, result) => {
				if (err) { jsonop(response, { state: { error: err } }); }

				if (result && result.id) {
					response.entities = response.entities ? response.entities : {};
					response.entities[result.id] = result;
				}

				counter.dec();
			};

		for (const key in changes.queries) {
			if (key === 'entities') {
				counter.inc();
				for (const entity in changes.queries[key][entity]) {
					cache.getEntity(entity, entityCallback);
				}
			} else {
				for (const range of changes.queries[key]) {
					counter.inc();
					cache.query(key, range, cb.bind(null, key));
				}
			}
		}
	}

	counter.then(next);
});
