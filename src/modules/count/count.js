/* @flow */

import { TABLES, ROLES } from '../../lib/schema';
import { Constants, bus } from '../../core-server';
import log from 'winston';

bus.on('change', (changes, next) => {
	if (!changes.entities) {
		next();
		return;
	}

	for (const id in changes.entities) {
		const entity = changes.entities[id];

		// 1. Increment children counts on parents
		if (
			entity.type === Constants.TYPE_TEXT ||
			entity.type === Constants.TYPE_THREAD
		) {
			let inc;

			if (entity.createtime) {
				inc = 1;
			} else if (entity.deletetime) {
				inc = -1;
			} else {
				continue;
			}

			const parent = changes.entities[entity.parents[0][0]] || {};

			parent.counts = parent.counts || {};
			parent.counts.children = inc;
			parent.id = entity.parents[0][0];
			parent.type = (entity.type === Constants.TYPE_TEXT) ?
				Constants.TYPE_THREAD : Constants.TYPE_ROOM;
			changes.entities[entity.parents[0][0]] = parent;

			// 2. Increment text/thread count of user

			const user = changes.entities[entity.creator] || {};

			user.counts = user.counts || {};
			user.counts[TABLES[entity.type]] = inc;
			user.id = entity.creator;
			changes.entities[entity.creator] = user;
		}

		 // 3. Increment related counts on items

		if (
			entity.type === Constants.TYPE_TEXTREL ||
			entity.type === Constants.TYPE_THREADREL ||
			entity.type === Constants.TYPE_ROOMREL ||
			entity.type === Constants.TYPE_PRIVREL ||
			entity.type === Constants.TYPE_TOPICREL
		) {
			const item = changes.entities[entity.item] || {};

			item.counts = item.counts || {};

			if (entity.__op__ && entity.__op__.role && entity.__op__.roles[0] === 'union') {
				const rem = entity.__op__.roles[0].slice(1);

				rem.forEach((role) => {
					if (ROLES[role]) {
						item.counts[ROLES[role]] = -1;
					}
				});
			}

			if (entity.roles) {
				entity.roles.forEach((role) => {
					if (ROLES[role]) {
						item.counts[ROLES[role]] = 1;
					}
				});
			}

			item.id = entity.item;

			switch (entity.type) {
			case Constants.TYPE_TEXTREL:
				item.type = Constants.TYPE_TEXT;
				break;
			case Constants.TYPE_THREADREL:
				item.type = Constants.TYPE_THREAD;
				break;
			case Constants.TYPE_ROOMREL:
				item.type = Constants.TYPE_ROOM;
				break;
			case Constants.TYPE_PRIVREL:
				item.type = Constants.TYPE_PRIV;
				break;
			case Constants.TYPE_TOPICREL:
				item.type = Constants.TYPE_TOPIC;
				break;
			}
			changes.entities[entity.item] = item;
		}
	}
	next();
}, Constants.APP_PRIORITIES.CACHE_UPDATER);
log.info('Count module ready.');
