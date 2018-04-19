import axios from 'axios';
import _ from 'lodash';
import React from 'react';
import { Alert } from 'reactstrap';

const API_ENDPOINT = false ? `${window.location.protocol}//${window.location.host}/api` : 'http://127.0.0.1:3000';

export default class LoginForm extends React.Component {
  constructor() {
    super();
    this.state = {
      loggingIn: false
    };
  }

  componentWillMount() {
    this.checkLogin();
  }

  checkLogin() {
    return axios.get(`${API_ENDPOINT}/login`)
                .then(() => this.props.history.goBack())
                .catch(_.noop);
  }

  submit(event) {
    event.preventDefault();

    const username = this.refs.username.value;
    const password = this.refs.password.value;

    if (username.length === 0 || password.length === 0) {
      return this.setState({ error: { code: 'missingUsernameOrPassword' } });
    }

    this.setState({
      loggingIn: true,
      errorCode: null
    });

    return axios.post(`${API_ENDPOINT}/login`, {
      username: username,
      password: password
    }).then(() => this.props.history.goBack())
                .catch(() => this.setState({
                  error:     { code: 'invalidCredentials' },
                  loggingIn: false
                }));
  }

  renderLoginError() {
    if (!this.state.error) {
      return null;
    }

    let message = null;
    switch (this.state.error.code) {
      case 'invalidCredentials':
        message = 'Invalid credentials';
        break;
      case 'missingUsernameOrPassword':
        message = 'Please enter your username and password';
        break;
      default:
        message = 'Unknown sign-in error';
        break;
    }

    return <Alert type="danger"><strong>{message}</strong></Alert>;
  }

  render() {
    const signInIconClass = (this.state.loggingIn) ?
      this.props.spinnerIconClass : this.props.buttonIconClass;

    return (
      <div className="container login-form">
        <h2>{this.props.heading}</h2>
        {this.renderLoginError()}
        <form onSubmit={this.submit.bind(this)} noValidate>
          <div className="form-group">
            <label className="sr-only" htmlFor="username">Username</label>
            <input className="form-control" ref="username" placeholder="Username" autoFocus disabled={this.loggingIn}/>
          </div>

          <div className="form-group">
            <label className="sr-only" htmlFor="password">Password</label>
            <input className="form-control" type="password"
                   ref="password" placeholder="Password" disabled={this.loggingIn}/>
          </div>

          <div className="form-group">
            <button className="btn btn-primary btn-block" type="submit"
                    disabled={this.state.loggingIn}>
              <span>Sign-In</span>
              <i className={signInIconClass} style={{ marginLeft: 6 }}/>
            </button>
          </div>
        </form>
      </div>
    );
  }
}