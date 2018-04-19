import axios from 'axios';
import _ from 'lodash';
import React from 'react';
import { Button, Col, Container, Input, Row, Table } from 'reactstrap';
import './App.css';

const API_ENDPOINT = false ? `${window.location.protocol}//${window.location.host}/api` : 'http://127.0.0.1:3000';

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
    return axios.get(`${API_ENDPOINT}/lingeo`, {
      params: {
        search: search,
        limit:  this.state.limit,
        offset: this.state.offset
      }
    }).then(result => result.data).catch(e => {
      if (e.response.status === 401) {
        console.log(e)
        this.props.history.push({ pathname: '/login' });
      }
    });
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
        <Row>
          <Col xs="11">
            <Input
              placeholder="Type Here…"
              type="text"
              onChange={this.onSearch.bind(this)}
            />
          </Col>
          <Col>
            <Button color="primary" onClick={() => this.props.history.push({ pathname: '/new' })}>+</Button>
          </Col>
        </Row>
        <hr/>
        <Table>
          <thead>
          <tr>
            <th>#</th>
            <th>ENG</th>
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
