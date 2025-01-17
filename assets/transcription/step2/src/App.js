import React from 'react';
import get from 'lodash/get';
import TranscribeEditor from 'pages/edit';
import CssBaseline from '@material-ui/core/CssBaseline';
import queryString from "query-string";


function App() {
  // const id = "123";
  // const apikey = "23123";

  const id = window.location.href.split('/')[5].split('?')[0];
  // const apikey = window.location.href.split('apikey=')[1];

  const parsed = queryString.parse(window.location.search);
  
  const apikey = parsed.apikey;
  const user = parsed.name;

  // const src = "http://media.w3.org/2010/05/bunny/movie.mp4";
  const src = `/api/watch/getvideo/${id}`;
  // const transcriptionUri = '/example.json';
  const transcriptionUri = `/api/watch/edit/${id}`;
  const updateRequestUri = `/api/watch/savedit/${id}?apikey=${apikey}`;

  const [ data, setData ] = React.useState({});

  // load data
  React.useEffect(()=>{
    fetch(transcriptionUri)
    .then((response)=>{
      return response.json();
    })
    .then((result)=>{
      setData(result);
    })
    .catch((err)=>{
      console.error(err);
    })
  },[]);

  // update data
  const handleUpdate = (chunks)=>{
    const nextData = {...data, transcription: {...data.transcription, chunks}}
    setData(nextData);

    const body = JSON.stringify(nextData);
    console.log(body)
    fetch(updateRequestUri, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: body,
    })
    .then((response)=>{
      return response;
    })
    .catch((err)=>{
      console.error(err);
    })
  }

  const chunks = get(data, ['transcription','chunks'], []);
  return (
    <React.Fragment>
      <CssBaseline/>
      <TranscribeEditor
        chunks={chunks}
        onUpdate={handleUpdate}
        src={src}
        user={user}/>
    </React.Fragment>
  );
}

export default App;
