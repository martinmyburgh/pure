/* @flow */

import React, { Component } from 'react';
import Radium from 'radium';

const styles = {
	base: {
		fontFamily: 'sans-serif',
		fontSize: 24,
		color: '#555'
	}
};

class Home extends Component {
	render() {
		return <div style={styles.base}>¯\_(ツ)_/¯</div>;
	}
}

export default Radium(Home);
