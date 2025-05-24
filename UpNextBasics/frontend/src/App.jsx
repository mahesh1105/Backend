import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [jokes, setJokes] = useState([]);

  useEffect(() => {
    axios.get('/api/jokes')
    .then((res) => {
      setJokes(res.data);
    })
    .catch((err) => {
      console.log(err);
    })
  }, [setJokes])

  return (
    <>
      <h1>Full Stack Project</h1>
      <p>JOKES: {jokes.length}</p>

      {
        jokes.map((joke, index) => (
          <div key={joke.id}>
            <h3>{joke.title}</h3>
            <p>{joke.content}</p>
          </div>
        ))
      }

    </>
  )
}

export default App

/*
  CORS: Cross Origin Resource Sharing
  It's a web security mechanism that allows a web page to access resources from a different domain 
  than the one that served the original web page. Think of it as a way for web browsers to communicate 
  with servers on different domains while still adhering to the "same-origin policy" for security.

  By default, browsers block HTTP requests across different domains/ports for security.

  If one application is running on port 3000 and other on 4000 then that is also a CORS
  for same origin, URL, port and other all things must be same
*/