import { useField } from 'formik';
import dynamic from 'next/dynamic';
import { FC, InputHTMLAttributes, useMemo } from 'react';
import 'react-quill/dist/quill.snow.css'
import 'react-quill/dist/quill.bubble.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

export const MyEditor: FC<InputHTMLAttributes<HTMLInputElement>> = ({ ...props }) => {
  const [field, meta, helpers] = useField({ name: props.name })

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
          ['bold', 'italic', 'underline', 'strike', { color: [] }],
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
      theme='snow'
      value={field.value}
      onChange={(e) => { helpers.setValue(e) }}
      className='h-[160px] mb-24 md:mb-10'
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

