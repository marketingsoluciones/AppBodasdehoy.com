import { FC, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import Picker, { EmojiStyle, SuggestionMode, } from 'emoji-picker-react';
import ClickAwayListener from 'react-click-away-listener';
import { GrEmoji } from "react-icons/gr";
import { PastedAndDropFile } from './InputComments';
import { customAlphabet } from 'nanoid';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

interface props {
  value: string
  setValue: any
  setPastedAndDropFiles: any
  pastedAndDropFiles: PastedAndDropFile[]
}

export const QuillEditor: FC<props> = ({ value, setValue, setPastedAndDropFiles, pastedAndDropFiles }) => {
  const divEditableRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0)
  const [dispachSel, setDispachSel] = useState(new Date())
  const [dispachCursorPosition, setDispachCursorPosition] = useState({ elem: undefined, d: new Date() })
  const [enableEditor, setEnableEditor] = useState(false);
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      setEnableEditor(true)
    }
  }, [isMounted])


  const handlePaste = async (event) => {
    setDispachSel(new Date())
    const files = [...Array.from((event.clipboardData)?.files ?? (event.dataTransfer)?.files)] as File[]
    if (files?.length) {
      event.preventDefault();
      const elem = divEditableRef?.current?.getElementsByClassName("ql-editor")[0]
      const content = elem.textContent
      setCursorPosition(content.length)
      setTimeout(() => {
        elem.scrollTop = elem.scrollHeight;
      }, 50);
      elem.style.boxShadow = '';
      elem.style.borderRadius = '';
      console.log(files)
      const pastedAndDropFiles = files.map(elem => {
        return {
          saveType: "doc",//: file.type.indexOf('image') === 0 ? "image" : "file",
          _id: customAlphabet('1234567890abcdef', 24)(),
          loading: true,
          file: elem
        }
      })
      setPastedAndDropFiles([...pastedAndDropFiles]);
    }
  }

  useEffect(() => {
    try {
      // if (cursorPosition) {
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
      // }
    } catch (error) {
      console.log(error)
    }
  }, [dispachCursorPosition])

  useEffect(() => {
    try {
      if (!showPicker) {
        const elem = divEditableRef?.current?.getElementsByClassName("ql-editor")[0]
        if (elem) {
          const elementEnd = document.getElementById('selected');
          const position = elementEnd?.getAttribute("focusOffset")
          if (elementEnd && elem.textContent) {
            const range = document.createRange();
            const sel = window.getSelection();
            if (elementEnd.firstChild) {
              range.setStart(elementEnd.firstChild, parseInt(position))
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } else {
            elem.focus(); //focus cuando content vacio
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
  }, [showPicker])

  useEffect(() => {
    setTimeout(() => {
      const elem = divEditableRef?.current?.getElementsByClassName("ql-editor")[0]
      if (elem) {
        elem.classList.add('custom-style-editor');
        elem.classList.add('my-emoji');
        elem.addEventListener('paste', handlePaste);
        elem.addEventListener('dragover', (event) => {
          event.preventDefault(); // Necesario para permitir soltar
          elem.style.boxShadow = 'inset 0 0 0 2px green';
          elem.style.borderRadius = '20px';
        });
        elem.addEventListener('dragleave', (event) => {
          elem.style.boxShadow = ''; // O cualquier otro estilo que tengas definido
          elem.style.borderRadius = '';
        });
        elem.addEventListener('drop', handlePaste);
        elem.addEventListener('keyup', () => {
          setDispachSel(new Date())
          const cursorPosition = getCursorPosition(elem);
          setCursorPosition(cursorPosition)
        });
        elem.addEventListener('input', () => {
          setDispachSel(new Date())
          const cursorPosition = getCursorPosition(elem);
          setCursorPosition(cursorPosition)
        });
        elem.addEventListener('click', () => {
          setTimeout(() => {

          }, 50);
          setDispachSel(new Date())
          const cursorPosition = getCursorPosition(elem);
          setCursorPosition(cursorPosition)
        });
        elem.addEventListener('focus', () => {
          // setDispachSel(new Date())
          //setDispachCursorPosition({ elem, d: new Date() })
        });
        return () => {
          elem.removeEventListener('paste', handlePaste);
          elem.removeEventListener('drop', handlePaste);
        };
      }
    }, 500);
  }, [])

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
    const elem = document.getElementById("selected")
    if (elem) {
      const content = elem?.textContent
      const cursorPosition = parseInt(elem.getAttribute("focusOffset"))
      let value = ""
      if (cursorPosition > 0) {
        if (cursorPosition < content.length) {
          value = content.slice(0, cursorPosition) + emojiObject.emoji + content.slice(cursorPosition)
        } else {
          value = content + emojiObject.emoji
        }
      } else {
        if (content.length === 0) {
          value = emojiObject.emoji
        } else {
          value = emojiObject.emoji + content
        }
      }
      elem.textContent = value
      const newCP = cursorPosition + 2
      elem.setAttribute("focusOffset", newCP.toString())
    }
  };

  let sel1 = undefined

  useEffect(() => {
    try {
      const sel = window.getSelection();
      if (sel?.focusNode) {
        const elemPre = document.getElementById("selected")
        if (elemPre) {
          elemPre.removeAttribute("id")
        }
        setTimeout(() => {
          const rango = sel?.getRangeAt(0);
          if (rango.startContainer["setAttribute"]) {
            const element = rango.startContainer as HTMLElement
            element.setAttribute("id", "selected")
            element.setAttribute("focusOffset", sel.focusOffset.toString())
          } else {
            if (rango.startContainer["parentElement"]) {
              rango.startContainer.parentElement.setAttribute("id", "selected")
              rango.startContainer.parentElement.setAttribute("focusOffset", sel.focusOffset.toString())
            }
          }
        }, 10);
      }
    } catch (error) {
      console.log(error)
    }
  }, [dispachSel])

  const getCursorPosition = (editableDiv: HTMLDivElement): number => {
    try {
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
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <div className='flex w-full items-center space-x-2'>
        <div className='flex'>
          <div className='flex justify-center items-center select-none'>
            <ClickAwayListener onClickAway={() => { setShowPicker(false) }}>
              <div className='w-full relative cursor-pointer'>
                <div onClick={() => {
                  const elemFather: HTMLElement = divEditableRef?.current?.getElementsByClassName("ql-editor")[0]
                  const elem = elemFather.childNodes[elemFather.childNodes.length - 1] as HTMLElement
                  const cPString = elem.getAttribute("focusOffset")
                  const elemLats = document.getElementById("selected")
                  !!elemLats && elemLats.setAttribute("id", "")
                  !cPString && elem.setAttribute("focusOffset", "0")
                  elem.setAttribute("id", "selected")
                  setTimeout(() => {
                    const position = elem?.getAttribute("focusOffset")
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (elem.firstChild) {
                      range.setStart(elem.firstChild, elem.textContent ? parseInt(position) : 0)
                      range.collapse(true);
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }
                    setShowPicker(!showPicker)
                  }, 50);
                }} className='w-10 h-10 flex justify-center items-center hover:bg-gray-100 rounded-full'>
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
        <div ref={divEditableRef} className={`bg-white min-h-[42.45px] flex-1 border-[1px] border-gray-300 rounded-3xl ${!pastedAndDropFiles && "pr-10"}`}>
          {enableEditor && <ReactQuill
            theme="bubble"
            value={value}
            onChange={(value) => {
              setValue(value)
            }}
            modules={modules}
            className='comment-editor'
          />}
        </div>
      </div>
      <style>{`
      .comment-editor .custom-style-editor{
        #background: red !important;
        min-height: 16px !important;
        max-height: 98px !important;
        word-break: break-all;
      }
      .comment-editor .ql-editor{
        scrollbar-width: none;
      }
      .comment-editor .ql-tooltip{
        transform: translateY(-220%) !important;
      }
      .comment-editor .ql-tooltip-arrow{
        visibility: hidden ;
      }
      `}</style>
    </>
  )
}