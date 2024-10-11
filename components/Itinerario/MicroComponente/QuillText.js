import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'

const MyEditor = () => {
  const [value, setValue] = React.useState('');


  return (
    <ReactQuill
      value={value}
      onChange={setValue}
      modules={{
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'link', 'image']
        ]
      }}
    />
  );

};

export default MyEditor