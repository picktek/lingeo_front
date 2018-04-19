import axios from 'axios/index';
import _ from 'lodash';
import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import Spinner from 'react-spinkit';
import { Button, Col, Container, FormGroup, Input, Label, Row } from 'reactstrap';
import SweetAlert from 'sweetalert-react';
import 'sweetalert/dist/sweetalert.css';

const API_ENDPOINT = true ? `${window.location.protocol}//${window.location.host}/api` : 'http://127.0.0.1:3000';

export default class ItemDetailPage extends React.Component {
  constructor() {
    super();
    this.state = {
      deleteConfirmShow: false,
      saveConfirmShow:   false,
      loading:           true,
      word_types:        {},
      select_types:      [],
      data:              {
        id:   -1,
        geos: []
      }
    };
  }

  componentDidMount() {
    if (this.props && this.props.location && this.props.location.params && this.props.location.params.itemId) {
      this.eng_id = this.props.location.params.itemId;
    } else if (this.props && this.props.match && this.props.match.params && this.props.match.params.id) {
      this.eng_id = this.props.match.params.id;
    } else {
      this.eng_id = -1;
    }

    this.loadTypes();
    this.loadWord();
  }

  detailItem() {
    return axios.get(`${API_ENDPOINT}/lingeo/${this.eng_id}`, {}).then(result => result.data);
  }

  loadWord() {
    if (this.eng_id === -1) {
      this.setState({ loading: false });
      return;
    }

    return this.detailItem()
               .then(item => {
                 this.setState({
                   loading: false,
                   data:    item,
                   dataRN:  _.clone(item)
                 });
               });
  }

  loadTypes() {
    return axios.get(`${API_ENDPOINT}/lingeo/word_types`)
                .then(result => {
                  const word_types   = {};
                  const select_types = [];
                  _.forEach(result.data, word_type => {
                    word_types[word_type.id] = word_type;
                    select_types.push({
                      value: word_type.id,
                      label: `${word_type.name} (${word_type.abbr})`
                    });
                  });

                  this.setState({
                    word_types:   word_types,
                    select_types: select_types
                  });
                });
  }

  saveItem() {
    return axios.post(`${API_ENDPOINT}/lingeo/${this.eng_id}`, this.state.data)
                .then(result => {
                  if (result.data.hasOwnProperty('new_eng_id')) {
                    this.eng_id = result.data.new_eng_id;
                  }
                })
                .then(() => this.setState({ saveConfirmShow: false }))
                .then(() => this.loadWord());
  }

  deleteItem() {
    return axios.post(`${API_ENDPOINT}/lingeo/delete/${this.eng_id}`)
                .then(() => this.setState({ deleteConfirmShow: false }))
                .then(() => this.props.history.goBack());
  }

  addGeo() {
    const data = _.clone(this.state.data);
    const geos = data.geos;

    let minID = _.minBy(geos, o => o.id);
    minID     = _.isEmpty(minID) ? -1 : _.toFinite(minID.id) - 1;

    geos.push({
      id:      _.min([-1, minID]),
      type_id: 1
    });

    this.setState({ data: data });
  }

  removeGeo(id) {
    const data = _.clone(this.state.data);
    const geos = data.geos;

    _.remove(geos, n => n.id === id);

    this.setState({ data: data });
  }

  handleInputChange(event, name, id) {
    console.log(event, name, id);
    const currentData = _.clone(this.state.data);

    if (name === 'eng') {
      currentData.eng = event.target.value;
    } else if (name === 'transcript') {
      currentData.transcription = event.target.value;
    } else if (name === 'eng_type') {
      currentData.eng_type = event.target.value;
    } else if (name === 'geo_type_id' || name === 'geo') {
      _.forEach(currentData.geos, geo => {
        if (name === 'geo' && geo.id === id) {
          geo.geo = event.target.value;
        } else if (event.target && event.target.value && geo.id === id) {
          geo.type_id = event.target.value;
          geo.type    = this.state.word_types[event.target.value].name;
          geo.abbr    = this.state.word_types[event.target.value].abbr;
        }
      });
    }

    this.setState({ data: currentData });
  }

