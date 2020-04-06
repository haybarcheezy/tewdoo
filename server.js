let express = require('express')
let mongodb = require('mongodb')
let sanitizeHTML = require('sanitize-html')

let app = express()
let db

let port = process.env.PORT
if (port == null || port == "") {
    port = 3000
}

app.use(express.static('public'))

let connectionString = 'mongodb+srv://hayden:testpassword@publiccluster-7q8ru.azure.mongodb.net/test?retryWrites=true&w=majority'
mongodb.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    db = client.db()
    app.listen(port)
})

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

function passwordProtected(req, res, next) {
    res.set('WWW-Authenticate', 'Basic realm="Simple Todo App"')
    console.log(req.headers.authorization)
    if (req.headers.authorization == "Basic aGF5ZGVuOjEyMzQ=") {
        next()
    } else {
        res.status(401).send(`<!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Error</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css" crossorigin="anonymous">
        </head>
        <body>
        <section class="hero is-fullheight is-black">
        <div class="hero-body">
          <div class="container" style="text-align: center">
            <svg width="315" height="315" viewBox="0 0 315 315" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M236.25 105H223.125V91.875C223.125 55.6894 193.686 26.25 157.5 26.25C121.314 26.25 91.875 55.6894 91.875 91.875V105H78.75C71.7881 105 65.1113 107.766 60.1884 112.688C55.2656 117.611 52.5 124.288 52.5 131.25V262.5C52.5 269.462 55.2656 276.139 60.1884 281.062C65.1113 285.984 71.7881 288.75 78.75 288.75H236.25C243.212 288.75 249.889 285.984 254.812 281.062C259.734 276.139 262.5 269.462 262.5 262.5V131.25C262.5 124.288 259.734 117.611 254.812 112.688C249.889 107.766 243.212 105 236.25 105V105ZM118.125 91.875C118.125 70.1662 135.791 52.5 157.5 52.5C179.209 52.5 196.875 70.1662 196.875 91.875V105H118.125V91.875ZM170.625 206.364V236.25H144.375V206.364C136.566 201.823 131.25 193.449 131.25 183.75C131.25 176.788 134.016 170.111 138.938 165.188C143.861 160.266 150.538 157.5 157.5 157.5C164.462 157.5 171.139 160.266 176.062 165.188C180.984 170.111 183.75 176.788 183.75 183.75C183.75 193.436 178.434 201.81 170.625 206.364V206.364Z" fill="#FDAD00"/>
            </svg>
            <h1 class="title" style="color: #fff">
                Type in the correct username and password.
            </h1>
            <button id="button" class="button" onclick="reload()">Try again</button>
          </div>

          <script>
          let button = document.getElementById('button')

          button.addEventListener("click", function() {
            window.location.reload(true);
          })

          </script>
</section>

        </body>

        `)
    }
}

app.use(passwordProtected)

app.get('/', function(req, res) {
    db.collection('items').find().toArray(function(err, items) {
        res.send(`<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple To-Do App</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
  </head>
  <body>
  <div class="container">
  <h1 class="display-4 text-center py-1">To-Do App!</h1>
  
  <div class="jumbotron p-3 shadow-sm">
  <form id="create-form" action="/create-item" method="POST">
  <div class="d-flex align-items-center">
  <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
  <button class="btn btn-primary">Add New Item</button>
  </div>
  </form>
  </div>
  
  <ul id="item-list" class="list-group pb-5">
  </ul>
  
  </div>
  
  <script>
  let items = ${JSON.stringify(items)}
  </script>

  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script src="/browser.js"></script>
  </body>
  </html>`)
    })
})

app.post('/create-item', function(req, res) {
    let safeText = sanitizeHTML(req.body.text, { allowedTags: [], allowedAttributes: {} })
    db.collection('items').insertOne({ text: safeText }, function(err, info) {
        res.json(info.ops[0])
    })
})

app.post('/update-item', function(req, res) {
    let safeText = sanitizeHTML(req.body.text, { allowedTags: [], allowedAttributes: {} })
    db.collection('items').findOneAndUpdate({ _id: new mongodb.ObjectId(req.body.id) }, { $set: { text: safeText } }, function() {
        res.send("Success")
    })
})

app.post('/delete-item', function(req, res) {
    db.collection('items').deleteOne({ _id: new mongodb.ObjectId(req.body.id) }, function() {
        res.send("Success")
    })
})