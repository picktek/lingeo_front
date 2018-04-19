import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import PageTransition from 'react-router-page-transition';

import './App.css';
import ItemDetailPage from './ItemDetailPage';
import ListPage from './List';
import LoginPage from './loginPage';

class App extends Component {
  render() {
    return (
      <Router>
        <Route
          render={({ location }) => (
            <PageTransition timeout={250}>
              <Switch location={location}>
                <Route exact path="/" component={ListPage}/>
                <Route path="/item/:id" component={ItemDetailPage}/>
                <Route path="/new" component={ItemDetailPage}/>
                <Route path="/item" component={ItemDetailPage}/>
                <Route path="/login" component={LoginPage}/>
              </Switch>
            </PageTransition>
          )}
        />
      </Router>
    );
  }
}

export default App;
