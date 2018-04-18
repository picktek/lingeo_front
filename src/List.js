import axios from 'axios';
import _ from 'lodash';
import React from 'react';
import { Container, Input, Table } from 'reactstrap';

import './App.css';

export default class ListPage extends React.Component {
  constructor() {
    super();

    this.state = {
      limit:  100,
      offset: 0,
      value:  '',
      trs:    []
    };

    this.onSearch({ target: { value: '' } });
  }

  searchWord(search) {
    return axios.get('http://127.0.0.1:3000/lingeo', {
      params: {
        search: search,
        limit:  this.state.limit,
        offset: this.state.offset
      }
    }).then(result => result.data);
  }

  onSearch(event) {
    const text = event.target.value;
    this.searchWord(text)
        .then(words => {
          const trs = [];
          _.forEach(words, word => {
            trs.push((<tr key={word.id} onClick={() => this.goToItem(word.id)}>
              <th scope="row">{word.id}</th>
              <td>{word.eng}</td>
              <td>{'ffs'}</td>
            </tr>));
          });
          this.setState({ trs: trs });
        });
  }

  goToItem(id) {
    this.props.history.push({
      pathname: '/item/' + id
    });
  }

  render() {
    return (
      <Container className="transition-item list-page" fluid={false}>
        <Input
          placeholder="Type Here…"
          type="text"
          onChange={this.onSearch.bind(this)}
        />
        <Table>
          <thead>
          <tr>
            <th>#</th>
            <th>ENG</th>
            <th>GEO</th>
          </tr>
          </thead>
          <tbody>
          {this.state.trs}
          </tbody>
        </Table>
      </Container>
    );
  }
}
