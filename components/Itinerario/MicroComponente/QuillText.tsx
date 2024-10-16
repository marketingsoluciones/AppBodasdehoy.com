import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

export const MyEditor = () => {
  const [value, setValue] = useState('');

  useEffect(() => {
    console.log(value)
  }, [value])


  const modules = useMemo(
    () => ({
      toolbar: {
        history: {
          delay: 1000,
          maxStack: 100,
          userOnly: false
        },
        container: [
          // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
          // [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote', { list: 'ordered' }, { list: 'bullet' }, 'link', { color: [] }],
          ['undo', 'redo'],
          //  [{ indent: '-1' }, { indent: '+1' }],
        ],
        // handlers: {
        //   image: imageHandler, 
        // },
        'emoji-toolbar': true,
        'emoji-textarea': true,
        'emoji-shortname': true
      },
    }),
    [],
  );

  return (
    <ReactQuill
      value={value}
      onChange={setValue}
      className='h-[160px] mb-24 md:mb-16'
      modules={
        modules
        // {
        //   toolbar: [
        //     [{ header: [1, 2, false] }],
        //     ['bold', 'italic', 'underline', 'link', 'image']
        //   ]
        // }
      }
    />
  );

};

