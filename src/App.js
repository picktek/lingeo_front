import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import PageTransition from 'react-router-page-transition';

import './App.css';
import ItemDetailPage from './ItemDetailPage';
import ListPage from './List';

class App extends Component {
  render() {
    return (
      <Router>
        <Route
          render={({ location }) => (
            <PageTransition timeout={500}>
              <Switch location={location}>
                <Route exact path="/" component={ListPage}/>
                <Route path="/item/:id" component={ItemDetailPage}/>
                <Route path="/item" component={ItemDetailPage}/>
                <Route path="/new" component={ItemDetailPage}/>
              </Switch>
            </PageTransition>
          )}
        />
      </Router>
    );
  }
}

export default App;
