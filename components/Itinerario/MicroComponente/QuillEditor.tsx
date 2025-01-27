import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import { PlusIcon } from '../../icons';
import Picker, { Emoji, EmojiClickData, EmojiStyle, SuggestionMode, } from 'emoji-picker-react';
import ClickAwayListener from 'react-click-away-listener';
import { GrEmoji } from "react-icons/gr";
import { LiaPhotoVideoSolid } from "react-icons/lia";
import { PiImageSquareThin } from "react-icons/pi";
import { PiCameraThin } from "react-icons/pi";
import { PiFileArrowUpThin } from "react-icons/pi";

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

interface props {
  value: string
  setValue: any
}

export const QuillEditor: FC<props> = ({ value, setValue }) => {
  const [pastedImage, setPastedImage] = useState(null);
  const [valir, setValir] = useState(false)
  const inputRef = useRef(null);
  const divRef = useRef(null);
  const quillRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [attachment, setAttachment] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    console.log(event.target.files)
    setSelectedFile(event.target.files[0]);
  };

  useEffect(() => {
    const handlePaste = (event) => {
      console.log('Se ha pegado algo:', event.clipboardData);
      const items = (event.clipboardData).items;
      console.log(100052, items.length)
      for (const item of items) {
        console.log(100053, item.type)
        // Verifica si el elemento es un archivo de imagen
        if (item.type.indexOf('image') === 0) {
          console.log(100051, item)
          event.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();

            reader.onload = (event) => {
              setPastedImage(event.target.result);
            };

            reader.readAsDataURL(blob);
            break; // Sale del bucle después de encontrar la primera imagen
          }
        }
      }
      // Evita el comportamiento por defecto (opcional)

    }
    setTimeout(() => {
      const elem = divRef.current.getElementsByClassName("ql-editor")[0]
      if (elem && !valir) {
        elem.classList.add('custom-style-editor');
        elem.classList.add('my-emoji');
        elem.addEventListener('paste', handlePaste);
        setValir(true)
        elem.addEventListener('keyup', () => {
          const cursorPosition = getCursorPosition(elem);
          setCursorPosition(cursorPosition)
        });
        elem.addEventListener('input', () => {
          const cursorPosition = getCursorPosition(elem);
          setCursorPosition(cursorPosition)
        });
        elem.addEventListener('click', () => {
          const cursorPosition = getCursorPosition(elem);
          setCursorPosition(cursorPosition)
        });
        return () => {
          console.log(10050)
          elem.removeEventListener('paste', handlePaste);
        };
      }
    }, 100);
  }, [])


  const handleClick = () => {
    inputRef.current.focus();
  };

  const modules = useMemo(
    () => ({
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: false
      },
      toolbar: {
        container: [
          // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
          // [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike', { color: [] }],
          //[{ 'list': 'ordered' }, { 'list': 'bullet' }],
          //  [{ indent: '-1' }, { indent: '+1' }],
        ],
        // handlers: {
        //   image: imageHandler, 
        // },
        'emoji-toolbar': true,
        'emoji-textarea': true,
        'emoji-shortname': true
      },
      keyboard: {
        bindings: false
      }
    }),
    [],
  );

  const handleEmojiClick = (emojiObject: any) => {
    const elem = divRef.current.getElementsByClassName("ql-editor")[0]
    const content = elem.textContent
    console.log(100069, content.length)
    console.log(100070, content)
    if (cursorPosition > 0) {
      if (cursorPosition < content.length) {
        console.log(100071)
        const value = content.slice(0, cursorPosition) + emojiObject.emoji + content.slice(cursorPosition)
        setValue(value)
      } else {
        console.log(100072)
        const value = content + emojiObject.emoji
        setValue(value)
      }
    } else {
      if (content.length === 0) {
        setValue(emojiObject.emoji)
      } else {
        const value = emojiObject.emoji + content
        setValue(value)
      }
    }
    const newCP = cursorPosition + 2
    setCursorPosition(newCP)
  };

  useEffect(() => {
    console.log('Posición del cursor:', cursorPosition);

  }, [cursorPosition])


  const getCursorPosition = (editableDiv: HTMLDivElement): number => {
    let caretPos = 0;
    const sel = window.getSelection();

    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableDiv);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretPos = preCaretRange.toString().length;
    }

    return caretPos;
  }


  return (
    <>
      <div>
        {pastedImage && (
          <div className='absolute -translate-y-full'>
            <img src={pastedImage} alt="Imagen pegada" style={{ maxWidth: '100%', maxHeight: '300px' }} />
          </div>
        )}
      </div>

      <div className='flex w-full items-center space-x-2'>
        <div className='flex'>
          <div className='flex justify-center items-center'>
            <input type="file" accept='image/*' onChange={handleFileChange} id="file-upload-img" className="hidden" multiple />
            <input type="file" onChange={handleFileChange} id="file-upload-doc" className="hidden" multiple />
            <ClickAwayListener onClickAway={() => { setAttachment(false) }}>
              <div className='w-relative cursor-pointer w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
                <div className='relative -translate-y-[15px]'>
                  {attachment && (
                    <div className='bg-white w-40 absolute z-50 -translate-y-full -translate-x-4 border-gray-200 border-[1px] rounded-md'>
                      <ul onClick={() => { }} className='py-2 px-1 text-[11px]'>
                        <li className='cursor-pointer hover:bg-gray-100 rounded-md items-center'>

                          <label htmlFor="file-upload-img" className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                            <PiImageSquareThin className='w-6 h-6' />
                            <span>Fotos y videos</span>
                          </label>
                        </li>
                        {/* <li className='flex space-x-2 p-1 cursor-pointer hover:bg-gray-100 rounded-md items-center'>
                          <PiCameraThin className='w-6 h-6' />
                          <span className='font-semibold'>Cámara</span>
                        </li> */}
                        <li className='cursor-pointer hover:bg-gray-100 rounded-md items-center'>
                          <label htmlFor="file-upload-doc" className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                            <PiFileArrowUpThin className='w-6 h-6' />
                            <span>Documentos</span>
                          </label>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <PlusIcon onClick={() => {
                  setAttachment(!attachment)
                }} className="w-5 h-5 cursor-pointer text-gray-700" />
              </div>
            </ClickAwayListener>
          </div>
          <div className='flex justify-center items-center'>
            <ClickAwayListener onClickAway={() => { setShowPicker(false) }}>
              <div className='w-full relative cursor-pointer'>
                <div className='w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
                  <GrEmoji onClick={() => {
                    setShowPicker(!showPicker)
                  }} className='w-6 h-6' />
                </div>
                {showPicker && (
                  <div className='absolute -translate-x-[110px] -translate-y-[418px] scale-[70%] z-50'>
                    <Picker
                      onEmojiClick={handleEmojiClick}
                      emojiStyle={'apple  ' as EmojiStyle}
                      searchDisabled={true}
                      skinTonesDisabled={true}
                      suggestedEmojisMode={'recent' as SuggestionMode}
                      allowExpandReactions={false}
                      width={480}
                    // height={350}

                    />
                  </div>
                )}
              </div>
            </ClickAwayListener>
          </div>

        </div>
        <div ref={divRef} className='bg-white flex-1 border-[1px] border-gray-300 rounded-3xl pr-10 py-0.5'>
          <ReactQuill
            theme="bubble"
            value={value}
            onChange={setValue}
            modules={modules}
            className=''
          />
        </div>
      </div>

      <style>{`
      .custom-style-editor{
        #background: red !important;
        min-height: 16px !important;
        max-height: 98px !important;
        word-break: break-all;
      }
      .ql-editor{
        scrollbar-width: none ;
      }
      .ql-tooltip{
        transform: translateY(-320%) !important;
      }
      .ql-tooltip-arrow{
        visibility: hidden ;
      }
      `}</style>
    </>
  )
}