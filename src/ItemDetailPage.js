import axios from 'axios/index';
import _ from 'lodash';
import React from 'react';
import Spinner from 'react-spinkit';
import { Button, Col, Container, FormGroup, Input, Label, Row } from 'reactstrap';

export default class ItemDetailPage extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      data:    {
        geos: []
      }
    };
  }

  componentDidMount() {
    if (this.props && this.props.location && this.props.location.params && this.props.location.params.itemId) {
      this.eng_id = this.props.location.params.itemId;
      this.detailItem()
          .then(item => {
            this.setState({
              loading: false,
              data:    item,
              dataRN:  _.clone(item)
            });
          });
    } else if (this.props && this.props.match && this.props.match.params && this.props.match.params.id) {
      this.eng_id = this.props.match.params.id;
      this.detailItem()
          .then(item => {
            this.setState({
              loading: false,
              data:    item,
              dataRN:  _.clone(item)
            });
          });
    } else {
      this.eng_id = -1;
      console.log(this.props);
    }
  }

  detailItem() {
    return axios.get('http://127.0.0.1:3000/lingeo/' + this.eng_id, {}).then(result => result.data);
  }

  saveItem() {
    console.log(this.state.data, this.state.dataRN);
    return axios.post('http://127.0.0.1:3000/lingeo/' + this.eng_id, this.state.data).then(result => result.data);
  }

  handleInputChange(event, name, id) {
    const currentData = _.clone(this.state.data);

    if (name === 'eng') {
      currentData.eng = event.target.value;
    } else if (name === 'transcript') {
      currentData.transcription = event.target.value;
    } else {
      _.forEach(currentData.geos, geo => {
        if (name === 'geo' && geo.id === id) {
          geo.geo = event.target.value;
        } else if (name === 'type' && geo.type_id === id) {
          geo.type = event.target.value;
        } else if (name === 'abbr' && geo.type_id === id) {
          geo.abbr = event.target.value;
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
        </Col>
      </FormGroup>
      {this.state.data.geos.map(object =>
        <FormGroup key={object.id} style={{
          border:  '1px solid black',
          padding: '4px'
        }}>
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
              <Input type="text" name="type" id="type" placeholder="სახეობა …" defaultValue={object.type}
                     onChange={event => this.handleInputChange(event, 'type', object.type_id)}/>
            </Col>
            <Col>
              <Input type="text" name="abbr" id="abbr" placeholder="აბრევიატურა …" defaultValue={object.abbr}
                     onChange={event => this.handleInputChange(event, 'abbr', object.type_id)}/>
            </Col>
          </Row>
        </FormGroup>
      )}
      <div className="clearfix" style={{ padding: '.5rem' }}>
        <Button className="btn btn-secondary float-left" color="secondary"
                onClick={() => this.props.history.goBack()}>Cancel</Button>
        <Button className="btn btn-primary float-right" color="primary"
                onClick={() => this.saveItem()}>Save</Button>
      </div>
      <pre>{JSON.stringify(this.state.data, null, 4)}</pre>
    </Container>;
  }
}
