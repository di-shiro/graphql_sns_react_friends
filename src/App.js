import React from "react";
import styles from "./App.module.css";
import { ApolloProvider } from "@apollo/react-hooks";
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import Auth from "./components/Auth";
import MainPage from "./components/MainPage";
import { setContext } from "@apollo/client/link/context";

/*
  GraphQL Client の作成
*/
const httpLink = createHttpLink({
  uri: "http://127.0.0.1:8000/graphql/",
});
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `JWT ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const App = () => {
  return (
    <ApolloProvider client={client}>
      <div className={styles.app__root}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={Auth} />
            <Route exact path="/top" component={MainPage} />
          </Switch>
        </BrowserRouter>
      </div>
    </ApolloProvider>
  );
};

export default App;
