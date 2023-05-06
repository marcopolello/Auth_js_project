const express = require('express');
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const app = express();
const port = 3001;

require('./typesense');

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: SECRET_KEY,
  baseURL: 'https://localhost:3001',
  clientID: CLIENT_ID,
  issuerBaseURL: 'https://dev-8ekogg09.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

/*
 *  Our JavaScript client library works on both the server and the browser.
 *  When using the library on the browser, please be sure to use the
 *  search-only API Key rather than the master API key since the latter
 *  has write access to Typesense and you don't want to expose that.
 */

const Typesense = require('typesense');
const DOCKER_API_KEY = process.env.DOCKER_API_KEY;
let client = new Typesense.Client({
  'nodes': [{
    'host': 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
    'port': '8108',      // For Typesense Cloud use 443
    'protocol': 'http'   // For Typesense Cloud use https
  }],
  'apiKey': DOCKER_API_KEY, //settata da EXPORT TYPESENSE_API_KEY=xyz prima di creare la cartelkla typesense-data e runnare il container docker
  'connectionTimeoutSeconds': 2
});


var fs = require('fs/promises');
async function typeSense () {

  /*
  let booksSchema = {
    'name': 'books',
    'fields': [
      {'name': 'title', 'type': 'string' },
      {'name': 'authors', 'type': 'string[]', 'facet': true },
      {'name': 'publication_year', 'type': 'int32', 'facet': true },
      {'name': 'ratings_count', 'type': 'int32' },
      {'name': 'average_rating', 'type': 'float' }
    ],
    'default_sorting_field': 'ratings_count'
  }
  
  client.collections().create(booksSchema)
    .then(function (data) {
      console.log(data)
    })
    */

  const booksInJsonl = await fs.readFile("./books.jsonl");

  client.collections('books').documents().import(booksInJsonl);


  let searchParameters = {
    'q'         : 'harry potter',
    'query_by'  : 'title',
    'sort_by'   : 'ratings_count:desc',
    //'filter_by' : 'publication_year:=[1997]'
  }

  client.collections('books')
  .documents()
  .search(searchParameters)
  .then(function (searchResults) {
    console.log(searchResults)
  })
}

typeSense();




process.on('SIGINT', () => {
  // Codice per terminare il server in modo pulito
  process.exit();
});