  render() {
    if (this.state.loading) {
      return <Spinner name='double-bounce' style={{
        top:  document.documentElement.clientHeight / 2,
        left: document.documentElement.clientWidth / 2
      }}/>;
    }

    return <Container className="transition-item detail-page">
      <FormGroup row>
        <Label for="exampleEmail" sm={1}>{this.state.data.id}</Label>
        <Col>
          <Input type="text" name="eng" id="eng" placeholder="English Word …" defaultValue={this.state.data.eng}
                 onChange={event => this.handleInputChange(event, 'eng')}/>
          <Input type="text" name="transcript" id="transcript" placeholder="Transcription …"
                 defaultValue={this.state.data.transcription}
                 onChange={event => this.handleInputChange(event, 'transcript')}/>
          <Select
            name="eng_type"
            value={this.state.data.eng_type}
            options={this.state.select_types}
            onChange={selected => this.handleInputChange({ target: selected }, 'eng_type')}
          />
        </Col>
      </FormGroup>
      <div className="text-right">
        <Button color="primary" onClick={() => this.addGeo()}>+</Button>
      </div>
      {this.state.data.geos.map(object =>
        <FormGroup key={object.id} style={{
          border:  '1px solid black',
          padding: '4px'
        }}>
          <div className="text-right">
            <Button color="danger" onClick={() => this.removeGeo(object.id)}>-</Button>
          </div>
          <Row>
            <Label for="geo" sm={1}>{object.id}</Label>
            <Col>
              <Input type="text" name="geo" id="geo" placeholder="ქართული სიტყვა …" defaultValue={object.geo}
                     onChange={event => this.handleInputChange(event, 'geo', object.id)}/>
            </Col>
          </Row>
          <hr/>
          <Row>
            <Label for="geo" sm={1}>{object.type_id}</Label>
            <Col>
              <Select
                name="eng_type"
                value={object.type_id}
                options={this.state.select_types}
                onChange={selected => this.handleInputChange({ target: selected }, 'geo_type_id', object.id)}
              />
            </Col>
          </Row>
        </FormGroup>
      )}
      <div className="clearfix text-center" style={{ padding: '.5rem' }}>
        <Button className="btn btn-secondary float-left" color="secondary"
                onClick={() => this.props.history.goBack()}>Cancel</Button>
        {this.state.data.id !== -1 ?
          <Button className="btn btn-danger" color="danger"
                  onClick={() => this.setState({ deleteConfirmShow: true })}>Delete</Button>
          : null}
        <Button className="btn btn-primary float-right" color="primary"
                onClick={() => this.setState({ saveConfirmShow: true })}>Save</Button>
      </div>
      <SweetAlert
        showCancelButton
        show={this.state.deleteConfirmShow}
        type="warning"
        title="Are you Sure Delete ?"
        text={'You are about to delete eng with id: ' + this.eng_id}
        confirmButtonColor="#e64942"
        onConfirm={() => this.deleteItem()}
        onCancel={() => this.setState({ deleteConfirmShow: false })}
        onEscapeKey={() => this.setState({ deleteConfirmShow: false })}
        onClose={() => this.setState({ deleteConfirmShow: false })}
        onOutsideClick={() => this.setState({ deleteConfirmShow: false })}
      />
      <SweetAlert
        showCancelButton
        show={this.state.saveConfirmShow}
        type="info"
        title="Are you Sure ?"
        text={'You are about to save eng with id: ' + this.eng_id}
        onConfirm={() => this.saveItem()}
        onCancel={() => this.setState({ saveConfirmShow: false })}
        onEscapeKey={() => this.setState({ saveConfirmShow: false })}
        onClose={() => this.setState({ saveConfirmShow: false })}
        onOutsideClick={() => this.setState({ saveConfirmShow: false })}
      />
      {/*<pre>{JSON.stringify(this.state.data, null, 4)}</pre>*/}
    </Container>;
  }
}
