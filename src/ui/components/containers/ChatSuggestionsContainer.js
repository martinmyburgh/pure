/* @flow */

import React, { Component, PropTypes } from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import createContainer from '../../../modules/store/createContainer';
import ChatSuggestions from '../views/Chat/ChatSuggestions';
import store from '../../../modules/store/store';
import type { Text, Thread } from '../../../lib/schemaTypes';

type Props = {
	user: string;
	prefix: string;
	thread: ?Thread;
	texts: Array<Text>;
}

type State = {
	prefix: string;
	data: Array<{ id: string }>;
}

class ChatSuggestionsContainerInner extends Component<void, Props, State> {
	static propTypes = {
		prefix: PropTypes.string.isRequired,
		user: PropTypes.string.isRequired,
		thread: PropTypes.object.isRequired,
		texts: PropTypes.arrayOf(PropTypes.object).isRequired,
	};

	state: State = {
		prefix: '',
		data: [],
	};

	componentWillMount() {
		this._updateData(this.props);
	}

	componentWillReceiveProps(nextProps: Props) {
		this._updateData(nextProps);
	}

	shouldComponentUpdate(nextProps: Props, nextState: any): boolean {
		return shallowCompare(this, nextProps, nextState);
	}

	_subscription: ?Subscription;

	_getResults = (prefix: string, count: number) => {
		return store.observe({
			type: 'list',
			slice: {
				type: 'user',
				filter: {
					id_pref: prefix,
				},
				order: 'updateTime',
			},
			range: {
				start: -Infinity,
				before: 0,
				after: count,
			},
			source: 'ChatSuggestionsContainer',
		});
	};

	_getUsersFromTexts = (thread: ?Thread, texts: Array<Text>): Array<?Text> => {
		return texts.map(text => {
			return text && text.creator ? text.creator : null;
		})
		.concat(thread && thread.creator ? thread.creator : null)
		.filter((value, index, self) => {
			return self.indexOf(value) === index;
		});
	};

	_updateData = ({ prefix, user, thread, texts }: Props) => {
		if (this._subscription) {
			this._subscription.unsubscribe();
			this._subscription = null;
		}
		if (typeof prefix === 'string' && prefix) {
			this.setState({
				prefix,
			});
			const users = this._getUsersFromTexts(thread, texts)
				.filter(id => {
					return typeof id === 'string' && id && id !== user && id.indexOf(prefix.substring(1)) === 0;
				}).map((id: any) => {
					return {
						id: (id: string),
					};
				});
			this.setState({
				data: users,
			});
			if (users.length < 4 && prefix.length > 1) {
				this._subscription = this._getResults(prefix.substring(1), 4 - users.length).subscribe({
					next: (result) => {
						if (prefix === this.state.prefix) {
							const currentIds = [];
							const items = users
								.concat(result)
								.filter((item: any) => item.type !== 'loading' && item.id !== user);

							items.forEach(u => {
								currentIds.push(u.id);
							});

							this.setState({
								data: items.filter((u, i) => {
									return currentIds.indexOf(u.id) === i;
								}),
							});
						}
					},
				});
			}
		} else {
			this.setState({
				prefix: '',
				data: [],
			});
		}
	};

	render() {
		const {
			prefix,
			data,
		} = this.state;

		if (!prefix) {
			return null;
		}

		return <ChatSuggestions data={data} {...this.props} />;
	}
}

const mapSubscriptionToProps = ({ thread }) => ({
	thread: {
		type: 'entity',
		id: thread,
	},
	texts: {
		type: 'list',
		slice: {
			type: 'text',
			filter: {
				parents_first: thread,
			},
			order: 'createTime',
		},
		range: {
			start: Infinity,
			before: 30,
			after: 0,
		},
		defer: false,
	},
});

export default createContainer(mapSubscriptionToProps)(ChatSuggestionsContainerInner);
