/* @flow */

import React, { Component, PropTypes } from 'react';
import ReactNative from 'react-native';
import shallowEqual from 'shallowequal';
import Colors from '../../Colors';
import AppText from './AppText';
import Icon from './Icon';
import AvatarRound from './AvatarRound';
import Time from './Time';
import TouchFeedback from './TouchFeedback';
import { NOTE_MENTION, NOTE_THREAD, NOTE_REPLY } from '../../../lib/Constants';
import type { Note } from '../../../lib/schemaTypes';

const {
	StyleSheet,
	View,
	TouchableHighlight,
	NavigationActions,
	PixelRatio
} = ReactNative;

const styles = StyleSheet.create({
	item: {
		backgroundColor: Colors.white,
		borderColor: Colors.separator,
		borderBottomWidth: 1 / PixelRatio.get()
	},
	note: {
		flexDirection: 'row'
	},
	avatarContainer: {
		margin: 16
	},
	content: {
		flex: 1,
		marginVertical: 12
	},
	title: {
		color: Colors.grey
	},
	summary: {
		fontSize: 12,
		lineHeight: 18,
		color: Colors.grey
	},
	strong: {
		color: Colors.darkGrey
	},
	timestampContainer: {
		flexDirection: 'row',
		marginTop: 4
	},
	timestamp: {
		fontSize: 11,
		color: Colors.black,
		marginLeft: 4,
		paddingHorizontal: 4,
		opacity: 0.3
	},
	icon: {
		color: Colors.black,
		opacity: 0.3
	},
	metaIcon: {
		marginVertical: 2
	},
	close: {
		margin: 14
	},
	closeButton: {
		borderRadius: 22,
		margin: 2
	},
	badge: {
		position: 'absolute',
		alignItems: 'center',
		bottom: -1,
		right: -1,
		height: 15,
		width: 15,
		borderRadius: 8,
		borderColor: Colors.white,
		borderWidth: 1
	},
	badgeIcon: {
		marginVertical: 1,
		textAlign: 'center',
		color: Colors.white
	}
});

type Props = {
	note: Note;
	dismissNote: Function;
	onNavigation: Function;
}

export default class NotificationCenterItem extends Component<void, Props, void> {
	static propTypes = {
		note: PropTypes.shape({
			count: PropTypes.number,
			data: PropTypes.object.isRequired,
			dismissTime: PropTypes.number,
			event: PropTypes.number.isRequired,
			createTime: PropTypes.number,
			updateTime: PropTypes.number,
			group: PropTypes.string.isRequired,
			id: PropTypes.string.isRequired,
			readTime: PropTypes.number.isRequired,
			score: PropTypes.number,
			user: PropTypes.string,
		}).isRequired,
		dismissNote: PropTypes.func.isRequired,
		onNavigation: PropTypes.func.isRequired
	};

	shouldComponentUpdate(nextProps: Props): boolean {
		return !shallowEqual(this.props, nextProps);
	}

	_getSummary: Function = note => {
		const { data, event, count } = note;

		const summary = [];

		switch (event) {
		case NOTE_MENTION:
			if (count > 1) {
				summary.push(<AppText key={1} style={styles.strong}>{count}</AppText>, ' new mentions in');
			} else {
				summary.push(<AppText key={1} style={styles.strong}>{data.creator}</AppText>, ' mentioned you in');
			}

			if (data.title) {
				summary.push(' ', <AppText key={2} style={styles.strong}>{data.title}</AppText>);
			}

			if (data.room) {
				summary.push(' - ', <AppText key={3} style={styles.strong}>{data.room}</AppText>);
			}

			break;
		case NOTE_REPLY:
			if (count > 1) {
				summary.push(<AppText key={1} style={styles.strong}>{count}</AppText>, ' new replies');
			} else {
				summary.push(<AppText key={1} style={styles.strong}>{data.creator}</AppText>, ' replied');
			}

			if (data.title) {
				summary.push(' to ', <AppText key={2} style={styles.strong}>{data.title}</AppText>);
			}

			if (data.room) {
				summary.push(' in ', <AppText key={3} style={styles.strong}>{data.room}</AppText>);
			}

			break;
		case NOTE_THREAD:
			if (count > 1) {
				summary.push(<AppText key={1} style={styles.strong}>{count}</AppText>, ' new discussions');
			} else {
				summary.push(<AppText key={1} style={styles.strong}>{data.creator}</AppText>, ' started a discussion');

				if (data.title) {
					summary.push(' on ', <AppText key={2} style={styles.strong}>{data.title}</AppText>);
				}
			}
			if (data.room) {
				summary.push(' in ', <AppText key={3} style={styles.strong}>{data.room}</AppText>);
			}

			break;
		default:
			if (count > 1) {
				summary.push(<AppText key={1} style={styles.strong}>{count}</AppText>, ' new notifications');
			} else {
				summary.push('New notification from ', <AppText key={1} style={styles.strong}>{data.creator}</AppText>);
			}

			if (data.room) {
				summary.push(' in ', <AppText key={2} style={styles.strong}>{data.room}</AppText>);
			}
		}

		return summary;
	};

