import { FC, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import Picker, { EmojiStyle, SuggestionMode, } from 'emoji-picker-react';
import ClickAwayListener from 'react-click-away-listener';
import { GrEmoji } from "react-icons/gr";


const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

interface props {
  value: string
  setValue: any
  setPastedImage: any
  setValir: any
  pastedImage: boolean
}

export const QuillEditor: FC<props> = ({ value, setValue, setPastedImage, pastedImage, setValir }) => {
  const divEditableRef = useRef(null);
  const inputRef = useRef(null);
  const quillRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0)
  const [dispachCursorPosition, dispachSetCursorPosition] = useState({ elem: undefined, d: new Date() })

  const handlePaste = (event) => {
    setCursorPosition(0)
    setValir(false)
    const items = (event.clipboardData).items;
    for (const item of items) {
      // Verifica si el elemento es un archivo de imagen
      if (item.type.indexOf('image') === 0) {
        const elem = divEditableRef.current.getElementsByClassName("ql-editor")[0]
        const content = elem.textContent
        setCursorPosition(content.length)
        setTimeout(() => {
          elem.scrollTop = elem.scrollHeight;
        }, 50);
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


  const setFocus = () => {
    const element = dispachCursorPosition?.elem?.childNodes[0];
    if (element) {
      const textNode = element.childNodes[0];
      if (textNode.length > cursorPosition - 1) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(textNode, cursorPosition); // Posición 16
        range.collapse(true);

        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  useEffect(() => {
    if (cursorPosition) {
      setFocus()
    }
  }, [dispachCursorPosition])

  useEffect(() => {
    if (!showPicker) {
      const elem = divEditableRef.current.getElementsByClassName("ql-editor")[0]
      if (elem) {
        setFocus()
        elem.focus()
      }
    }
  }, [showPicker])

  useEffect(() => {
    setTimeout(() => {
      const elem = divEditableRef.current.getElementsByClassName("ql-editor")[0]
      if (elem) {
        elem.classList.add('custom-style-editor');
        elem.classList.add('my-emoji');
        elem.addEventListener('paste', handlePaste);
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
        elem.addEventListener('focus', () => {
          dispachSetCursorPosition({ elem, d: new Date() })
        });
        return () => {
          elem.removeEventListener('paste', handlePaste);
        };
      }
    }, 1000);
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
    const elem = divEditableRef.current.getElementsByClassName("ql-editor")[0]
    const content = elem.textContent
    if (cursorPosition > 0) {
      if (cursorPosition < content.length) {
        const value = content.slice(0, cursorPosition) + emojiObject.emoji + content.slice(cursorPosition)
        setValue(value)
        elem.textContent = value
      } else {
        const value = content + emojiObject.emoji
        setValue(value)
        elem.textContent = value
      }
    } else {
      if (content.length === 0) {
        const value = emojiObject.emoji
        setValue(value)
        elem.textContent = value
      } else {
        const value = emojiObject.emoji + content
        setValue(value)
        elem.textContent = value
      }
    }
    const newCP = cursorPosition + 2
    setCursorPosition(newCP)
  };

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
      <div className='flex w-full items-center space-x-2'>
        <div className='flex'>
          <div className='flex justify-center items-center'>
            <ClickAwayListener onClickAway={() => { setShowPicker(false) }}>
              <div className='w-full relative cursor-pointer'>
                <div onClick={() => { setShowPicker(!showPicker) }} className='w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
                  <GrEmoji className='w-6 h-6' />
                </div>
                {showPicker && (
                  <div className='absolute -translate-x-[110px] -translate-y-[418px] scale-[70%] z-50 shadow-md'>
                    <Picker
                      onEmojiClick={handleEmojiClick}
                      emojiStyle={'apple  ' as EmojiStyle}
                      searchDisabled={true}
                      skinTonesDisabled={true}
                      suggestedEmojisMode={'recent' as SuggestionMode}
                      allowExpandReactions={false}
                      width={480}
                    />
                  </div>
                )}
              </div>
            </ClickAwayListener>
          </div>
        </div>
        <div ref={divEditableRef} className={`bg-white flex-1 border-[1px] border-gray-300 rounded-3xl ${!pastedImage && "pr-10"} py-0.5`}>
          <ReactQuill
            theme="bubble"
            // value={value}
            onChange={(value) => {
              setValue(value)
            }}
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
        scrollbar-width: none;
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