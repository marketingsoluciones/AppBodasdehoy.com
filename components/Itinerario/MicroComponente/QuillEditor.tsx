import { FC, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import Picker, { EmojiStyle, SuggestionMode, } from 'emoji-picker-react';
import ClickAwayListener from 'react-click-away-listener';
import { GrEmoji } from "react-icons/gr";
import { PastedAndDropFile } from './InputComments';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});

interface props {
  value: string
  setValue: any
  setPastedAndDropFiles: any
  setValir: any
  pastedAndDropFiles: PastedAndDropFile[]
}

export const QuillEditor: FC<props> = ({ value, setValue, setPastedAndDropFiles, pastedAndDropFiles, setValir }) => {
  const divEditableRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0)
  const [dispachSel, setDispachSel] = useState(new Date())
  const [dispachCursorPosition, setDispachCursorPosition] = useState({ elem: undefined, d: new Date() })
  const [dispachPasteAndDropFile, setDispachPasteAndDropFile] = useState<{ payload: PastedAndDropFile, d: Date }>()
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
    const files = (event.clipboardData)?.files ?? (event.dataTransfer)?.files;
    if (files?.length) {
      event.preventDefault();
      setValir(false)
      for (const file of files) {
        const reader = new FileReader();
        const elem = divEditableRef?.current?.getElementsByClassName("ql-editor")[0]
        const content = elem.textContent
        setCursorPosition(content.length)
        setTimeout(() => {
          elem.scrollTop = elem.scrollHeight;
        }, 50);
        elem.style.boxShadow = '';
        elem.style.borderRadius = '';
        reader.onload = (event1) => {
          setDispachPasteAndDropFile({
            payload: {
              type: file.type.indexOf('image') === 0 ? "image" : "file",
              file: event1.target.result,
              name: file.name,
              size: file.size
            },
            d: new Date()
          })
        };
        reader.readAsDataURL(file)
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  useEffect(() => {
    if (dispachPasteAndDropFile?.payload) {
      if (pastedAndDropFiles?.length) {
        pastedAndDropFiles.push(dispachPasteAndDropFile.payload)
        setPastedAndDropFiles([...pastedAndDropFiles]);
      } else {
        setPastedAndDropFiles([dispachPasteAndDropFile.payload])
      }
    }
  }, [dispachPasteAndDropFile])

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
          const elementEnd = document.getElementById('seleccionado');
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
            elem.focus();
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
    const elem = document.getElementById("seleccionado")
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
        const elemPre = document.getElementById("seleccionado")
        if (elemPre) {
          elemPre.removeAttribute("id")
        }
        setTimeout(() => {
          const rango = sel?.getRangeAt(0);
          if (rango.startContainer["setAttribute"]) {
            const element = rango.startContainer as HTMLElement
            element.setAttribute("id", "seleccionado")
            element.setAttribute("focusOffset", sel.focusOffset.toString())
          } else {
            if (rango.startContainer["parentElement"]) {
              rango.startContainer.parentElement.setAttribute("id", "seleccionado")
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
        <div ref={divEditableRef} className={`bg-white min-h-[42.45px] flex-1 border-[1px] border-gray-300 rounded-3xl ${!pastedAndDropFiles && "pr-10"}`}>
          {enableEditor && <ReactQuill
            theme="bubble"
            value={value}
            onChange={(value) => {
              setValue(value)
            }}
            modules={modules}
            className=''
          />}
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