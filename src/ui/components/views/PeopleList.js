/* @flow */

import React, { Component, PropTypes } from 'react';
import ReactNative from 'react-native';
import PeopleListItem from './PeopleListItem';
import PageEmpty from './PageEmpty';
import PageLoading from './PageLoading';
import ListHeader from './ListHeader';

const {
	ListView,
} = ReactNative;

export default class PeopleList extends Component {
	constructor(props) {
		super(props);

		this._dataSource = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
	}

	_getDataSource = () => {
		return this._dataSource.cloneWithRows(this.props.data);
	};

	_renderHeader = () => <ListHeader>People talking</ListHeader>;

	_renderRow = user => (
		<PeopleListItem
			key={user.id}
			user={user}
		/>
	);

	render() {
		const { data } = this.props;

		if (data.length === 0) {
			return <PageEmpty label='Nobody here' image='sad' />;
		} else if (data.length === 1) {
			if (data[0] === 'missing') {
				return <PageLoading />;
			} else if (data.length === 1 && data[0] === 'failed') {
				return <PageEmpty label='Failed to load people list' image='sad' />;
			}
		}

		return (
			<ListView
				dataSource={this._getDataSource()}
				renderHeader={this._renderHeader}
				renderRow={this._renderRow}
			/>
		);
	}
}

PeopleList.propTypes = {
	data: PropTypes.arrayOf(PropTypes.oneOfType([
		PropTypes.oneOf([ 'missing', 'failed' ]),
		PropTypes.shape({
			id: PropTypes.string
		})
	])).isRequired
};