	_getIconColor: Function = () => {
		const { note } = this.props;

		switch (note.event) {
		case NOTE_MENTION:
			return '#ff5722';
		case NOTE_REPLY:
			return '#2196F3';
		case NOTE_THREAD:
			return '#009688';
		default:
			return '#673ab7';
		}
	};

	_getIconName: Function = () => {
		const { note } = this.props;

		switch (note.event) {
		case NOTE_MENTION:
			return 'person';
		case NOTE_REPLY:
			return 'reply';
		case NOTE_THREAD:
			return 'create';
		default:
			return 'notifications';
		}
	};

	_handlePress: Function = () => {
		const { note, onNavigation } = this.props;

		const { data, event, count } = note;

		switch (event) {
		case NOTE_MENTION:
		case NOTE_REPLY:
			onNavigation(new NavigationActions.Push({
				name: 'chat',
				props: {
					thread: data.thread,
					room: data.room,
				}
			}));

			break;
		case NOTE_THREAD:
			if (count > 1) {
				onNavigation(new NavigationActions.Push({
					name: 'room',
					props: {
						room: data.room,
					}
				}));
			} else {
				onNavigation(new NavigationActions.Push({
					name: 'chat',
					props: {
						thread: data.thread,
						room: data.room
					}
				}));
			}

			break;
		default:
			onNavigation(new NavigationActions.Push({
				name: 'room',
				props: {
					room: data.room
				}
			}));
		}
	};

	_handleDismiss: Function = () => {
		this.props.dismissNote(this.props.note);
	};

	render() {
		const { note } = this.props;

		return (
			<View style={styles.item}>
				<TouchFeedback onPress={this._handlePress}>
					<View style={styles.note}>
						<View style={styles.avatarContainer}>
							<AvatarRound
								user={note.data.creator}
								size={36}
							/>
							<View style={[ styles.badge, { backgroundColor: this._getIconColor() } ]}>
								<Icon
									name={this._getIconName()}
									style={styles.badgeIcon}
									size={10}
								/>
							</View>
						</View>
						<View style={styles.content}>
							<View>
								<AppText numberOfLines={5} style={styles.title}>
									{this._getSummary(note)}
								</AppText>
							</View>
							<View>
								<AppText numberOfLines={1} style={styles.summary}>
									{note.data.body}
								</AppText>
							</View>
							<View style={styles.timestampContainer}>
								<Icon
									name='access-time'
									style={[ styles.icon, styles.metaIcon ]}
									size={12}
								/>
								<Time
									type='long'
									time={note.updateTime}
									style={styles.timestamp}
								/>
							</View>
						</View>
							<TouchableHighlight
								style={styles.closeButton}
								underlayColor={Colors.underlay}
								onPress={this._handleDismiss}
							>
								<View style={styles.close}>
									<Icon
										name='close'
										style={styles.icon}
										size={16}
									/>
								</View>
							</TouchableHighlight>
						</View>
				</TouchFeedback>
			</View>
		);
	}
}
