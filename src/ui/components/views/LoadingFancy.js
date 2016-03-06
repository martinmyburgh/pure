/* @flow */

import React, { Component } from 'react';
import ReactNative from 'react-native';
import Colors from '../../Colors';
import Loading from './Loading';

const {
	StyleSheet,
	PixelRatio,
	View
} = ReactNative;

const styles = StyleSheet.create({
	container: {
		backgroundColor: Colors.white,
		borderColor: Colors.separator,
		borderWidth: 1 / PixelRatio.get(),
		height: 36,
		width: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 24,
		elevation: 1
	},

	loading: {
		height: 24,
		width: 24
	}
});

export default class LoadingFancy extends Component {
	static propTypes = {
		style: View.propTypes.style
	};

	render() {
		return (
			<View style={[ styles.container, this.props.style ]}>
				<Loading style={styles.loading} />
			</View>
		);
	}
}
