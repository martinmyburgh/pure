/* @flow */

import React, { Component, PropTypes } from 'react';
import ReactNative from 'react-native';
import Colors from '../../Colors';
import AppText from './AppText';
import Icon from './Icon';
import CardAuthor from './CardAuthor';
import Time from './Time';

const {
	StyleSheet,
	View
} = ReactNative;

const styles = StyleSheet.create({
	footer: {
		flexDirection: 'row',
		marginTop: 6
	},
	left: {
		flex: 1
	},
	right: {
		flexDirection: 'row',
		justifyContent: 'flex-end'
	},
	info: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	label: {
		color: Colors.black,
		fontSize: 12,
		lineHeight: 18,
		marginLeft: 8,
		marginRight: 16,
		paddingHorizontal: 4
	},
	action: {
		fontWeight: 'bold'
	},
	icon: {
		color: Colors.black
	},
	faded: {
		opacity: 0.3
	}
});

export default class DiscussionFooter extends Component {
	shouldComponentUpdate(nextProps) {
		return (
			this.props.thread.updateTime !== nextProps.thread.updateTime ||
			this.props.thread.length !== nextProps.thread.length
		);
	}

	render() {
		return (
			<View {...this.props} style={[ styles.footer, this.props.style ]}>
				<CardAuthor nick={this.props.thread.from} style={styles.left} />

				<View style={styles.right}>
					<View style={[ styles.info, styles.faded ]}>
						<Icon
							name='access-time'
							style={styles.icon}
							size={24}
						/>
						<Time
							type='short'
							time={this.props.thread.updateTime}
							style={styles.label}
						/>
					</View>
					<View style={[ styles.info, styles.faded ]}>
						<Icon
							name='forum'
							style={styles.icon}
							size={24}
						/>
						<AppText style={styles.label}>{this.props.thread.length || 1}</AppText>
					</View>
				</View>
			</View>
		);
	}
}

DiscussionFooter.propTypes = {
	thread: PropTypes.shape({
		updateTime: PropTypes.number.isRequired,
		length: PropTypes.number.isRequired,
		from: PropTypes.string.isRequired
	}).isRequired,
	style: View.propTypes.style
};
